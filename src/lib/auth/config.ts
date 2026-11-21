import { publicEnv, serverEnv } from '@/lib/env';
const schema = publicEnv.NEXT_PUBLIC_DB_SCHEMA || 'app_stayhome';

// Callers pass the value (static read via serverEnv) and its name for the error message.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(value: string | undefined, fallback: string): string {
  return value || fallback;
}

export const authConfig = {
  schema,
  appOrigin: schema,
  databaseUrl: () => requireEnv('DATABASE_URL', serverEnv.DATABASE_URL),
  jwtAccessSecret: () => requireEnv('JWT_ACCESS_SECRET', serverEnv.JWT_ACCESS_SECRET),
  jwtRefreshSecret: () => requireEnv('JWT_REFRESH_SECRET', serverEnv.JWT_REFRESH_SECRET),
  jwtAccessTtlSeconds: Number(optionalEnv(serverEnv.JWT_ACCESS_TTL_SECONDS, '900')),
  jwtRefreshTtlSeconds: Number(optionalEnv(serverEnv.JWT_REFRESH_TTL_SECONDS, '2592000')),
  verifyCodeTtlSeconds: Number(optionalEnv(serverEnv.AUTH_VERIFY_CODE_TTL_SECONDS, '900')),
  resetCodeTtlSeconds: Number(optionalEnv(serverEnv.AUTH_RESET_CODE_TTL_SECONDS, '900')),
  bcryptRounds: Number(optionalEnv(serverEnv.AUTH_BCRYPT_ROUNDS, '12')),
  insforgeUrl: () =>
    serverEnv.INSFORGE_URL ||
    publicEnv.NEXT_PUBLIC_INSFORGE_URL ||
    publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
    '',
  insforgeAnonKey: () =>
    serverEnv.INSFORGE_ANON_KEY ||
    publicEnv.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '',
  emailFrom: () => optionalEnv(serverEnv.AUTH_EMAIL_FROM, 'StayHome'),
  googleClientId: () => serverEnv.GOOGLE_CLIENT_ID || '',
  googleClientSecret: () => serverEnv.GOOGLE_CLIENT_SECRET || '',
  cookieSecure: publicEnv.NODE_ENV === 'production',
  accessCookieName: 'sh_access',
  refreshCookieName: 'sh_refresh',
  oauthStateCookieName: 'sh_oauth_state',
  legalConsentCookieName: 'sh_legal_consent',
  jwtMfaPendingTtlSeconds: Number(optionalEnv(serverEnv.JWT_MFA_PENDING_TTL_SECONDS, '300')),
  encryptionKey: () => optionalEnv(serverEnv.AUTH_ENCRYPTION_KEY, serverEnv.JWT_ACCESS_SECRET || 'dev-encryption-key-min-32-chars!!'),
  webauthnRpId: () => optionalEnv(serverEnv.WEBAUTHN_RP_ID, 'localhost'),
  webauthnRpName: () => optionalEnv(serverEnv.WEBAUTHN_RP_NAME, 'StayHome'),
  webauthnOrigin: () => optionalEnv(serverEnv.WEBAUTHN_ORIGIN, 'http://localhost:3000'),
  githubClientId: () => serverEnv.GITHUB_CLIENT_ID || '',
  githubClientSecret: () => serverEnv.GITHUB_CLIENT_SECRET || '',
  mfaPendingCookieName: 'sh_mfa_pending',
};

export function getAppBaseUrl(requestUrl?: string): string {
  if (publicEnv.NEXT_PUBLIC_APP_URL) {
    return publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }
  return 'http://localhost:3000';
}
