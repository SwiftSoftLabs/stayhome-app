import { NextResponse } from 'next/server';
import { applySubscriptionTransition, getUserSubscription } from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';
import { cancelKelviqSubscription } from '@/lib/kelviq.server';

export async function POST(request: Request) {
  try {
    const user = await requireBillingUser(request);
    const subscription = await getUserSubscription(user.id);

    if (subscription.is_manual) {
      return billingJsonError('MANUAL_SUBSCRIPTION', 'Manual subscriptions cannot be changed automatically.', 403);
    }

    if (subscription.plan_code === 'basic' || !subscription.kelviq_subscription_id) {
      return billingJsonError('ALREADY_BASIC', 'No active paid subscription to cancel.', 400);
    }

    if (subscription.cancel_at_period_end) {
      return billingJsonError('CANCELLATION_ALREADY_SCHEDULED', 'Cancellation is already scheduled.', 400);
    }

    await cancelKelviqSubscription(subscription.kelviq_subscription_id, {
      cancellationType: 'IMMEDIATE',
    });

    await applySubscriptionTransition(user.id, {
      cancel_at_period_end: true,
      canceled_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return billingJsonError('UNAUTHORIZED', 'Not authenticated.', 401);
    }
    console.error('[billing/cancel]', error);
    return billingJsonError('KELVIQ_UNAVAILABLE', 'Unable to cancel the subscription.', 503);
  }
}
