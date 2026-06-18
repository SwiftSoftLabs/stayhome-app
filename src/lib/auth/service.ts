import { randomUUID } from 'crypto';
import { authConfig } from './config';
import { query, queryOne } from './db';
import { hashPassword, verifyPassword } from './passwords';
import { generateOtpCode, generateSecureToken, hashToken } from './crypto';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './tokens';
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from './cookies';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { AuthHttpError } from './http';
import type { AuthUser, DbUser, VerificationCodeType } from './types';
import { toAuthUser } from './types';

async function logAudit(userId: string | null, action: string, metadata: Record<string, unknown> = {}) {
  await query(
    `INSERT INTO auth_audit_logs (user_id, action, metadata)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, action, JSON.stringify(metadata)]
  ).catch((error) => console.error('[auth] audit log failed', error));
}

async function getUserById(id: string): Promise<DbUser | null> {
  return queryOne<DbUser>(`SELECT * FROM users WHERE id = $1`, [id]);
}

async function getUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email]);
}

async function createSession(user: DbUser): Promise<{ accessToken: string; refreshToken: string }> {
  const sessionId = randomUUID();
  const refreshToken = await signRefreshToken({
    userId: user.id,
    sessionId,
    email: user.email,
    role: user.role,
  });
  const accessToken = await signAccessToken({
    userId: user.id,
    sessionId,
    email: user.email,
    role: user.role,
  });

  await query(
    `INSERT INTO auth_sessions (id, user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' seconds')::interval)`,
    [sessionId, user.id, hashToken(refreshToken), String(authConfig.jwtRefreshTtlSeconds)]
  );

  return { accessToken, refreshToken };
}

async function issueSessionCookies(user: DbUser) {
  const tokens = await createSession(user);
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  await logAudit(user.id, 'login_success', { email: user.email });
  return toAuthUser(user);
}

export async function signupWithEmail(email: string, password: string) {
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new AuthHttpError('An account with this email already exists.', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await queryOne<DbUser>(
    `INSERT INTO users (email, password_hash, email_verified, role, app_origin)
     VALUES (lower($1), $2, false, 'client', $3)
     RETURNING *`,
    [email, passwordHash, authConfig.appOrigin]
  );

  if (!user) {
    throw new AuthHttpError('Unable to create account.', 500);
  }

  const code = generateOtpCode();
  await query(
    `INSERT INTO auth_verification_codes (user_id, email, code, type, expires_at)
     VALUES ($1, lower($2), $3, 'email_verification', now() + ($4 || ' seconds')::interval)`,
    [user.id, email, code, String(authConfig.verifyCodeTtlSeconds)]
  );

  await sendVerificationEmail(email, code);
  await logAudit(user.id, 'signup', { email });

  return { user: toAuthUser(user), message: 'Check your email for the verification code.' };
}

export async function loginWithEmail(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AuthHttpError('Invalid email or password.', 401);
  }

  if (!user.email_verified) {
    throw new AuthHttpError('Please verify your email before signing in.', 403);
  }

  return issueSessionCookies(user);
}

export async function verifyEmail(email: string, code: string) {
  const row = await queryOne<{ user_id: string }>(
    `SELECT user_id
     FROM auth_verification_codes
     WHERE lower(email) = lower($1)
       AND code = $2
       AND type = 'email_verification'
       AND consumed_at IS NULL
       AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code]
  );

  if (!row) {
    throw new AuthHttpError('Invalid or expired verification code.', 400);
  }

  await query(`UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1`, [row.user_id]);
  await query(
    `UPDATE auth_verification_codes
     SET consumed_at = now()
     WHERE lower(email) = lower($1) AND code = $2 AND type = 'email_verification'`,
    [email, code]
  );

  const user = await getUserById(row.user_id);
  if (!user) {
    throw new AuthHttpError('User not found.', 404);
  }

  return issueSessionCookies(user);
}

export async function resendVerification(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return { message: 'If an account exists, a verification code has been sent.' };
  }
  if (user.email_verified) {
    throw new AuthHttpError('Email is already verified.', 400);
  }

  const code = generateOtpCode();
  await query(
    `INSERT INTO auth_verification_codes (user_id, email, code, type, expires_at)
     VALUES ($1, lower($2), $3, 'email_verification', now() + ($4 || ' seconds')::interval)`,
    [user.id, email, code, String(authConfig.verifyCodeTtlSeconds)]
  );
  await sendVerificationEmail(email, code);
  return { message: 'Verification code sent.' };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) return null;

  try {
    const payload = await verifyAccessToken(accessToken);
    const user = await getUserById(payload.sub!);
    return user ? toAuthUser(user) : null;
  } catch {
    return null;
  }
}

export async function refreshSession(): Promise<AuthUser | null> {
  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) return null;

  let payload;
  try {
    payload = await verifyRefreshToken(refreshToken);
  } catch {
    await clearAuthCookies();
    return null;
  }

  const session = await queryOne<{ id: string; user_id: string; revoked_at: Date | null }>(
    `SELECT id, user_id, revoked_at
     FROM auth_sessions
     WHERE id = $1 AND refresh_token_hash = $2 AND expires_at > now()`,
    [payload.sid, hashToken(refreshToken)]
  );

  if (!session || session.revoked_at) {
    await clearAuthCookies();
    return null;
  }

  await query(`UPDATE auth_sessions SET revoked_at = now() WHERE id = $1`, [session.id]);

  const user = await getUserById(session.user_id);
  if (!user) {
    await clearAuthCookies();
    return null;
  }

  return issueSessionCookies(user);
}

export async function logout() {
  const refreshToken = await getRefreshTokenFromCookies();
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      await query(`UPDATE auth_sessions SET revoked_at = now() WHERE id = $1`, [payload.sid]);
      await logAudit(payload.sub ?? null, 'logout');
    } catch {
      // ignore invalid refresh token on logout
    }
  }
  await clearAuthCookies();
}

export async function forgotPassword(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    return { message: 'If an account exists, a reset code has been sent.' };
  }

  const code = generateOtpCode();
  await query(
    `INSERT INTO auth_verification_codes (user_id, email, code, type, expires_at)
     VALUES ($1, lower($2), $3, 'password_reset', now() + ($4 || ' seconds')::interval)`,
    [user.id, email, code, String(authConfig.resetCodeTtlSeconds)]
  );
  await sendPasswordResetEmail(email, code);
  return { message: 'If an account exists, a reset code has been sent.' };
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const row = await queryOne<{ user_id: string }>(
    `SELECT user_id
     FROM auth_verification_codes
     WHERE lower(email) = lower($1)
       AND code = $2
       AND type = 'password_reset'
       AND consumed_at IS NULL
       AND expires_at > now()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code]
  );

  if (!row) {
    throw new AuthHttpError('Invalid or expired reset code.', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
    passwordHash,
    row.user_id,
  ]);
  await query(
    `UPDATE auth_verification_codes
     SET consumed_at = now()
     WHERE lower(email) = lower($1) AND code = $2 AND type = 'password_reset'`,
    [email, code]
  );
  await query(`UPDATE auth_sessions SET revoked_at = now() WHERE user_id = $1`, [row.user_id]);
  await logAudit(row.user_id, 'password_reset');

  return { message: 'Password updated successfully.' };
}
