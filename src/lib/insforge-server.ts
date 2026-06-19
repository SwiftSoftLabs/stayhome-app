import { createClient, type InsForgeClient } from '@insforge/sdk';

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_INSFORGE_URL ?? '').replace(/\/+$/, '');
}

function getSchemaHeaders(): Record<string, string> {
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA?.trim() || 'app_stayhome';
  return { 'Accept-Profile': schema, 'Content-Profile': schema };
}

export function getServiceInsforgeClient(accessToken?: string): InsForgeClient {
  const baseUrl = getBaseUrl();
  const headers = getSchemaHeaders();
  const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim() ?? '';
  const apiKey = process.env.INSFORGE_API_KEY?.trim();

  if (accessToken?.trim() && baseUrl) {
    return createClient({ baseUrl, anonKey, edgeFunctionToken: accessToken, isServerMode: true, headers });
  }

  const key = apiKey || anonKey;
  if (!baseUrl || !key) throw new Error('Missing InsForge env');
  return createClient({ baseUrl, anonKey: key, isServerMode: true, headers });
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}
