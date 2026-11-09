import { NextResponse } from 'next/server';
import {
  getBillingCustomer,
  getSubscriptionSummary,
  isPaidPlanCode,
} from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';
import { KELVIQ_CHECKOUT_OPEN } from '@/lib/launch/policy';
import { createKelviqPortal } from '@/lib/kelviq.server';

export async function POST(request: Request) {
  try {
    const user = await requireBillingUser(request);
    const [summary, existingCustomer] = await Promise.all([
      getSubscriptionSummary(user.id, user.email),
      getBillingCustomer(user.id),
    ]);

    if (!isPaidPlanCode(summary.plan.code) || summary.status === 'basic') {
      return billingJsonError('NO_ACTIVE_SUBSCRIPTION', 'No paid subscription exists.', 400);
    }

    const portalCustomerId =
      existingCustomer?.kelviq_internal_customer_id
      || existingCustomer?.kelviq_customer_id
      || null;

    if (!KELVIQ_CHECKOUT_OPEN && !portalCustomerId) {
      return billingJsonError('BILLING_PRE_LAUNCH', 'Billing not yet available.', 403);
    }
    if (!portalCustomerId) {
      return billingJsonError('NO_ACTIVE_SUBSCRIPTION', 'No paid subscription exists.', 400);
    }

    const portal = await createKelviqPortal({ customerId: portalCustomerId });
    const portalUrl = portal.data?.url || portal.data?.portalUrl;
    if (!portalUrl) {
      return billingJsonError('KELVIQ_UNAVAILABLE', 'Kelviq portal is unavailable.', 503);
    }

    return NextResponse.json({ portalUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return billingJsonError('UNAUTHORIZED', 'Not authenticated.', 401);
    }
    console.error('[billing/portal] unavailable');
    return billingJsonError('KELVIQ_UNAVAILABLE', 'Kelviq portal is unavailable.', 503);
  }
}
