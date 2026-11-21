import { query } from '@/lib/db';
import {
  KELVIQ_CHECKOUT_OPEN,
  isPaidPlanCode,
  isPaidStatus,
} from '@/lib/launch/policy';
import type {
  BillingCustomerRecord,
  BillingPlanRecord,
  BillingStatus,
  BillingSummaryMvp,
  UserSubscriptionRecord,
} from '@/types/billing';

export { isPaidPlanCode, isPaidStatus, shouldApplyKelviqEntitlement } from '@/lib/launch/policy';

// RLS is on for the billing tables and our role cannot add policies (they are owned by the
// platform superuser), so every read and write goes through SECURITY DEFINER functions in
// app_stayhome_billing. See migrations/20261221120000_app-stayhome-billing-definer.sql.
const FN = 'app_stayhome_billing';

const PRELAUNCH_ENABLED = process.env.BILLING_PRE_LAUNCH !== 'false';
const TESTER_EMAILS = (process.env.BILLING_TESTER_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function isDeferredCancelActive(subscription: UserSubscriptionRecord): boolean {
  return subscription.cancel_at_period_end === true
    && !!subscription.current_period_end
    && new Date(subscription.current_period_end).getTime() > Date.now();
}

function getEffectivePeriodEndTs(
  patch: Partial<UserSubscriptionRecord>,
  subscription: UserSubscriptionRecord,
): number | null {
  const raw = patch.current_period_end !== undefined
    ? patch.current_period_end
    : subscription.current_period_end;
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}

export function resolveCanceledTransition(
  subscription: UserSubscriptionRecord,
  patch: Partial<UserSubscriptionRecord>,
): Partial<UserSubscriptionRecord> {
  const incomingStatus = patch.status;
  if (incomingStatus !== 'canceled') {
    return patch;
  }

  if (patch.cancel_at_period_end === false) {
    return {
      ...patch,
      plan_code: 'basic',
      status: 'basic',
      unit_price_cents: 0,
      currency: 'usd',
      cancel_at_period_end: false,
      past_due_grace_ends_at: null,
      current_period_end: null,
      kelviq_subscription_id: null,
    };
  }

  const pendingCancel =
    patch.cancel_at_period_end === true
    || (patch.cancel_at_period_end === undefined && subscription.cancel_at_period_end);

  if (pendingCancel) {
    const periodEndTs = getEffectivePeriodEndTs(patch, subscription);
    const futureAccess = periodEndTs === null || periodEndTs > Date.now();
    if (futureAccess) {
      const paidStatus = isPaidStatus(subscription.status) ? subscription.status : 'active';
      return {
        ...patch,
        cancel_at_period_end: true,
        plan_code: patch.plan_code ?? subscription.plan_code,
        status: paidStatus,
      };
    }
  }

  return {
    ...patch,
    plan_code: 'basic',
    status: 'basic',
    unit_price_cents: 0,
    currency: 'usd',
    cancel_at_period_end: false,
    past_due_grace_ends_at: null,
    current_period_end: null,
    kelviq_subscription_id: null,
  };
}

export function isBillingTester(email: string | null | undefined) {
  if (!email) return false;
  return TESTER_EMAILS.includes(email.toLowerCase());
}

export async function ensureBasicSubscription(userId: string) {
  await query(`SELECT ensure_basic_subscription_for_user($1)`, [userId]);
}

async function getPlanMap() {
  const result = await query<BillingPlanRecord>(`SELECT * FROM ${FN}.list_active_plans()`);
  return new Map(result.rows.map((plan) => [plan.code, plan]));
}

export async function listBillingPlans() {
  const result = await query<BillingPlanRecord>(`SELECT * FROM ${FN}.list_active_plans()`);
  return result.rows;
}

export async function getBillingCustomer(userId: string) {
  const result = await query<BillingCustomerRecord>(
    `SELECT * FROM ${FN}.get_customer($1)`,
    [userId],
  );
  return result.rows[0] ?? null;
}

/** The row as stored, without creating a basic subscription first. */
export async function getRawUserSubscription(userId: string) {
  const result = await query<UserSubscriptionRecord>(
    `SELECT * FROM ${FN}.get_subscription($1)`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function getUserSubscription(userId: string) {
  await ensureBasicSubscription(userId);

  const subscription = await getRawUserSubscription(userId);
  if (!subscription) {
    throw new Error('Subscription not found after ensure_basic_subscription_for_user');
  }

  return subscription;
}

export async function getSubscriptionSummary(
  userId: string,
  email?: string | null,
): Promise<BillingSummaryMvp> {
  const subscription = await getUserSubscription(userId);
  const [planResult, catalog] = await Promise.all([
    query<BillingPlanRecord>(`SELECT * FROM ${FN}.get_plan($1)`, [subscription.plan_code]),
    listBillingPlans(),
  ]);
  const plan = planResult.rows[0];

  if (!plan) {
    throw new Error('INVALID_PLAN_CODE');
  }

  const pendingCancelExpired =
    subscription.cancel_at_period_end
    && subscription.current_period_end
    && new Date(subscription.current_period_end).getTime() < Date.now();

  if (pendingCancelExpired && !subscription.is_manual) {
    await applySubscriptionTransition(userId, {
      plan_code: 'basic',
      status: 'basic',
      unit_price_cents: 0,
      currency: 'usd',
      cancel_at_period_end: false,
      current_period_end: null,
      canceled_at: null,
      kelviq_subscription_id: null,
      kelviq_updated_at: new Date().toISOString(),
    });
    return getSubscriptionSummary(userId, email);
  }

  return {
    plan: {
      code: plan.code,
      name: plan.name,
      price_cents: plan.price_cents,
      currency: plan.currency,
      interval: plan.interval,
    },
    status: subscription.status,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at,
    kelviq_subscription_id: subscription.kelviq_subscription_id,
    is_manual: subscription.is_manual,
    prelaunch: {
      enabled: PRELAUNCH_ENABLED || !KELVIQ_CHECKOUT_OPEN,
      is_tester: isBillingTester(email),
    },
    availablePlans: KELVIQ_CHECKOUT_OPEN
      ? catalog
        .filter((entry) => isPaidPlanCode(entry.code))
        .map((entry) => ({
          code: entry.code,
          name: entry.name,
          price_cents: entry.price_cents,
          currency: entry.currency,
          interval: entry.interval,
        }))
      : [],
  };
}

export async function applySubscriptionTransition(
  userId: string,
  patch: Partial<UserSubscriptionRecord>,
) {
  const subscription = await getUserSubscription(userId);
  if (subscription.is_manual) return subscription;

  const resolvedPatch = resolveCanceledTransition(subscription, { ...patch });
  const patchJson = subscriptionPatchJson(resolvedPatch);
  if (!patchJson) return subscription;

  return updateSubscriptionRow(userId, patchJson);
}

/** JSON patch for update_subscription: undefined keys are dropped (as buildSet did), null is kept. */
export function subscriptionPatchJson(patch: Partial<UserSubscriptionRecord>): string | null {
  const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
  return entries.length ? JSON.stringify(Object.fromEntries(entries)) : null;
}

async function updateSubscriptionRow(userId: string, patchJson: string) {
  const result = await query<UserSubscriptionRecord>(
    `SELECT * FROM ${FN}.update_subscription($1, $2::jsonb)`,
    [userId, patchJson],
  );
  return result.rows[0] as UserSubscriptionRecord;
}

export async function abandonPendingCheckout(userId: string) {
  const subscription = await getUserSubscription(userId);
  if (subscription.is_manual || subscription.status !== 'pending') {
    return subscription;
  }

  return applySubscriptionTransition(userId, {
    plan_code: 'basic',
    status: 'basic',
    unit_price_cents: 0,
    currency: 'usd',
    kelviq_subscription_id: null,
    current_period_end: null,
    cancel_at_period_end: false,
    canceled_at: null,
    past_due_grace_ends_at: null,
  });
}

export async function createPendingSubscription(userId: string, planCode: string) {
  if (!KELVIQ_CHECKOUT_OPEN) {
    throw new Error('BILLING_PRE_LAUNCH');
  }
  const plans = await getPlanMap();
  const plan = plans.get(planCode);
  if (!plan || !plan.active || !isPaidPlanCode(plan.code)) {
    throw new Error('INVALID_PLAN_CODE');
  }

  await ensureBasicSubscription(userId);

  const subscription = await getUserSubscription(userId);
  if (subscription.plan_code === planCode && isPaidStatus(subscription.status)) {
    throw new Error('ALREADY_SUBSCRIBED');
  }

  const updated = await updateSubscriptionRow(userId, subscriptionPatchJson({
    plan_code: plan.code,
    status: 'pending',
    unit_price_cents: plan.price_cents,
    currency: plan.currency,
    cancel_at_period_end: false,
    canceled_at: null,
    past_due_grace_ends_at: null,
  })!);

  if (!updated) throw new Error('Subscription not found');
  return updated;
}

export async function findBillingOwnerByKelviqCustomerId(customerId: string | null | undefined) {
  if (!customerId) return null;

  const result = await query<BillingCustomerRecord>(
    `SELECT * FROM ${FN}.find_customer_by_kelviq_id($1)`,
    [customerId],
  );

  return result.rows[0] ?? null;
}

export function extractKelviqPeriodEnd(source: Record<string, unknown> | undefined) {
  if (!source) return undefined;
  if (typeof source.current_period_end === 'string') return source.current_period_end;
  if (typeof source.currentPeriodEnd === 'string') return source.currentPeriodEnd;
  if (typeof source.billing_period_end_time === 'string') return source.billing_period_end_time;
  if (typeof source.billingPeriodEndTime === 'string') return source.billingPeriodEndTime;
  if (typeof source.end_date === 'string') return source.end_date;
  return undefined;
}

export function extractKelviqCancelAtPeriodEnd(source: Record<string, unknown> | undefined) {
  if (!source) return undefined;
  if (typeof source.cancel_at_period_end === 'boolean') return source.cancel_at_period_end;
  if (typeof source.cancelAtPeriodEnd === 'boolean') return source.cancelAtPeriodEnd;
  return undefined;
}

export function kelviqPlanIdentifierToPlanCode(rawPlanId: string | undefined) {
  if (!rawPlanId) return undefined;
  const stripped = rawPlanId.replace(/^stayhome-/, '').toLowerCase();
  if (stripped === 'pro') return 'pro';
  return undefined;
}

export function normalizeKelviqStatus(raw: unknown, eventType?: string): BillingStatus | null {
  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase();
    if (normalized === 'cancelled') return 'canceled';
    if (normalized === 'complete' || normalized === 'completed' || normalized === 'success' || normalized === 'paid') {
      return 'active';
    }
    if (
      normalized === 'basic'
      || normalized === 'pending'
      || normalized === 'active'
      || normalized === 'trialing'
      || normalized === 'past_due'
      || normalized === 'canceled'
    ) {
      return normalized as BillingStatus;
    }
  }

  if (
    eventType === 'checkout.completed'
    || eventType === 'invoice.paid'
    || eventType === 'subscription.created'
  ) {
    return 'active';
  }

  return null;
}

export async function findBillingOwnerFromWebhookPayload(
  eventObject: Record<string, unknown> | undefined,
) {
  if (!eventObject) return null;

  const customerObj =
    typeof eventObject.customer === 'object' && eventObject.customer !== null
      ? (eventObject.customer as Record<string, unknown>)
      : undefined;

  const candidateIds = [
    eventObject.customer_id,
    eventObject.customerId,
    customerObj?.id,
    customerObj?.customer_id,
    customerObj?.customerId,
    typeof eventObject.customer === 'string' ? eventObject.customer : undefined,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  for (const id of candidateIds) {
    const owner = await findBillingOwnerByKelviqCustomerId(id);
    if (owner) return owner;
  }

  const candidateEmails = [
    customerObj?.email,
    eventObject.email,
    typeof eventObject.metadata === 'object' && eventObject.metadata !== null
      ? (eventObject.metadata as Record<string, unknown>).email
      : undefined,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  for (const email of candidateEmails) {
    const result = await query<BillingCustomerRecord>(
      `SELECT * FROM ${FN}.find_customer_by_email($1)`,
      [email],
    );
    if (result.rows[0]) return result.rows[0];
  }

  return null;
}

export async function claimBillingEvent(input: {
  provider_event_id: string;
  event_type: string;
  owner_id?: string | null;
  payload: Record<string, unknown>;
}) {
  const result = await query<{ claimed: boolean }>(
    `SELECT ${FN}.claim_event($1, $2, $3, $4::jsonb) AS claimed`,
    [
      input.provider_event_id,
      input.event_type,
      input.owner_id ?? null,
      JSON.stringify(input.payload),
    ],
  );

  if (result.rows[0]?.claimed) {
    return { claimed: true, alreadyProcessed: false };
  }

  const existing = await getBillingEvent(input.provider_event_id);
  return {
    claimed: false,
    alreadyProcessed: existing?.status === 'processed',
  };
}

export async function recordBillingEvent(input: {
  provider_event_id: string;
  event_type: string;
  owner_id?: string | null;
  payload: Record<string, unknown>;
  status?: 'received' | 'processed' | 'failed';
  error?: string | null;
}) {
  await query(
    `SELECT ${FN}.record_event($1, $2, $3, $4::jsonb, $5, $6)`,
    [
      input.provider_event_id,
      input.event_type,
      input.owner_id ?? null,
      JSON.stringify(input.payload),
      input.status ?? 'received',
      input.error ?? null,
    ],
  );
}

export async function deleteUserBilling(userId: string) {
  await query(`SELECT ${FN}.delete_user_billing($1)`, [userId]);
}

export async function getBillingEvent(providerEventId: string) {
  const result = await query<{ status: string | null }>(
    `SELECT ${FN}.get_event_status($1) AS status`,
    [providerEventId],
  );
  const status = result.rows[0]?.status;
  return status ? { status } : null;
}
