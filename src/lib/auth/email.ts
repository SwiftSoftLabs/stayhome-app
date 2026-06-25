import { createClient } from '@insforge/sdk';
import { authConfig } from './config';

function getEmailClient() {
  const baseUrl = authConfig.insforgeUrl();
  const anonKey = authConfig.insforgeAnonKey();
  if (!baseUrl || !anonKey) {
    return null;
  }
  return createClient({ baseUrl, anonKey });
}

export async function sendVerificationEmail(email: string, code: string) {
  const client = getEmailClient();
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h1 style="color:#2563eb">Verify your StayHome email</h1>
      <p>Your verification code is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
      <p style="color:#606060">This code expires in 15 minutes.</p>
    </div>
  `;

  if (!client) {
    console.info(`[auth] verification code for ${email}: ${code}`);
    return;
  }

  const { error } = await client.emails.send({
    to: email,
    subject: 'Verify your StayHome account',
    html,
    from: authConfig.emailFrom(),
  });

  if (error) {
    console.error('[auth] failed to send verification email:', error.message);
    console.info(`[auth] verification code fallback for ${email}: ${code}`);
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  const client = getEmailClient();
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <h1 style="color:#2563eb">Reset your StayHome password</h1>
      <p>Your password reset code is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
      <p style="color:#606060">This code expires in 15 minutes.</p>
    </div>
  `;

  if (!client) {
    console.info(`[auth] password reset code for ${email}: ${code}`);
    return;
  }

  const { error } = await client.emails.send({
    to: email,
    subject: 'Reset your StayHome password',
    html,
    from: authConfig.emailFrom(),
  });

  if (error) {
    console.error('[auth] failed to send reset email:', error.message);
    console.info(`[auth] password reset fallback for ${email}: ${code}`);
  }
}
