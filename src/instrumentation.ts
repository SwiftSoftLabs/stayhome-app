import * as Sentry from '@sentry/nextjs';
import { publicEnv, serverEnv } from '@/lib/env';

export async function register() {
  const dsn = serverEnv.SENTRY_DSN || publicEnv.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: serverEnv.SENTRY_ENVIRONMENT || serverEnv.VERCEL_ENV || publicEnv.NODE_ENV,
    tracesSampleRate: Number(serverEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}

export const onRequestError = Sentry.captureRequestError;
