import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_INSFORGE_URL:
      process.env.NEXT_PUBLIC_INSFORGE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_INSFORGE_ANON_KEY:
      process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    NEXT_PUBLIC_DB_SCHEMA: process.env.NEXT_PUBLIC_DB_SCHEMA ?? 'app_devjoy',
  },
};


const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG || 'swiftsoft-labs',
  project: process.env.SENTRY_PROJECT || 'stayhomeapp',
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
};

export default sentryEnabled ? withSentryConfig(nextConfig, sentryBuildOptions) : nextConfig;
