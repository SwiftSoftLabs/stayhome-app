import type { NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth/config';
import { verifyAccessToken } from '@/lib/auth/tokens';

export type AuthUser = { id: string; email: string };

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

function getAccessToken(request: Request): string | null {
  const nextRequest = request as NextRequest;
  const fromCookies = nextRequest.cookies?.get?.(authConfig.accessCookieName)?.value;
  if (fromCookies) return fromCookies;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();
  return readCookie(request.headers.get('cookie'), authConfig.accessCookieName);
}

export async function requireAuthUser(request: Request): Promise<AuthUser> {
  const token = getAccessToken(request);
  if (!token) throw new Error('UNAUTHORIZED');
  try {
    const payload = await verifyAccessToken(token);
    return { id: payload.sub, email: payload.email };
  } catch {
    throw new Error('UNAUTHORIZED');
  }
}
