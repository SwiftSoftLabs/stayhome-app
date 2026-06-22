'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  abandonBillingCheckout,
  cancelBillingSubscription,
  fetchBillingSummary,
  openBillingPortal,
  startBillingCheckout,
} from '@/lib/billing/client';
import { clearCheckoutSession, needsAbandonCheckout } from '@/lib/billing/checkout-session';
import {
  beginCheckoutActivatingSession,
  isCheckoutActivatingSession,
  pollCheckoutActivation,
} from '@/lib/billing/checkout-return';
import type { BillingSummaryMvp } from '@/types/billing';

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusLabel(summary: BillingSummaryMvp, isActivating = false) {
  if (isActivating) return 'Activating';
  if (summary.cancel_at_period_end) return 'Canceling';
  if (summary.status === 'pending') return 'Pending';
  if (summary.status === 'active' || summary.status === 'trialing') return 'Active';
  if (summary.status === 'past_due') return 'Past due';
  return 'Basic';
}

function statusClass(summary: BillingSummaryMvp, isActivating = false) {
  if (isActivating) return 'bg-blue-50 text-blue-700';
  if (summary.status === 'pending') return 'bg-amber-50 text-amber-700';
  if (summary.cancel_at_period_end) return 'bg-orange-50 text-orange-700';
  if (summary.status === 'active' || summary.status === 'trialing') return 'bg-green-50 text-green-600';
  return 'bg-zinc-100 text-zinc-600';
}

function isPaidSummary(summary: BillingSummaryMvp) {
  return summary.status === 'active' || summary.status === 'trialing' || summary.status === 'past_due';
}

