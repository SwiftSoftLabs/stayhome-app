import { NextResponse } from 'next/server';
import {
  getBillingCustomer,
  getSubscriptionSummary,
  isPaidPlanCode,
  upsertBillingCustomer,
} from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';
import { createKelviqCustomer, createKelviqPortal } from '@/lib/kelviq.server';

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

    const kelviqCustomer = await createKelviqCustomer({
      email: existingCustomer?.billing_email || user.email || `${user.id}@example.com`,
      externalCustomerId: user.id,
    });

    const portalCustomerId =
      kelviqCustomer.data?.portal_customer_id
      || kelviqCustomer.data?.customer_id
      || existingCustomer?.kelviq_customer_id;

    if (!portalCustomerId) {
      return billingJsonError('NO_ACTIVE_SUBSCRIPTION', 'No paid subscription exists.', 400);
    }

    if (kelviqCustomer.data?.customer_id || kelviqCustomer.data?.internal_id) {
      await upsertBillingCustomer({
        user_id: user.id,
        kelviq_customer_id:
          kelviqCustomer.data?.portal_customer_id
          || kelviqCustomer.data?.customer_id
          || portalCustomerId,
        kelviq_internal_customer_id:
          kelviqCustomer.data?.internal_id || existingCustomer?.kelviq_internal_customer_id || null,
        billing_email: existingCustomer?.billing_email || user.email || `${user.id}@example.com`,
        created_at: existingCustomer?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
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
    console.error('[billing/portal]', error);
    return billingJsonError('KELVIQ_UNAVAILABLE', 'Kelviq portal is unavailable.', 503);
  }
}
