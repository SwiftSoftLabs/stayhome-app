'use client';

import type { AuthUser } from './types';

type AuthResponse = { user: AuthUser };

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed');
  }
  return data as T;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include' });
  if (response.status === 401) {
    const refreshed = await refreshSession();
    return refreshed;
  }
  if (!response.ok) return null;
  const data = await response.json();
  return (data as { user: AuthUser | null }).user;
}

export async function refreshSession(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) return null;
  const data = await parseJson<AuthResponse>(response);
  return data.user;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson<AuthResponse>(response);
  return data.user;
}

export async function signupWithEmail(email: string, password: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJson<{ message: string }>(response);
}

export async function verifyEmailCode(email: string, code: string): Promise<AuthUser> {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await parseJson<AuthResponse>(response);
  return data.user;
}

export async function logoutSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJson<{ message: string }>(response);
}

export async function resendVerificationEmail(email: string): Promise<{ message: string }> {
  const response = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return parseJson<{ message: string }>(response);
}

export function startGoogleOAuth() {
  window.location.href = '/api/auth/oauth/google/start';
}

