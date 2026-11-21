-- StayHome billing: let the app's server role through RLS on the billing tables.
--
-- Production has row level security enabled on app_stayhome.billing_events with no
-- policy for the role the server connects as (DATABASE_URL -> app_stayhome_user). The
-- RLS was enabled outside this repo's migrations. The Kelviq webhook has no user session,
-- so every signed event failed on its first insert with 42501 "new row violates row-level
-- security policy for table billing_events".
--
-- The server enforces ownership in code and app_stayhome_user already holds ALL privileges
-- on these tables (20260622140000_app-stayhome-billing-mvp.sql). These policies restore that
-- behavior for that role only. Any other role (for example InsForge anon/authenticated) still
-- gets no rows. RLS state is left as it is: a policy has no effect on a table without RLS,
-- so the same policy also covers the other tables the webhook writes.
--
-- Apply alone on InsForge after prior migrations. Idempotent.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['billing_events', 'billing_customers', 'user_subscriptions', 'billing_plans']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON app_stayhome.%I', t || '_app_role_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON app_stayhome.%I FOR ALL TO app_stayhome_user USING (true) WITH CHECK (true)',
      t || '_app_role_all', t
    );
  END LOOP;
END
$$;
