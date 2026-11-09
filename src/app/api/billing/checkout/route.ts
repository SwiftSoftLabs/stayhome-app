import { KELVIQ_CHECKOUT_OPEN } from '@/lib/launch/policy';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';

/**
 * Free launch. Kelviq checkout stays closed, including tester and sandbox
 * variants. In-home audits, when a real paid product exists, are Stripe
 * Connect charges and are not started here.
 */
export async function POST(request: Request) {
  try {
    await requireBillingUser(request);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return billingJsonError('UNAUTHORIZED', 'Not authenticated.', 401);
    }
    console.error('[billing/checkout]', error instanceof Error ? error.name : 'error');
    return billingJsonError('BILLING_PRE_LAUNCH', 'Billing not yet available.', 403);
  }

  if (!KELVIQ_CHECKOUT_OPEN) {
    return billingJsonError('BILLING_PRE_LAUNCH', 'Billing not yet available.', 403);
  }

  return billingJsonError('BILLING_PRE_LAUNCH', 'Billing not yet available.', 403);
}
