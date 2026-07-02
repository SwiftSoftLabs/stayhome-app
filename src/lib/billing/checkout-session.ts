const CHECKOUT_OPEN_KEY = 'stayhome_checkout_open';
const CHECKOUT_NEEDS_ABANDON_KEY = 'stayhome_checkout_needs_abandon';

export function markCheckoutOpen() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CHECKOUT_OPEN_KEY, '1');
  sessionStorage.setItem(CHECKOUT_NEEDS_ABANDON_KEY, '1');
}

export function clearCheckoutSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(CHECKOUT_OPEN_KEY);
  sessionStorage.removeItem(CHECKOUT_NEEDS_ABANDON_KEY);
}

export function needsAbandonCheckout() {
  return typeof window !== 'undefined' && sessionStorage.getItem(CHECKOUT_NEEDS_ABANDON_KEY) === '1';
}
