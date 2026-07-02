import { fetchBillingSummary } from '@/lib/billing/client';
import type { BillingSummaryMvp } from '@/types/billing';

const CHECKOUT_ACTIVATING_KEY = 'stayhome_checkout_activating';
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 45;

let activationPollPromise: Promise<BillingSummaryMvp | null> | null = null;
let activationOnUpdate: ((summary: BillingSummaryMvp | null) => void) | undefined;

export function isCheckoutActivatingSession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(CHECKOUT_ACTIVATING_KEY) === '1';
}

export function beginCheckoutActivatingSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(CHECKOUT_ACTIVATING_KEY, '1');
  }
}

export function endCheckoutActivatingSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CHECKOUT_ACTIVATING_KEY);
  }
}

function isActivated(summary: BillingSummaryMvp | null): boolean {
  return summary?.status === 'active' || summary?.status === 'trialing';
}

export async function pollCheckoutActivation(
  onUpdate?: (summary: BillingSummaryMvp | null) => void,
): Promise<{ summary: BillingSummaryMvp | null; activated: boolean }> {
  activationOnUpdate = onUpdate;

  if (!activationPollPromise) {
    activationPollPromise = (async () => {
      try {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
          const summary = await fetchBillingSummary();
          activationOnUpdate?.(summary);
          if (isActivated(summary)) {
            return summary;
          }
          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          }
        }

        const summary = await fetchBillingSummary();
        activationOnUpdate?.(summary);
        return summary;
      } finally {
        activationPollPromise = null;
        activationOnUpdate = undefined;
        endCheckoutActivatingSession();
      }
    })();
  }

  const summary = await activationPollPromise;
  return { summary, activated: isActivated(summary) };
}
