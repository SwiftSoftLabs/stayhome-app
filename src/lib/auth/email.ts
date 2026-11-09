import { authConfig } from './config';

// Server-only. InsForge rejects anon-key email sends ("Sending emails requires an
// authenticated user"), so auth emails go through POST /api/email/send-raw with a
// server credential read at call time. Never logs codes, addresses or provider text.
function getEmailClient() {
  if (typeof window !== 'undefined') return null;
  const baseUrl = (process.env.INSFORGE_URL || process.env.NEXT_PUBLIC_INSFORGE_URL || '').trim().replace(/\/+$/, '');
  const key = (process.env.INSFORGE_API_KEY || process.env.INSFORGE_SERVICE_KEY || '').trim();
  if (!baseUrl || !key) return null;
  return {
    emails: {
      async send(payload: { to: string; subject: string; html: string; from?: string }) {
        let error: { message: string } | null = null;
        try {
          const res = await fetch(`${baseUrl}/api/email/send-raw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000),
            cache: 'no-store',
          });
          if (!res.ok) error = { message: `send-raw HTTP ${res.status}` };
        } catch {
          error = { message: 'send-raw network error' };
        }
        return { error };
      },
    },
  };
}

function logAuthCode(kind: 'verification' | 'reset', email: string, code: string) {
  if (process.env.NODE_ENV === 'production') return;
  console.info(`[auth] ${kind} code for ${email}: ${code}`);
}

function logSendFailure(kind: 'verification' | 'reset') {
  console.error(`[auth] failed to send ${kind} email`);
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
    logAuthCode('verification', email, code);
    return;
  }

  const { error } = await client.emails.send({
    to: email,
    subject: 'Verify your StayHome account',
    html,
    from: authConfig.emailFrom(),
  });

  if (error) {
    logSendFailure('verification');
    logAuthCode('verification', email, code);
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
    logAuthCode('reset', email, code);
    return;
  }

  const { error } = await client.emails.send({
    to: email,
    subject: 'Reset your StayHome password',
    html,
    from: authConfig.emailFrom(),
  });

  if (error) {
    logSendFailure('reset');
    logAuthCode('reset', email, code);
  }
}
