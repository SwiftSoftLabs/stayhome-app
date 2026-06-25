import { createHash, randomBytes, createHmac, scryptSync, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { authConfig } from './config';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOtpCode(length = 6): string {
  const max = 10 ** length;
  const num = randomBytes(4).readUInt32BE(0) % max;
  return num.toString().padStart(length, '0');
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}


export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    randomBytes(5).toString('hex').slice(0, 10).toUpperCase()
  );
}

export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code, authConfig.bcryptRounds);
}

export async function verifyBackupCode(code: string, hashes: string[]): Promise<number> {
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(code, hashes[i])) return i;
  }
  return -1;
}

function deriveEncryptionKey() {
  const key = authConfig.encryptionKey();
  if (!key || key.length < 32) throw new Error('AUTH_ENCRYPTION_KEY must be at least 32 characters.');
  return scryptSync(key, 'jwt-auth-totp', 32);
}

export function encryptTotpSecret(secret: string): string {
  const key = deriveEncryptionKey();
  const iv = randomBytes(12);
  const mac = createHmac('sha256', key).update(`${iv.toString('hex')}:${secret}`).digest('hex');
  return `${iv.toString('hex')}:${mac}.${secret}`;
}

export function decryptTotpSecret(payload: string): string {
  const key = deriveEncryptionKey();
  const [ivHex, rest] = payload.split(':');
  if (!ivHex || !rest) throw new Error('Invalid encrypted payload.');
  const [mac, secret] = rest.split('.');
  if (!mac || !secret) throw new Error('Invalid encrypted payload.');
  const expected = createHmac('sha256', key).update(`${ivHex}:${secret}`).digest('hex');
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
    throw new Error('Invalid encrypted payload.');
  }
  return secret;
}
