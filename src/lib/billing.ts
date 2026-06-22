import { buildSet, query } from '@/lib/db';
import type {
  BillingCustomerRecord,
  BillingPlanRecord,
  BillingStatus,
  BillingSummaryMvp,
  UserSubscriptionRecord,
} from '@/types/billing';

const PRELAUNCH_ENABLED = process.env.BILLING_PRE_LAUNCH === 'true';
const TESTER_EMAILS = (process.env.BILLING_TESTER_EMAILS || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const PAID_PLAN_CODES = new Set(['pro']);

export function isPaidStatus(status: BillingStatus) {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

export function isPaidPlanCode(planCode: string) {
  return PAID_PLAN_CODES.has(planCode);
}

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
  const result = await query<BillingPlanRecord>(
    `SELECT * FROM billing_plans WHERE active = true ORDER BY sort_order ASC`,
  );
  return new Map(result.rows.map((plan) => [plan.code, plan]));
}

export async function listBillingPlans() {
  const result = await query<BillingPlanRecord>(
    `SELECT * FROM billing_plans WHERE active = true ORDER BY sort_order ASC`,
  );
  return result.rows;
}

export async function getBillingCustomer(userId: string) {
  const result = await query<BillingCustomerRecord>(
    `SELECT * FROM billing_customers WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function upsertBillingCustomer(input: BillingCustomerRecord) {
  const result = await query<BillingCustomerRecord>(
    `INSERT INTO billing_customers
       (user_id, kelviq_customer_id, kelviq_internal_customer_id, billing_email, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET
       kelviq_customer_id = EXCLUDED.kelviq_customer_id,
       kelviq_internal_customer_id = EXCLUDED.kelviq_internal_customer_id,
       billing_email = EXCLUDED.billing_email,
       updated_at = now()
     RETURNING *`,
    [
      input.user_id,
      input.kelviq_customer_id,
      input.kelviq_internal_customer_id,
      input.billing_email,
      input.created_at,
      input.updated_at,
    ],
  );
  return result.rows[0] as BillingCustomerRecord;
}

export async function getUserSubscription(userId: string) {
  await ensureBasicSubscription(userId);

  const result = await query<UserSubscriptionRecord>(
    `SELECT * FROM user_subscriptions WHERE user_id = $1`,
    [userId],
  );

  if (!result.rows[0]) {
    throw new Error('Subscription not found after ensure_basic_subscription_for_user');
  }

  return result.rows[0];
}

export async function getSubscriptionSummary(
  userId: string,
  email?: string | null,
): Promise<BillingSummaryMvp> {
  const [plans, subscription, catalog] = await Promise.all([
    getPlanMap(),
    getUserSubscription(userId),
    listBillingPlans(),
  ]);
  const plan = plans.get(subscription.plan_code);

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
      enabled: PRELAUNCH_ENABLED,
      is_tester: isBillingTester(email),
    },
    availablePlans: catalog
      .filter((entry) => isPaidPlanCode(entry.code))
      .map((entry) => ({
        code: entry.code,
        name: entry.name,
        price_cents: entry.price_cents,
        currency: entry.currency,
        interval: entry.interval,
      })),
  };
}

export async function applySubscriptionTransition(
  userId: string,
  patch: Partial<UserSubscriptionRecord>,
) {
  const subscription = await getUserSubscription(userId);
  if (subscription.is_manual) return subscription;

  const resolvedPatch = resolveCanceledTransition(subscription, { ...patch });
  const { clause, params, nextIdx } = buildSet(resolvedPatch as Record<string, unknown>);

  if (!clause) return subscription;

  const result = await query<UserSubscriptionRecord>(
    `UPDATE user_subscriptions
     SET ${clause}, updated_at = now()
     WHERE user_id = $${nextIdx}
     RETURNING *`,
    [...params, userId],
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

  const result = await query<UserSubscriptionRecord>(
    `UPDATE user_subscriptions
     SET plan_code = $1, status = 'pending', unit_price_cents = $2, currency = $3,
         cancel_at_period_end = false, canceled_at = NULL, past_due_grace_ends_at = NULL, updated_at = now()
     WHERE user_id = $4
     RETURNING *`,
    [plan.code, plan.price_cents, plan.currency, userId],
  );

  if (!result.rows[0]) throw new Error('Subscription not found');
  return result.rows[0];
}

export async function findBillingOwnerByKelviqCustomerId(customerId: string | null | undefined) {
  if (!customerId) return null;

  const result = await query<BillingCustomerRecord>(
    `SELECT * FROM billing_customers
     WHERE kelviq_customer_id = $1 OR kelviq_internal_customer_id = $1`,
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
      `SELECT * FROM billing_customers WHERE lower(billing_email) = lower($1) LIMIT 1`,
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
  const result = await query<{ provider_event_id: string; status: string }>(
    `INSERT INTO billing_events
       (provider_event_id, event_type, owner_id, payload, status, processed_at)
     VALUES ($1, $2, $3, $4::jsonb, 'received', now())
     ON CONFLICT (provider_event_id) DO NOTHING
     RETURNING provider_event_id, status`,
    [
      input.provider_event_id,
      input.event_type,
      input.owner_id ?? null,
      JSON.stringify(input.payload),
    ],
  );

  if (result.rows[0]) {
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
    `INSERT INTO billing_events
       (provider_event_id, event_type, owner_id, payload, status, error, processed_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, now())
     ON CONFLICT (provider_event_id) DO UPDATE SET
       event_type = EXCLUDED.event_type,
       owner_id = EXCLUDED.owner_id,
       payload = EXCLUDED.payload,
       status = EXCLUDED.status,
       error = EXCLUDED.error,
       processed_at = now(),
       updated_at = now()`,
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

export async function getBillingEvent(providerEventId: string) {
  const result = await query<{ status: string }>(
    `SELECT status FROM billing_events WHERE provider_event_id = $1`,
    [providerEventId],
  );
  return result.rows[0] ?? null;
}
