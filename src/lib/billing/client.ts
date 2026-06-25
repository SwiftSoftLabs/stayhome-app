import type { BillingSummaryMvp } from '@/types/billing';
import { markCheckoutOpen } from '@/lib/billing/checkout-session';

async function parseBillingResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

export async function fetchBillingSummary() {
  const response = await fetch('/api/billing/summary', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  return parseBillingResponse<BillingSummaryMvp>(response);
}

export async function abandonBillingCheckout() {
  const response = await fetch('/api/billing/checkout/abandon', {
    method: 'POST',
    credentials: 'include',
  });
  return parseBillingResponse<{ ok: boolean; summary: BillingSummaryMvp }>(response);
}

export async function startBillingCheckout(planCode: string) {
  const response = await fetch('/api/billing/checkout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planCode }),
  });
  const payload = await parseBillingResponse<{ checkoutUrl: string }>(response);
  markCheckoutOpen();
  return payload;
}

export async function openBillingPortal() {
  const response = await fetch('/api/billing/portal', {
    method: 'POST',
    credentials: 'include',
  });
  return parseBillingResponse<{ portalUrl: string }>(response);
}

export async function cancelBillingSubscription() {
  const response = await fetch('/api/billing/cancel', {
    method: 'POST',
    credentials: 'include',
  });
  return parseBillingResponse<{ ok: boolean }>(response);
}
