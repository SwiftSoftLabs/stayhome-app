import { queryOne } from './db';
import { AuthHttpError } from './http';

export class AuthEmailLimitedError extends AuthHttpError {
  constructor() {
    super('Too many emails sent to this address. Try again later.', 429);
  }
}

export async function reserveAuthEmail(
  email: string,
  kind: 'email_verification' | 'password_reset',
): Promise<void> {
  let allowed = false;
  try {
    const row = await queryOne<{ ok: boolean }>(
      `SELECT reserve_auth_email($1, $2) AS ok`,
      [email, kind],
    );
    allowed = row?.ok === true;
  } catch (error) {
    if (error instanceof AuthHttpError) throw error;
    console.error('[auth] email rate limit unavailable');
    throw new AuthHttpError('Email is temporarily unavailable.', 503);
  }

  if (!allowed) {
    throw new AuthEmailLimitedError();
  }
}
