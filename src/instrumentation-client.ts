import * as Sentry from '@sentry/nextjs';
import { publicEnv } from '@/lib/env';

// Browser bundle: only NEXT_PUBLIC_* is inlined here. The old SENTRY_DSN fallback was always
// undefined in the browser (next.config.ts does not expose it), so it is dropped.
const dsn = publicEnv.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: publicEnv.NEXT_PUBLIC_SENTRY_ENVIRONMENT || publicEnv.NODE_ENV,
    tracesSampleRate: Number(publicEnv.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
