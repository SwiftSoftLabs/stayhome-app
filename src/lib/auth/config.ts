const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'app_stayhome';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const authConfig = {
  schema,
  appOrigin: schema,
  databaseUrl: () => requireEnv('DATABASE_URL'),
  jwtAccessSecret: () => requireEnv('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: () => requireEnv('JWT_REFRESH_SECRET'),
  jwtAccessTtlSeconds: Number(optionalEnv('JWT_ACCESS_TTL_SECONDS', '900')),
  jwtRefreshTtlSeconds: Number(optionalEnv('JWT_REFRESH_TTL_SECONDS', '2592000')),
  verifyCodeTtlSeconds: Number(optionalEnv('AUTH_VERIFY_CODE_TTL_SECONDS', '900')),
  resetCodeTtlSeconds: Number(optionalEnv('AUTH_RESET_CODE_TTL_SECONDS', '900')),
  bcryptRounds: Number(optionalEnv('AUTH_BCRYPT_ROUNDS', '12')),
  insforgeUrl: () =>
    process.env.INSFORGE_URL ||
    process.env.NEXT_PUBLIC_INSFORGE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '',
  insforgeAnonKey: () =>
    process.env.INSFORGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '',
  emailFrom: () => optionalEnv('AUTH_EMAIL_FROM', 'StayHome'),
  googleClientId: () => process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: () => process.env.GOOGLE_CLIENT_SECRET || '',
  cookieSecure: process.env.NODE_ENV === 'production',
  accessCookieName: 'sh_access',
  refreshCookieName: 'sh_refresh',
  oauthStateCookieName: 'sh_oauth_state',
};

export function getAppBaseUrl(requestUrl?: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (requestUrl) {
    const url = new URL(requestUrl);
    return url.origin;
  }
  return 'http://localhost:3000';
}
