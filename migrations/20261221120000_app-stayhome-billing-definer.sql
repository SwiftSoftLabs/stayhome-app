-- StayHome billing: SECURITY DEFINER access to the RLS-protected billing tables.
--
-- On InsForge, app_stayhome.billing_events, billing_customers, user_subscriptions and
-- billing_plans have row level security ON with no policy for the app's role, and are owned
-- by postgres, so 20261121090000_app-stayhome-billing-rls-app-role.sql (CREATE POLICY) cannot
-- be applied by any role we hold. The Kelviq webhook failed with 42501 and reads of these
-- tables returned no rows.
--
-- project_admin has BYPASSRLS and table privileges but cannot create objects in app_stayhome,
-- so these functions live in their own schema, owned by project_admin. Each one runs exactly
-- one fixed statement the app already ran (no dynamic SQL). Only app_stayhome_user may call
-- them. The server enforces ownership in code, as it did before.
--
-- Apply as project_admin (insforge db query). Idempotent. No BEGIN/COMMIT: the CLI
-- rejects them. Send the whole file as one query so the REVOKE FROM PUBLIC lands with the
-- CREATEs.

CREATE SCHEMA IF NOT EXISTS app_stayhome_billing;
REVOKE ALL ON SCHEMA app_stayhome_billing FROM PUBLIC;
GRANT USAGE ON SCHEMA app_stayhome_billing TO app_stayhome_user;

-- Plans -----------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_stayhome_billing.list_active_plans()
RETURNS SETOF app_stayhome.billing_plans
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT * FROM app_stayhome.billing_plans WHERE active = true ORDER BY sort_order ASC;
$$;

CREATE OR REPLACE FUNCTION app_stayhome_billing.get_plan(p_code text)
RETURNS SETOF app_stayhome.billing_plans
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT * FROM app_stayhome.billing_plans WHERE code = p_code;
$$;

-- Customers -------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_stayhome_billing.get_customer(p_user_id uuid)
RETURNS SETOF app_stayhome.billing_customers
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT * FROM app_stayhome.billing_customers WHERE user_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION app_stayhome_billing.find_customer_by_kelviq_id(p_customer_id text)
RETURNS SETOF app_stayhome.billing_customers
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT * FROM app_stayhome.billing_customers
  WHERE kelviq_customer_id = p_customer_id OR kelviq_internal_customer_id = p_customer_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_stayhome_billing.find_customer_by_email(p_email text)
RETURNS SETOF app_stayhome.billing_customers
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT * FROM app_stayhome.billing_customers WHERE lower(billing_email) = lower(p_email) LIMIT 1;
$$;

-- Subscriptions ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_stayhome_billing.get_subscription(p_user_id uuid)
RETURNS SETOF app_stayhome.user_subscriptions
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT * FROM app_stayhome.user_subscriptions WHERE user_id = p_user_id;
$$;

-- Applies a partial patch. A key present in p_patch sets that column (JSON null -> NULL);
-- a missing key leaves it. Only the columns below may be patched; any other key is rejected.
CREATE OR REPLACE FUNCTION app_stayhome_billing.update_subscription(p_user_id uuid, p_patch jsonb)
RETURNS SETOF app_stayhome.user_subscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
DECLARE
  bad_key text;
