/**
 * The one door for environment variables. This is the only app file allowed to
 * read environment variables; `npm run check:env` (scripts/check-env-access.mjs) fails CI
 * on any read elsewhere.
 *
 * Every value is a getter with literal `process.env.NAME` access, so:
 * - reads stay lazy (same timing as the direct reads this replaced);
 * - Next.js still inlines NEXT_PUBLIC_* (and NODE_ENV) into client bundles at build time.
 *
 * Add a variable here, then import it. Never return or pass the whole env object.
 */

/** Safe in client and server code. Values are inlined into the browser bundle at build time. */
export const publicEnv = {
  get NODE_ENV() { return process.env.NODE_ENV; },
  get NEXT_PUBLIC_APP_URL() { return process.env.NEXT_PUBLIC_APP_URL; },
  get NEXT_PUBLIC_DB_SCHEMA() { return process.env.NEXT_PUBLIC_DB_SCHEMA; },
  get NEXT_PUBLIC_INSFORGE_URL() { return process.env.NEXT_PUBLIC_INSFORGE_URL; },
  get NEXT_PUBLIC_INSFORGE_ANON_KEY() { return process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY; },
  get NEXT_PUBLIC_SUPABASE_URL() { return process.env.NEXT_PUBLIC_SUPABASE_URL; },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; },
  get NEXT_PUBLIC_POSTHOG_KEY() { return process.env.NEXT_PUBLIC_POSTHOG_KEY; },
  get NEXT_PUBLIC_POSTHOG_HOST() { return process.env.NEXT_PUBLIC_POSTHOG_HOST; },
  get NEXT_PUBLIC_SENTRY_DSN() { return process.env.NEXT_PUBLIC_SENTRY_DSN; },
  get NEXT_PUBLIC_SENTRY_ENVIRONMENT() { return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT; },
  get NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE() { return process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE; },
};

// Runtime guard rather than `import 'server-only'`: this file also holds publicEnv,
// which client code imports. Non-NEXT_PUBLIC values are never inlined into client
// bundles, so a browser read would only ever see undefined; throwing makes the
// mistake loud instead.
function assertServer() {
  if (typeof window !== 'undefined') throw new Error('serverEnv was read in the browser');
}

/** Server only. Reading any of these in the browser throws. */
export const serverEnv = {
  // Runtime
  get VERCEL_ENV() { assertServer(); return process.env.VERCEL_ENV; },
  get APP_URL() { assertServer(); return process.env.APP_URL; },
  get SYNLEX_PUBLIC_BASE() { assertServer(); return process.env.SYNLEX_PUBLIC_BASE; },

  // Sentry
  get SENTRY_DSN() { assertServer(); return process.env.SENTRY_DSN; },
  get SENTRY_ENVIRONMENT() { assertServer(); return process.env.SENTRY_ENVIRONMENT; },
  get SENTRY_TRACES_SAMPLE_RATE() { assertServer(); return process.env.SENTRY_TRACES_SAMPLE_RATE; },

  // Database
  get DATABASE_URL() { assertServer(); return process.env.DATABASE_URL; },
  get DATABASE_SSL() { assertServer(); return process.env.DATABASE_SSL; },
  get DATABASE_SSL_REJECT_UNAUTHORIZED() { assertServer(); return process.env.DATABASE_SSL_REJECT_UNAUTHORIZED; },

  // InsForge
  get INSFORGE_URL() { assertServer(); return process.env.INSFORGE_URL; },
  get INSFORGE_ANON_KEY() { assertServer(); return process.env.INSFORGE_ANON_KEY; },
  get INSFORGE_API_KEY() { assertServer(); return process.env.INSFORGE_API_KEY; },
  get INSFORGE_SERVICE_KEY() { assertServer(); return process.env.INSFORGE_SERVICE_KEY; },

  // Auth
  get JWT_ACCESS_SECRET() { assertServer(); return process.env.JWT_ACCESS_SECRET; },
  get JWT_REFRESH_SECRET() { assertServer(); return process.env.JWT_REFRESH_SECRET; },
  get JWT_ACCESS_TTL_SECONDS() { assertServer(); return process.env.JWT_ACCESS_TTL_SECONDS; },
  get JWT_REFRESH_TTL_SECONDS() { assertServer(); return process.env.JWT_REFRESH_TTL_SECONDS; },
  get JWT_MFA_PENDING_TTL_SECONDS() { assertServer(); return process.env.JWT_MFA_PENDING_TTL_SECONDS; },
  get AUTH_VERIFY_CODE_TTL_SECONDS() { assertServer(); return process.env.AUTH_VERIFY_CODE_TTL_SECONDS; },
  get AUTH_RESET_CODE_TTL_SECONDS() { assertServer(); return process.env.AUTH_RESET_CODE_TTL_SECONDS; },
  get AUTH_BCRYPT_ROUNDS() { assertServer(); return process.env.AUTH_BCRYPT_ROUNDS; },
  get AUTH_EMAIL_FROM() { assertServer(); return process.env.AUTH_EMAIL_FROM; },
  get AUTH_ENCRYPTION_KEY() { assertServer(); return process.env.AUTH_ENCRYPTION_KEY; },
  get WEBAUTHN_RP_ID() { assertServer(); return process.env.WEBAUTHN_RP_ID; },
  get WEBAUTHN_RP_NAME() { assertServer(); return process.env.WEBAUTHN_RP_NAME; },
  get WEBAUTHN_ORIGIN() { assertServer(); return process.env.WEBAUTHN_ORIGIN; },
  get GOOGLE_CLIENT_ID() { assertServer(); return process.env.GOOGLE_CLIENT_ID; },
  get GOOGLE_CLIENT_SECRET() { assertServer(); return process.env.GOOGLE_CLIENT_SECRET; },
  get GITHUB_CLIENT_ID() { assertServer(); return process.env.GITHUB_CLIENT_ID; },
  get GITHUB_CLIENT_SECRET() { assertServer(); return process.env.GITHUB_CLIENT_SECRET; },

  // AI (OpenRouter)
  get OPENROUTER_API_KEY() { assertServer(); return process.env.OPENROUTER_API_KEY; },
  get OPENROUTER_CHAT_MODEL() { assertServer(); return process.env.OPENROUTER_CHAT_MODEL; },
  get AI_CHAT_MODEL() { assertServer(); return process.env.AI_CHAT_MODEL; },
  get OPENROUTER_EMBEDDING_MODEL() { assertServer(); return process.env.OPENROUTER_EMBEDDING_MODEL; },
  get AI_EMBEDDING_MODEL() { assertServer(); return process.env.AI_EMBEDDING_MODEL; },
  get OPENROUTER_IMAGE_MODEL() { assertServer(); return process.env.OPENROUTER_IMAGE_MODEL; },

  // Billing (Kelviq)
  get BILLING_PRE_LAUNCH() { assertServer(); return process.env.BILLING_PRE_LAUNCH; },
  get BILLING_TESTER_EMAILS() { assertServer(); return process.env.BILLING_TESTER_EMAILS; },
  get KELVIQ_API_BASE_URL() { assertServer(); return process.env.KELVIQ_API_BASE_URL; },
  get KELVIQ_API_KEY() { assertServer(); return process.env.KELVIQ_API_KEY; },
  get KELVIQ_WEBHOOK_SECRET() { assertServer(); return process.env.KELVIQ_WEBHOOK_SECRET; },
};
