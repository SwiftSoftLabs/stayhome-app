import { readFileSync } from 'node:fs';
import { beforeEach, expect, test, vi } from 'vitest';

const query = vi.fn();
vi.mock('@/lib/db', () => ({ query: (...args: unknown[]) => query(...args) }));

const billing = await import('@/lib/billing');

const sub = {
  id: 's1', user_id: 'u1', plan_code: 'pro', kelviq_subscription_id: 'k1', status: 'active',
  unit_price_cents: 2900, currency: 'usd', current_period_end: null, cancel_at_period_end: false,
  canceled_at: null, trial_ends_at: null, is_manual: false, past_due_grace_ends_at: null,
  kelviq_updated_at: null, created_at: '', updated_at: '',
};

beforeEach(() => query.mockReset());

test('billing code never touches the RLS tables directly', () => {
  const src = readFileSync(new URL('./billing.ts', import.meta.url), 'utf8')
    + readFileSync(new URL('../app/api/account/route.ts', import.meta.url), 'utf8');
  expect(src).not.toMatch(/(FROM|INTO|UPDATE)\s+(app_stayhome\.)?(billing_events|billing_customers|user_subscriptions|billing_plans)\b/i);
});

test('subscription patch drops undefined, keeps null', () => {
  expect(billing.subscriptionPatchJson({ status: 'active', canceled_at: null, plan_code: undefined }))
    .toBe('{"status":"active","canceled_at":null}');
  expect(billing.subscriptionPatchJson({ plan_code: undefined })).toBeNull();
});

test('applySubscriptionTransition sends the patch to update_subscription', async () => {
  query
    .mockResolvedValueOnce({ rows: [] }) // ensure_basic_subscription_for_user
    .mockResolvedValueOnce({ rows: [sub] }) // get_subscription
    .mockResolvedValueOnce({ rows: [{ ...sub, kelviq_updated_at: 't' }] });
  await billing.applySubscriptionTransition('u1', { kelviq_updated_at: 't', status: undefined });
  expect(query.mock.calls[1][0]).toBe('SELECT * FROM app_stayhome_billing.get_subscription($1)');
  expect(query.mock.calls[2]).toEqual([
    'SELECT * FROM app_stayhome_billing.update_subscription($1, $2::jsonb)',
    ['u1', '{"kelviq_updated_at":"t"}'],
  ]);
});

test('claimBillingEvent: first delivery claims, replay reports processed', async () => {
  const input = { provider_event_id: 'e1', event_type: 'x', payload: {} };
  query.mockResolvedValueOnce({ rows: [{ claimed: true }] });
  expect(await billing.claimBillingEvent(input)).toEqual({ claimed: true, alreadyProcessed: false });

  query
    .mockResolvedValueOnce({ rows: [{ claimed: false }] })
    .mockResolvedValueOnce({ rows: [{ status: 'processed' }] });
  expect(await billing.claimBillingEvent(input)).toEqual({ claimed: false, alreadyProcessed: true });
  expect(query.mock.calls[2]).toEqual(['SELECT app_stayhome_billing.get_event_status($1) AS status', ['e1']]);
});