BEGIN
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'update_subscription: patch must be a JSON object' USING ERRCODE = '22023';
  END IF;

  SELECT k INTO bad_key FROM jsonb_object_keys(p_patch) AS k
  WHERE k <> ALL (ARRAY[
    'plan_code', 'status', 'unit_price_cents', 'currency', 'kelviq_subscription_id',
    'current_period_end', 'cancel_at_period_end', 'canceled_at', 'past_due_grace_ends_at',
    'kelviq_updated_at'
  ])
  LIMIT 1;
  IF bad_key IS NOT NULL THEN
    RAISE EXCEPTION 'update_subscription: column % is not patchable', bad_key USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  UPDATE app_stayhome.user_subscriptions s SET
    plan_code = CASE WHEN p_patch ? 'plan_code' THEN p_patch->>'plan_code' ELSE s.plan_code END,
    status = CASE WHEN p_patch ? 'status' THEN p_patch->>'status' ELSE s.status END,
    unit_price_cents = CASE WHEN p_patch ? 'unit_price_cents' THEN (p_patch->>'unit_price_cents')::integer ELSE s.unit_price_cents END,
    currency = CASE WHEN p_patch ? 'currency' THEN p_patch->>'currency' ELSE s.currency END,
    kelviq_subscription_id = CASE WHEN p_patch ? 'kelviq_subscription_id' THEN p_patch->>'kelviq_subscription_id' ELSE s.kelviq_subscription_id END,
    current_period_end = CASE WHEN p_patch ? 'current_period_end' THEN (p_patch->>'current_period_end')::timestamptz ELSE s.current_period_end END,
    cancel_at_period_end = CASE WHEN p_patch ? 'cancel_at_period_end' THEN (p_patch->>'cancel_at_period_end')::boolean ELSE s.cancel_at_period_end END,
    canceled_at = CASE WHEN p_patch ? 'canceled_at' THEN (p_patch->>'canceled_at')::timestamptz ELSE s.canceled_at END,
    past_due_grace_ends_at = CASE WHEN p_patch ? 'past_due_grace_ends_at' THEN (p_patch->>'past_due_grace_ends_at')::timestamptz ELSE s.past_due_grace_ends_at END,
    kelviq_updated_at = CASE WHEN p_patch ? 'kelviq_updated_at' THEN (p_patch->>'kelviq_updated_at')::timestamptz ELSE s.kelviq_updated_at END,
    updated_at = now()
  WHERE s.user_id = p_user_id
  RETURNING s.*;
END;
$$;

-- Events ----------------------------------------------------------------------------------

-- Returns true when this call inserted the event, false when the id already existed.
CREATE OR REPLACE FUNCTION app_stayhome_billing.claim_event(
  p_provider_event_id text, p_event_type text, p_owner_id uuid, p_payload jsonb
)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  WITH ins AS (
    INSERT INTO app_stayhome.billing_events
      (provider_event_id, event_type, owner_id, payload, status, processed_at)
    VALUES (p_provider_event_id, p_event_type, p_owner_id, p_payload, 'received', now())
    ON CONFLICT (provider_event_id) DO NOTHING
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM ins);
$$;

CREATE OR REPLACE FUNCTION app_stayhome_billing.record_event(
  p_provider_event_id text, p_event_type text, p_owner_id uuid, p_payload jsonb,
  p_status text, p_error text
)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  INSERT INTO app_stayhome.billing_events
    (provider_event_id, event_type, owner_id, payload, status, error, processed_at)
  VALUES (p_provider_event_id, p_event_type, p_owner_id, p_payload, p_status, p_error, now())
  ON CONFLICT (provider_event_id) DO UPDATE SET
    event_type = EXCLUDED.event_type,
    owner_id = EXCLUDED.owner_id,
    payload = EXCLUDED.payload,
    status = EXCLUDED.status,
    error = EXCLUDED.error,
    processed_at = now(),
    updated_at = now();
$$;

CREATE OR REPLACE FUNCTION app_stayhome_billing.get_event_status(p_provider_event_id text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  SELECT status FROM app_stayhome.billing_events WHERE provider_event_id = p_provider_event_id;
$$;

-- Account deletion ------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_stayhome_billing.delete_user_billing(p_user_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, app_stayhome AS $$
  DELETE FROM app_stayhome.billing_events WHERE owner_id = p_user_id;
  DELETE FROM app_stayhome.user_subscriptions WHERE user_id = p_user_id;
  DELETE FROM app_stayhome.billing_customers WHERE user_id = p_user_id;
$$;

-- Grants ----------------------------------------------------------------------------------

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA app_stayhome_billing FROM PUBLIC;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app_stayhome_billing TO app_stayhome_user;
