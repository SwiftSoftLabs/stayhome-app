import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import { query, queryOne } from './db';
import { authConfig } from './config';
import {
  encryptTotpSecret,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from './crypto';
import { buildTotpUri, generateTotpSecret, verifyTotpCode } from './totp';

const challengeTtlSeconds = 300;

export async function storeWebAuthnChallenge(
  challenge: string,
  type: 'registration' | 'authentication',
  userId: string | null
) {
  await query(
    `INSERT INTO auth_webauthn_challenges (challenge, type, user_id, expires_at)
     VALUES ($1, $2, $3, now() + ($4 || ' seconds')::interval)`,
    [challenge, type, userId, String(challengeTtlSeconds)]
  );
}

export async function consumeWebAuthnChallenge(
  challenge: string,
  type: 'registration' | 'authentication'
) {
  return queryOne<{ user_id: string | null }>(
    `DELETE FROM auth_webauthn_challenges
     WHERE challenge = $1 AND type = $2 AND expires_at > now()
     RETURNING user_id`,
    [challenge, type]
  );
}

export async function getPasskeysForUser(userId: string) {
  return query<{
    id: string;
    credential_id: string;
    device_name: string;
    created_at: string;
    last_used_at: string | null;
    transports: string[];
  }>(
    `SELECT id, credential_id, device_name, created_at, last_used_at, transports
     FROM auth_passkeys WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

async function getPasskeyByCredentialId(credentialId: string) {
  return queryOne<{
    id: string;
    user_id: string;
    credential_id: string;
    public_key: Buffer;
    sign_count: string;
    transports: string[];
  }>(`SELECT * FROM auth_passkeys WHERE credential_id = $1`, [credentialId]);
}

export async function createRegistrationOptions(userId: string, email: string) {
  const existing = await getPasskeysForUser(userId);
  const options = await generateRegistrationOptions({
    rpName: authConfig.webauthnRpName(),
    rpID: authConfig.webauthnRpId(),
    userName: email,
    userDisplayName: email,
    userID: isoUint8Array.fromUTF8String(userId),
    attestationType: 'none',
    excludeCredentials: existing.map((row) => ({
      id: row.credential_id,
      transports: row.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
  await storeWebAuthnChallenge(options.challenge, 'registration', userId);
  return options;
}

export async function verifyRegistration(userId: string, response: unknown, deviceName?: string) {
  const verification = await verifyRegistrationResponse({
    response: response as Parameters<typeof verifyRegistrationResponse>[0]['response'],
    expectedChallenge: async (challenge) => {
      const row = await consumeWebAuthnChallenge(challenge, 'registration');
      return row?.user_id === userId;
    },
    expectedOrigin: authConfig.webauthnOrigin(),
    expectedRPID: authConfig.webauthnRpId(),
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Passkey registration failed.');
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await query(
    `INSERT INTO auth_passkeys (user_id, credential_id, public_key, sign_count, transports, device_name)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      credential.id,
      Buffer.from(credential.publicKey),
      credential.counter,
      credential.transports ?? [],
      deviceName?.trim() || `${credentialDeviceType}${credentialBackedUp ? ' (synced)' : ''}`,
    ]
  );
}

export async function createAuthenticationOptions(userId?: string, email?: string) {
  let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] | undefined;
  let resolvedUserId = userId ?? null;

  if (email) {
    const user = await queryOne<{ id: string }>(`SELECT id FROM users WHERE lower(email) = lower($1)`, [
      email.trim(),
    ]);
    resolvedUserId = user?.id ?? null;
  }

  if (resolvedUserId) {
    const passkeys = await getPasskeysForUser(resolvedUserId);
    allowCredentials = passkeys.map((row) => ({
      id: row.credential_id,
      transports: row.transports as AuthenticatorTransport[],
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID: authConfig.webauthnRpId(),
    allowCredentials,
    userVerification: 'preferred',
  });
  await storeWebAuthnChallenge(options.challenge, 'authentication', resolvedUserId);
  return options;
}

export async function verifyAuthentication(response: unknown, expectedUserId?: string) {
  const credentialId = (response as { id?: string }).id;
  if (!credentialId) throw new Error('Missing credential.');

  const passkey = await getPasskeyByCredentialId(credentialId);
  if (!passkey) throw new Error('Unknown passkey.');
  if (expectedUserId && passkey.user_id !== expectedUserId) {
    throw new Error('Passkey does not belong to this account.');
  }

  const verification = await verifyAuthenticationResponse({
    response: response as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
    expectedChallenge: async (challenge) => {
      const row = await consumeWebAuthnChallenge(challenge, 'authentication');
      return !expectedUserId || row?.user_id === expectedUserId || row?.user_id === passkey.user_id;
    },
    expectedOrigin: authConfig.webauthnOrigin(),
    expectedRPID: authConfig.webauthnRpId(),
    credential: {
      id: passkey.credential_id,
      publicKey: new Uint8Array(passkey.public_key),
      counter: Number(passkey.sign_count),
      transports: passkey.transports as AuthenticatorTransport[],
    },
  });

  if (!verification.verified) throw new Error('Passkey verification failed.');

  await query(`UPDATE auth_passkeys SET sign_count = $2, last_used_at = now() WHERE id = $1`, [
    passkey.id,
    verification.authenticationInfo.newCounter,
  ]);

  return passkey.user_id;
}

export async function buildTwoFactorSetup(userId: string, email: string) {
  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret);
  await query(
    `INSERT INTO auth_two_factor (user_id, totp_secret_encrypted, backup_codes_hash)
     VALUES ($1, $2, '{}')
     ON CONFLICT (user_id) DO UPDATE SET totp_secret_encrypted = EXCLUDED.totp_secret_encrypted, enabled_at = NULL`,
    [userId, encrypted]
  );
  return { totpUri: buildTotpUri(secret, email) };
}

