import { SignJWT, jwtVerify } from 'jose';
import { authConfig } from './config';
import type { AuthSessionPayload, UserRole } from './types';

function accessSecret() {
  return new TextEncoder().encode(authConfig.jwtAccessSecret());
}

function refreshSecret() {
  return new TextEncoder().encode(authConfig.jwtRefreshSecret());
}

export async function signAccessToken(input: {
  userId: string;
  sessionId: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  return new SignJWT({
    sid: input.sessionId,
    email: input.email,
    role: input.role,
    type: 'access',
  } satisfies Omit<AuthSessionPayload, 'sub'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(`${authConfig.jwtAccessTtlSeconds}s`)
    .sign(accessSecret());
}

export async function signRefreshToken(input: {
  userId: string;
  sessionId: string;
  email: string;
  role: UserRole;
}): Promise<string> {
  return new SignJWT({
    sid: input.sessionId,
    email: input.email,
    role: input.role,
    type: 'refresh',
  } satisfies Omit<AuthSessionPayload, 'sub'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(`${authConfig.jwtRefreshTtlSeconds}s`)
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AuthSessionPayload> {
  const { payload } = await jwtVerify(token, accessSecret());
  if (payload.type !== 'access' || !payload.sub || !payload.sid) {
    throw new Error('Invalid access token');
  }
  return payload as unknown as AuthSessionPayload;
}

export async function verifyRefreshToken(token: string): Promise<AuthSessionPayload> {
  const { payload } = await jwtVerify(token, refreshSecret());
  if (payload.type !== 'refresh' || !payload.sub || !payload.sid) {
    throw new Error('Invalid refresh token');
  }
  return payload as unknown as AuthSessionPayload;
}
