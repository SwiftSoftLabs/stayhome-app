-- Phase 2+3: 2FA, passkeys, OAuth support (app_stayhome)

ALTER TABLE app_stayhome.users
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS app_stayhome.auth_oauth_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_stayhome.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google', 'github')),
  provider_user_id text NOT NULL,
  provider_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id)
);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_two_factor (
  user_id uuid PRIMARY KEY REFERENCES app_stayhome.users(id) ON DELETE CASCADE,
  totp_secret_encrypted text NOT NULL,
  backup_codes_hash text[] NOT NULL DEFAULT '{}',
  enabled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_stayhome.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key bytea NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}',
  device_name text NOT NULL DEFAULT 'Passkey',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS auth_passkeys_user_id_idx ON app_stayhome.auth_passkeys(user_id);

CREATE TABLE IF NOT EXISTS app_stayhome.auth_webauthn_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_stayhome.users(id) ON DELETE CASCADE,
  challenge text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
