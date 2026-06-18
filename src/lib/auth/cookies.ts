import { cookies } from 'next/headers';
import { authConfig } from './config';

const baseOptions = {
  httpOnly: true,
  secure: authConfig.cookieSecure,
  sameSite: 'lax' as const,
  path: '/',
};

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const jar = await cookies();
  jar.set(authConfig.accessCookieName, accessToken, {
    ...baseOptions,
    maxAge: authConfig.jwtAccessTtlSeconds,
  });
  jar.set(authConfig.refreshCookieName, refreshToken, {
    ...baseOptions,
    maxAge: authConfig.jwtRefreshTtlSeconds,
  });
}

export async function clearAuthCookies() {
  const jar = await cookies();
  jar.set(authConfig.accessCookieName, '', { ...baseOptions, maxAge: 0 });
  jar.set(authConfig.refreshCookieName, '', { ...baseOptions, maxAge: 0 });
}

export async function getAccessTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(authConfig.accessCookieName)?.value ?? null;
}

export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(authConfig.refreshCookieName)?.value ?? null;
}

export async function setOAuthStateCookie(state: string) {
  const jar = await cookies();
  jar.set(authConfig.oauthStateCookieName, state, {
    ...baseOptions,
    maxAge: 600,
  });
}

export async function consumeOAuthStateCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(authConfig.oauthStateCookieName)?.value ?? null;
  jar.set(authConfig.oauthStateCookieName, '', { ...baseOptions, maxAge: 0 });
  return value;
}
