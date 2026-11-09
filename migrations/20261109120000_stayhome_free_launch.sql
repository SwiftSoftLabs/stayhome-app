-- StayHome free launch.
-- Apply after migrations/20260622140000_app-stayhome-billing-mvp.sql.
-- Do not re-run the older billing seed in a way that reactivates plan code pro;
-- that seed's conflict update now preserves active and kelviq_variant_id.
--
-- Caps (UTC calendar month, rolling hour for email):
--   AI summary: 3 runs per audit, 5 runs per family per month
--   Verification and password-reset email: 5 per hour, 10 per month, per email
-- No customer rows are inserted or rewritten.

SET search_path TO app_stayhome;

UPDATE app_stayhome.billing_plans
SET active = false,
    kelviq_variant_id = NULL,
    updated_at = now()
WHERE code = 'pro';

CREATE TABLE IF NOT EXISTS app_stayhome.ai_usage (
  family_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  period_start date NOT NULL,
  runs integer NOT NULL DEFAULT 0 CHECK (runs >= 0 AND runs <= 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_usage_family_audit_period_key UNIQUE (family_id, audit_id, period_start)
);

CREATE INDEX IF NOT EXISTS ai_usage_audit_id_idx ON app_stayhome.ai_usage (audit_id);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('email_verification', 'password_reset')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_email_sends_email_created_idx
  ON app_stayhome.auth_email_sends (email, created_at DESC);

CREATE OR REPLACE FUNCTION app_stayhome.reserve_ai_summary_run(
  p_family_id uuid,
  p_audit_id uuid
) RETURNS TABLE (period_start date, runs integer)
LANGUAGE plpgsql
SET search_path = app_stayhome
AS $$
DECLARE
  v_period date := (date_trunc('month', (now() AT TIME ZONE 'UTC')))::date;
  v_audit_runs integer;
  v_family_runs integer;
  v_runs integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('stayhome-ai-family'), hashtext(p_family_id::text));

  SELECT COALESCE(SUM(ai_usage.runs), 0)
    INTO v_audit_runs
  FROM app_stayhome.ai_usage
  WHERE audit_id = p_audit_id;

  SELECT COALESCE(SUM(ai_usage.runs), 0)
    INTO v_family_runs
  FROM app_stayhome.ai_usage
  WHERE family_id = p_family_id
    AND ai_usage.period_start = v_period;

  IF v_audit_runs >= 3 THEN
    RAISE EXCEPTION 'AI_AUDIT_CAP' USING ERRCODE = 'P0001';
  END IF;
  IF v_family_runs >= 5 THEN
    RAISE EXCEPTION 'AI_FAMILY_CAP' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO app_stayhome.ai_usage (family_id, audit_id, period_start, runs)
  VALUES (p_family_id, p_audit_id, v_period, 1)
  ON CONFLICT (family_id, audit_id, period_start)
  DO UPDATE SET runs = ai_usage.runs + 1, updated_at = now()
  RETURNING ai_usage.runs INTO v_runs;

  period_start := v_period;
  runs := v_runs;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION app_stayhome.release_ai_summary_run(
  p_family_id uuid,
  p_audit_id uuid,
  p_period_start date
) RETURNS integer
LANGUAGE plpgsql
SET search_path = app_stayhome
AS $$
DECLARE
  v_runs integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('stayhome-ai-family'), hashtext(p_family_id::text));

  UPDATE app_stayhome.ai_usage
  SET runs = runs - 1, updated_at = now()
  WHERE family_id = p_family_id
    AND audit_id = p_audit_id
    AND period_start = p_period_start
    AND runs > 0
  RETURNING runs INTO v_runs;

  RETURN COALESCE(v_runs, 0);
END;
$$;

CREATE OR REPLACE FUNCTION app_stayhome.reserve_auth_email(
  p_email text,
  p_kind text
) RETURNS boolean
LANGUAGE plpgsql
SET search_path = app_stayhome
AS $$
DECLARE
  normalized text := lower(btrim(p_email));
  hour_count integer;
  month_count integer;
  month_start timestamptz;
BEGIN
  IF normalized = '' THEN
    RETURN false;
  END IF;
  IF p_kind NOT IN ('email_verification', 'password_reset') THEN
    RAISE EXCEPTION 'INVALID_AUTH_EMAIL_KIND' USING ERRCODE = 'P0001';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('stayhome-auth-email'), hashtext(normalized));

  SELECT count(*)
    INTO hour_count
  FROM app_stayhome.auth_email_sends
  WHERE email = normalized
    AND created_at > now() - interval '1 hour';

  month_start := (date_trunc('month', (now() AT TIME ZONE 'UTC')))::timestamp AT TIME ZONE 'UTC';

  SELECT count(*)
    INTO month_count
  FROM app_stayhome.auth_email_sends
  WHERE email = normalized
    AND created_at >= month_start;

  IF hour_count >= 5 OR month_count >= 10 THEN
    RETURN false;
  END IF;

  INSERT INTO app_stayhome.auth_email_sends (email, kind)
  VALUES (normalized, p_kind);
  RETURN true;
END;
$$;

GRANT ALL PRIVILEGES ON TABLE app_stayhome.ai_usage TO app_stayhome_user;
GRANT ALL PRIVILEGES ON TABLE app_stayhome.auth_email_sends TO app_stayhome_user;
GRANT EXECUTE ON FUNCTION app_stayhome.reserve_ai_summary_run(uuid, uuid) TO app_stayhome_user;
GRANT EXECUTE ON FUNCTION app_stayhome.release_ai_summary_run(uuid, uuid, date) TO app_stayhome_user;
GRANT EXECUTE ON FUNCTION app_stayhome.reserve_auth_email(text, text) TO app_stayhome_user;
