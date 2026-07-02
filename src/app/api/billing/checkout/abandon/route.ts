import { NextResponse } from 'next/server';
import { abandonPendingCheckout, getSubscriptionSummary } from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';

export async function POST(request: Request) {
  try {
    const user = await requireBillingUser(request);
    await abandonPendingCheckout(user.id);
    const summary = await getSubscriptionSummary(user.id, user.email);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return billingJsonError('UNAUTHORIZED', 'Not authenticated.', 401);
    }
    console.error('[billing/checkout/abandon]', error);
    return billingJsonError('ABANDON_FAILED', 'Unable to reset checkout state.', 500);
  }
}
