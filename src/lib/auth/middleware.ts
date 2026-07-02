import { queryOne } from './db';
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
  getMfaPendingTokenFromCookies,
} from './cookies';
import { verifyAccessToken, verifyMfaPendingToken } from './tokens';
import { toAuthUser, type AuthUser, type DbUser } from './types';
import { AuthHttpError } from './http';

export class AuthError extends AuthHttpError {
  constructor(message: string, status = 401) {
    super(message, status);
  }
}

export async function getUserById(userId: string) {
  return queryOne<DbUser>(`SELECT * FROM users WHERE id = $1`, [userId]);
}

export async function requireAuth(options?: { requireVerifiedEmail?: boolean }) {
  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) throw new AuthError('Authentication required.', 401);

  let userId: string;
  try {
    const payload = await verifyAccessToken(accessToken);
    userId = payload.sub!;
  } catch {
    throw new AuthError('Invalid or expired session.', 401);
  }

  const user = await getUserById(userId);
  if (!user) throw new AuthError('Authentication required.', 401);
  if (options?.requireVerifiedEmail && !user.email_verified) {
    throw new AuthError('Email verification required.', 403);
  }

  return { user, authUser: toAuthUser(user) };
}

export async function requireMfaPending() {
  const token = await getMfaPendingTokenFromCookies();
  if (!token) throw new AuthError('MFA step required.', 403);
  try {
    const { sub } = await verifyMfaPendingToken(token);
    return { userId: sub };
  } catch {
    throw new AuthError('MFA step expired.', 401);
  }
}

export async function getOptionalAuth(): Promise<AuthUser | null> {
  try {
    const { authUser } = await requireAuth();
    return authUser;
  } catch {
    return null;
  }
}

export async function clearSessionCookies() {
  await clearAuthCookies();
}
