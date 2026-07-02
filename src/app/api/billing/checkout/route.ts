import { NextResponse } from 'next/server';
import { getAppOrigin } from '@/lib/app-origin';
import {
  createPendingSubscription,
  getBillingCustomer,
  isBillingTester,
  upsertBillingCustomer,
} from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';
import {
  createKelviqCheckout,
  createKelviqCustomer,
  getKelviqVariantId,
} from '@/lib/kelviq.server';

export async function POST(request: Request) {
  try {
    const user = await requireBillingUser(request);
    const body = (await request.json()) as { planCode?: string };
    const planCode = body.planCode?.trim();

    if (!planCode) {
      return billingJsonError('INVALID_PLAN_CODE', 'Plan code is required.', 400);
    }

    const variantId = getKelviqVariantId(planCode);
    if (!variantId) {
      return billingJsonError('INVALID_PLAN_CODE', 'Unknown or inactive plan selected.', 400);
    }

    if (process.env.BILLING_PRE_LAUNCH === 'true' && !isBillingTester(user.email)) {
      return billingJsonError('BILLING_PRE_LAUNCH', 'Billing not yet available.', 403);
    }

    let customer = await getBillingCustomer(user.id);
    const kelviqCustomer = await createKelviqCustomer({
      email: user.email || `${user.id}@example.com`,
      externalCustomerId: user.id,
    });

    customer = await upsertBillingCustomer({
      user_id: user.id,
      kelviq_customer_id:
        kelviqCustomer.data?.portal_customer_id
        || kelviqCustomer.data?.customer_id
        || user.id,
      kelviq_internal_customer_id: kelviqCustomer.data?.internal_id || null,
      billing_email: user.email || `${user.id}@example.com`,
      created_at: customer?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await createPendingSubscription(user.id, planCode);

    const origin = getAppOrigin(request);
    const checkout = await createKelviqCheckout({
      variantId,
      customerId: customer.kelviq_customer_id || user.id,
      internalCustomerId: customer.kelviq_internal_customer_id,
      successUrl: `${origin}/dashboard/family/billing?checkout=success`,
      cancelUrl: `${origin}/dashboard/family/billing?checkout=canceled`,
    });

    const checkoutUrl = checkout.data?.url || checkout.data?.checkoutUrl;
    if (!checkoutUrl) {
      return billingJsonError('KELVIQ_UNAVAILABLE', 'Kelviq checkout is unavailable.', 503);
    }

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return billingJsonError('UNAUTHORIZED', 'Not authenticated.', 401);
    }
    if (error instanceof Error && error.message === 'INVALID_PLAN_CODE') {
      return billingJsonError('INVALID_PLAN_CODE', 'Unknown or inactive plan selected.', 400);
    }
    if (error instanceof Error && error.message === 'ALREADY_SUBSCRIBED') {
      return billingJsonError('ALREADY_SUBSCRIBED', 'You already have an active paid plan.', 400);
    }
    console.error('[billing/checkout]', error);
    return billingJsonError('KELVIQ_UNAVAILABLE', 'Kelviq checkout is unavailable.', 503);
  }
}
