-- StayHome Kelviq billing MVP (user-billed)
CREATE SCHEMA IF NOT EXISTS app_stayhome;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_stayhome_user') THEN
    CREATE ROLE app_stayhome_user LOGIN;
  END IF;
END
$$;

REVOKE ALL ON SCHEMA public FROM app_stayhome_user;
GRANT USAGE, CREATE ON SCHEMA app_stayhome TO app_stayhome_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app_stayhome TO app_stayhome_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app_stayhome TO app_stayhome_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA app_stayhome TO app_stayhome_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_stayhome GRANT ALL PRIVILEGES ON TABLES TO app_stayhome_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_stayhome GRANT ALL PRIVILEGES ON SEQUENCES TO app_stayhome_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_stayhome GRANT ALL PRIVILEGES ON FUNCTIONS TO app_stayhome_user;
ALTER ROLE app_stayhome_user SET search_path TO app_stayhome;

SET search_path TO app_stayhome;

CREATE OR REPLACE FUNCTION app_stayhome.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE IF NOT EXISTS app_stayhome.billing_plans (
  code text PRIMARY KEY, name text NOT NULL, price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd', interval text, kelviq_variant_id text,
  active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_stayhome.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kelviq_customer_id text, kelviq_internal_customer_id text, billing_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_stayhome.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES app_stayhome.billing_plans(code),
  kelviq_subscription_id text UNIQUE,
  status text NOT NULL CHECK (status IN ('basic', 'pending', 'active', 'trialing', 'past_due', 'canceled')),
  unit_price_cents integer NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'usd',
  current_period_end timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz, trial_ends_at timestamptz, is_manual boolean NOT NULL DEFAULT false,
  past_due_grace_ends_at timestamptz, kelviq_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_stayhome.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_event_id text NOT NULL UNIQUE, event_type text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  error text, processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_customers_kelviq_customer_id_idx ON app_stayhome.billing_customers (kelviq_customer_id);
CREATE INDEX IF NOT EXISTS billing_customers_kelviq_internal_customer_id_idx ON app_stayhome.billing_customers (kelviq_internal_customer_id);
CREATE INDEX IF NOT EXISTS billing_events_owner_id_idx ON app_stayhome.billing_events (owner_id);

DROP TRIGGER IF EXISTS trg_billing_plans_touch_updated_at ON app_stayhome.billing_plans;
CREATE TRIGGER trg_billing_plans_touch_updated_at BEFORE UPDATE ON app_stayhome.billing_plans
FOR EACH ROW EXECUTE FUNCTION app_stayhome.touch_updated_at();
DROP TRIGGER IF EXISTS trg_billing_customers_touch_updated_at ON app_stayhome.billing_customers;
CREATE TRIGGER trg_billing_customers_touch_updated_at BEFORE UPDATE ON app_stayhome.billing_customers
FOR EACH ROW EXECUTE FUNCTION app_stayhome.touch_updated_at();
DROP TRIGGER IF EXISTS trg_user_subscriptions_touch_updated_at ON app_stayhome.user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_touch_updated_at BEFORE UPDATE ON app_stayhome.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION app_stayhome.touch_updated_at();
DROP TRIGGER IF EXISTS trg_billing_events_touch_updated_at ON app_stayhome.billing_events;
CREATE TRIGGER trg_billing_events_touch_updated_at BEFORE UPDATE ON app_stayhome.billing_events
FOR EACH ROW EXECUTE FUNCTION app_stayhome.touch_updated_at();

INSERT INTO app_stayhome.billing_plans (code, name, price_cents, currency, interval, kelviq_variant_id, active, sort_order)
VALUES
  ('basic', 'Basic', 0, 'usd', NULL, NULL, true, 0),
  ('pro', 'Pro', 2900, 'usd', 'month', 'stayhome-pro', true, 1)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, price_cents = EXCLUDED.price_cents, kelviq_variant_id = EXCLUDED.kelviq_variant_id,
  active = EXCLUDED.active, sort_order = EXCLUDED.sort_order, updated_at = now();

CREATE OR REPLACE FUNCTION app_stayhome.ensure_basic_subscription_for_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = app_stayhome AS $$
BEGIN
  INSERT INTO app_stayhome.user_subscriptions (user_id, plan_code, status, unit_price_cents, currency)
  VALUES (target_user_id, 'basic', 'basic', 0, 'usd') ON CONFLICT (user_id) DO NOTHING;
END; $$;

GRANT EXECUTE ON FUNCTION app_stayhome.ensure_basic_subscription_for_user(uuid) TO app_stayhome_user;
