import { NextResponse } from 'next/server';
import { getSubscriptionSummary } from '@/lib/billing';
import { billingJsonError } from '@/lib/billing/http';
import { requireBillingUser } from '@/lib/billing/require-user';

export async function GET(request: Request) {
  try {
    const user = await requireBillingUser(request);
    const summary = await getSubscriptionSummary(user.id, user.email);
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return billingJsonError('UNAUTHORIZED', 'Not authenticated.', 401);
    }
    console.error('[billing/summary]', error);
    return billingJsonError('BILLING_SUMMARY_ERROR', 'Unable to load billing summary.', 500);
  }
}
