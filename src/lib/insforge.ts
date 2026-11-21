import { createClient } from '@insforge/sdk';
import { publicEnv } from '@/lib/env';

const baseUrl = publicEnv.NEXT_PUBLIC_INSFORGE_URL ?? '';
const anonKey = publicEnv.NEXT_PUBLIC_INSFORGE_ANON_KEY ?? '';
export const APP_SCHEMA = publicEnv.NEXT_PUBLIC_DB_SCHEMA ?? 'app_stayhome';

if (!baseUrl || !anonKey) {
  console.warn('Missing InsForge env vars — set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY');
}

// PostgREST schema-isolation headers — all DB queries will target app_stayhome
export const insforge = createClient({
  baseUrl,
  anonKey,
  headers: {
    'Content-Profile': APP_SCHEMA,
    'Accept-Profile': APP_SCHEMA,
  },
});

// Convenience aliases — auth uses JWT API routes; database still via InsForge SDK
export const db = insforge.database;
export const { storage, realtime, functions } = insforge;