export async function finalizeTwoFactorSetup(userId: string, email: string, code: string) {
  const row = await queryOne<{ totp_secret_encrypted: string }>(
    `SELECT totp_secret_encrypted FROM auth_two_factor WHERE user_id = $1`,
    [userId]
  );
  if (!row || !verifyTotpCode(row.totp_secret_encrypted, email, code)) {
    throw new Error('Invalid authenticator code.');
  }

  const backupCodes = generateBackupCodes();
  const backupHashes = await Promise.all(backupCodes.map((value) => hashBackupCode(value)));

  await query(
    `UPDATE auth_two_factor SET enabled_at = now(), backup_codes_hash = $2 WHERE user_id = $1`,
    [userId, backupHashes]
  );
  await query(`UPDATE users SET two_factor_enabled = true, updated_at = now() WHERE id = $1`, [userId]);
  return backupCodes;
}

export async function disableTwoFactor(userId: string, email: string, code: string) {
  const row = await queryOne<{ totp_secret_encrypted: string; backup_codes_hash: string[] }>(
    `SELECT totp_secret_encrypted, backup_codes_hash FROM auth_two_factor WHERE user_id = $1`,
    [userId]
  );
  if (!row) throw new Error('Two-factor authentication is not enabled.');

  const backupIndex = await verifyBackupCode(code, row.backup_codes_hash);
  const validTotp = verifyTotpCode(row.totp_secret_encrypted, email, code);
  if (backupIndex < 0 && !validTotp) throw new Error('Invalid verification code.');

  await query(`DELETE FROM auth_two_factor WHERE user_id = $1`, [userId]);
  await query(`UPDATE users SET two_factor_enabled = false, updated_at = now() WHERE id = $1`, [userId]);
}

export async function verifyLoginSecondFactor(userId: string, email: string, code: string) {
  const row = await queryOne<{ totp_secret_encrypted: string; backup_codes_hash: string[] }>(
    `SELECT totp_secret_encrypted, backup_codes_hash FROM auth_two_factor WHERE user_id = $1`,
    [userId]
  );
  if (!row) throw new Error('Two-factor authentication is not configured.');

  const backupIndex = await verifyBackupCode(code, row.backup_codes_hash);
  if (backupIndex >= 0) {
    const nextHashes = row.backup_codes_hash.filter((_, index) => index !== backupIndex);
    await query(`UPDATE auth_two_factor SET backup_codes_hash = $2 WHERE user_id = $1`, [userId, nextHashes]);
    return;
  }

  if (!verifyTotpCode(row.totp_secret_encrypted, email, code)) {
    throw new Error('Invalid verification code.');
  }
}

export async function regenerateBackupCodes(userId: string, email: string, code: string) {
  const row = await queryOne<{ totp_secret_encrypted: string }>(
    `SELECT totp_secret_encrypted FROM auth_two_factor WHERE user_id = $1 AND enabled_at IS NOT NULL`,
    [userId]
  );
  if (!row || !verifyTotpCode(row.totp_secret_encrypted, email, code)) {
    throw new Error('Invalid authenticator code.');
  }
  const backupCodes = generateBackupCodes();
  const backupHashes = await Promise.all(backupCodes.map((value) => hashBackupCode(value)));
  await query(`UPDATE auth_two_factor SET backup_codes_hash = $2 WHERE user_id = $1`, [userId, backupHashes]);
  return backupCodes;
}
