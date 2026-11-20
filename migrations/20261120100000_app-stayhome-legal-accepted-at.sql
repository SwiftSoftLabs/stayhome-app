-- StayHome Legal: record Terms/Privacy acceptance timestamp.
-- Apply alone on InsForge after prior migrations.
-- Do not re-run older seeds in the same apply.

ALTER TABLE app_stayhome.users
  ADD COLUMN IF NOT EXISTS legal_accepted_at timestamptz;
