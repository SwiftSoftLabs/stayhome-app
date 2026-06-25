import { TOTP } from 'otpauth';
import { authConfig } from './config';
import { decryptTotpSecret } from './crypto';

export const createTotp = (secret: string, email: string) =>
  new TOTP({
    issuer: authConfig.webauthnRpName(),
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

export const generateTotpSecret = () => {
  const totp = new TOTP();
  return totp.secret.base32;
};

export const buildTotpUri = (secret: string, email: string) => createTotp(secret, email).toString();

export const verifyTotpCode = (encryptedSecret: string, email: string, code: string) => {
  const secret = decryptTotpSecret(encryptedSecret);
  const totp = createTotp(secret, email);
  return totp.validate({ token: code, window: 1 }) !== null;
};