export default function BillingSettings() {
  const [summary, setSummary] = useState<BillingSummaryMvp | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading billing…');
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadSummary = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
        setLoadingMessage('Loading billing…');
      }
      setError(null);
      const data = await fetchBillingSummary();
      setSummary(data);
      return data;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unable to load billing.';
      setError(message);
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleCanceledReturn = async () => {
      setLoading(true);
      setLoadingMessage('Restoring your Basic plan…');
      setSummary(null);
      setBanner('Checkout canceled. No charges were made.');
      window.history.replaceState({}, '', '/dashboard/family/billing');

      try {
        const { summary: reverted } = await abandonBillingCheckout();
        if (cancelled) return;
        clearCheckoutSession();
        setSummary(reverted);
        setIsActivating(false);
      } catch {
        if (cancelled) return;
        setError('Checkout was canceled, but billing state could not be reset.');
        await loadSummary({ silent: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const handleSuccessReturn = async () => {
      clearCheckoutSession();
      beginCheckoutActivatingSession();
      window.history.replaceState({}, '', '/dashboard/family/billing');
      setLoading(false);
      setBanner('Payment received — activating your plan…');
      setIsActivating(true);

      const { summary: latest, activated } = await pollCheckoutActivation((data) => {
        if (cancelled) return;
        setSummary(data);
      });

      if (cancelled) return;

      if (latest) setSummary(latest);
      setIsActivating(false);
      setBanner(
        activated
          ? 'Subscription activated.'
          : 'Your payment is still processing. Refresh in a moment.',
      );
    };

    const init = async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const checkout = params.get('checkout');
      const resumingActivation = checkout === 'success' || isCheckoutActivatingSession();
      const shouldAbandon =
        !resumingActivation
        && (checkout === 'canceled' || checkout === 'cancel' || needsAbandonCheckout());

      if (resumingActivation) {
        await handleSuccessReturn();
        return;
      }

      if (shouldAbandon) {
        await handleCanceledReturn();
        return;
      }

      await loadSummary();
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [loadSummary]);

  const handleCheckout = async (planCode: string) => {
    setBusyAction(planCode);
    setError(null);
    try {
      const { checkoutUrl } = await startBillingCheckout(planCode);
      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.');
      setBusyAction(null);
    }
  };

  const handleOpenPortal = async () => {
    setBusyAction('portal');
    setError(null);
    try {
      const blank = window.open('about:blank', '_blank');
      const { portalUrl } = await openBillingPortal();
      if (blank) {
        blank.location.href = portalUrl;
        blank.opener = null;
      } else {
        window.open(portalUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : 'Unable to open billing portal.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancel = async () => {
    setBusyAction('cancel');
    setError(null);
    try {
      await cancelBillingSubscription();
      setShowCancelModal(false);
      setBanner(
        'Your plan will cancel at the end of the current billing period. Kelviq portal may show the subscription as already canceled.',
      );
      await loadSummary({ silent: true });
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Unable to cancel subscription.');
    } finally {
      setBusyAction(null);
    }
  };

  const paid = summary ? isPaidSummary(summary) : false;
  const showPendingCopy = summary?.status === 'pending' && !isActivating;

  return (
    <div id="billing" className="space-y-8 scroll-mt-8">
      {banner && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-zinc-800">
          {banner}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 text-zinc-500 text-sm">
          {loadingMessage}
        </div>
      )}

      {!loading && summary && (
        <>
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${statusClass(summary, isActivating)}`}>
                {statusLabel(summary, isActivating)}
              </span>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-zinc-900">{summary.plan.name}</h2>
                {summary.current_period_end && (
                  <p className="text-sm text-zinc-600">
                    {summary.cancel_at_period_end ? 'Access until' : 'Next billing cycle'}:{' '}
                    <span className="font-semibold text-zinc-900">{formatDate(summary.current_period_end)}</span>
                  </p>
                )}
                {showPendingCopy && (
                  <p className="text-sm text-amber-700">
                    Previous checkout did not complete — choose a plan to try again.
                  </p>
                )}
                {summary.cancel_at_period_end && summary.current_period_end && (
                  <p className="text-sm text-orange-700">
                    Plan cancels on {formatDate(summary.current_period_end)}. Full access until then.
                    Kelviq portal may show the subscription as already canceled.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                {paid && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleOpenPortal()}
                      disabled={busyAction === 'portal'}
                      className="px-6 py-3 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {busyAction === 'portal' ? 'Opening portal…' : 'Manage billing'}
                    </button>
                    {!summary.cancel_at_period_end && (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="px-6 py-3 bg-zinc-100 text-zinc-700 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-zinc-200"
                      >
                        Cancel subscription
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-zinc-900">
                {summary.plan.price_cents === 0
                  ? 'Free'
                  : formatMoney(summary.plan.price_cents, summary.plan.currency)}
                {summary.plan.price_cents > 0 && (
                  <span className="text-lg font-medium text-zinc-500">/mo</span>
                )}
              </p>
            </div>
          </div>

          {(summary.availablePlans?.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.availablePlans?.map((plan) => {
                const isCurrent = summary.plan.code === plan.code && paid;
                const isBusy = busyAction === plan.code;
                return (
                  <div
                    key={plan.code}
                    className="bg-zinc-50 rounded-2xl border border-zinc-200 p-6 space-y-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                      <p className="text-2xl font-bold text-zinc-900">
                        {formatMoney(plan.price_cents, plan.currency)}
                        <span className="text-sm font-medium text-zinc-500">/mo</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || isBusy || isActivating}
                      onClick={() => void handleCheckout(plan.code)}
                      className="w-full px-6 py-3 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {isBusy
                        ? 'Opening checkout…'
                        : isCurrent
                          ? 'Current plan'
                          : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 text-zinc-500 pt-4 border-t border-zinc-200">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Payments processed securely via Kelviq hosted checkout
            </span>
          </div>
        </>
      )}

      {showCancelModal && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-xl font-bold text-zinc-900">Cancel subscription?</h3>
            <p className="text-sm text-zinc-600">
              Your {summary.plan.name} plan continues until{' '}
              {formatDate(summary.current_period_end) || 'the end of the billing period'}, then reverts to Basic.
              Kelviq may show the subscription as already canceled in the billing portal.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600"
              >
                Keep plan
              </button>
              <button
                type="button"
                disabled={busyAction === 'cancel'}
                onClick={() => void handleCancel()}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-semibold uppercase tracking-wide disabled:opacity-60"
              >
                {busyAction === 'cancel' ? 'Canceling…' : 'Confirm cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
