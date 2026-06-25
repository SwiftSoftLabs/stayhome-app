import { NextResponse } from 'next/server';
import {
  applySubscriptionTransition,
  claimBillingEvent,
  extractKelviqCancelAtPeriodEnd,
  extractKelviqPeriodEnd,
  findBillingOwnerFromWebhookPayload,
  getUserSubscription,
  isDeferredCancelActive,
  kelviqPlanIdentifierToPlanCode,
  normalizeKelviqStatus,
  recordBillingEvent,
} from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { verifyKelviqWebhookSignature } from '@/lib/kelviq.server';

export const runtime = 'nodejs';

function asRecord(val: unknown): Record<string, unknown> | undefined {
  return typeof val === 'object' && val !== null ? (val as Record<string, unknown>) : undefined;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyKelviqWebhookSignature(rawBody, request.headers)) {
    return billingJsonError('INVALID_SIGNATURE', 'Invalid webhook signature.', 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return billingJsonError('INVALID_PAYLOAD', 'Malformed webhook payload.', 400);
  }

  const eventId = typeof payload.id === 'string' ? payload.id : undefined;
  const eventType = typeof payload.type === 'string' ? payload.type : undefined;
  const eventObject = asRecord(asRecord(payload.data)?.object);

  if (!eventId || !eventType) {
    return billingJsonError('INVALID_PAYLOAD', 'Malformed webhook payload.', 400);
  }

  const customer = await findBillingOwnerFromWebhookPayload(eventObject);
  const claim = await claimBillingEvent({
    provider_event_id: eventId,
    event_type: eventType,
    owner_id: customer?.user_id || null,
    payload,
  });

  if (!claim.claimed && claim.alreadyProcessed) {
    return NextResponse.json({ ok: true });
  }

  if (!claim.claimed) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (customer?.user_id) {
      const isSubscriptionEvent = eventType.startsWith('subscription.');
      const subscriptionId =
        typeof eventObject?.subscription_id === 'string' ? eventObject.subscription_id
        : isSubscriptionEvent && typeof eventObject?.id === 'string' ? eventObject.id
        : undefined;

      const planObj = asRecord(eventObject?.plan);
      const rawPlanId =
        typeof planObj?.identifier === 'string' ? planObj.identifier
        : typeof eventObject?.plan_code === 'string' ? eventObject.plan_code
        : typeof eventObject?.variant_code === 'string' ? eventObject.variant_code
        : typeof eventObject?.planIdentifier === 'string' ? eventObject.planIdentifier
        : undefined;

      const planCode = kelviqPlanIdentifierToPlanCode(rawPlanId);
      const status = normalizeKelviqStatus(eventObject?.status, eventType);
      const currentPeriodEnd = extractKelviqPeriodEnd(eventObject);
      const cancelAtPeriodEnd = extractKelviqCancelAtPeriodEnd(eventObject);
      const isCancelledEvent =
        eventType === 'subscription.cancelled' || eventType === 'subscription.canceled';
      const kelviqUpdatedAt = new Date().toISOString();

      if (isCancelledEvent || status === 'canceled') {
        const localSubscription = await getUserSubscription(customer.user_id);
        if (isDeferredCancelActive(localSubscription)) {
          await applySubscriptionTransition(customer.user_id, {
            kelviq_updated_at: kelviqUpdatedAt,
          });
        } else {
          const pendingCancel = cancelAtPeriodEnd === true;
          await applySubscriptionTransition(customer.user_id, {
            plan_code: planCode,
            status: 'canceled',
            kelviq_subscription_id: subscriptionId,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: pendingCancel ? true : cancelAtPeriodEnd === false ? false : undefined,
            canceled_at: isCancelledEvent ? new Date().toISOString() : undefined,
            kelviq_updated_at: kelviqUpdatedAt,
          });
        }
      } else {
        await applySubscriptionTransition(customer.user_id, {
          plan_code: planCode,
          status: status || undefined,
          kelviq_subscription_id: subscriptionId,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd === true ? true : cancelAtPeriodEnd === false ? false : undefined,
          kelviq_updated_at: kelviqUpdatedAt,
        });
      }
    } else if (
      eventType.startsWith('subscription.')
      || eventType.startsWith('checkout.')
      || eventType.startsWith('invoice.')
    ) {
      console.error(`[kelviq webhook] no billing owner resolved for ${eventType}`);
    }

    await recordBillingEvent({
      provider_event_id: eventId,
      event_type: eventType,
      owner_id: customer?.user_id || null,
      payload,
      status: 'processed',
    });
  } catch (error) {
    await recordBillingEvent({
      provider_event_id: eventId,
      event_type: eventType,
      owner_id: customer?.user_id || null,
      payload,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown webhook failure',
    });
  }

  return NextResponse.json({ ok: true });
}
