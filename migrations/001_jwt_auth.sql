-- Phase 1 JWT auth (app_stayhome)
-- Apply: npx insforge db query "$(cat migrations/001_jwt_auth.sql)"

CREATE SCHEMA IF NOT EXISTS app_stayhome;

CREATE TABLE IF NOT EXISTS app_stayhome.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  email_verified boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'expert')),
  app_origin text NOT NULL DEFAULT 'app_stayhome',
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_stayhome.users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON app_stayhome.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_refresh_hash_idx ON app_stayhome.auth_sessions(refresh_token_hash);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_stayhome.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL CHECK (type IN ('email_verification', 'password_reset')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_verification_codes_email_type_idx
  ON app_stayhome.auth_verification_codes(email, type);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_stayhome.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
