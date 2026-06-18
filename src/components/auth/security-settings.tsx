'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/lib/AuthProvider';

export function SecuritySettings() {
  const { user, refreshUser } = useAuth();
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const start2fa = async () => {
    setError(null);
    const res = await fetch('/api/auth/2fa/enable', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to start 2FA');
      return;
    }
    setTotpUri(data.totpUri);
  };

  const confirm2fa = async () => {
    setError(null);
    const res = await fetch('/api/auth/2fa/verify-setup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Invalid code');
      return;
    }
    setBackupCodes(data.backupCodes);
    setTotpUri(null);
    setMessage('Two-factor authentication enabled.');
    await refreshUser();
  };

  const disable2fa = async () => {
    setError(null);
    const res = await fetch('/api/auth/2fa/disable', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to disable 2FA');
      return;
    }
    setMessage('Two-factor authentication disabled.');
    await refreshUser();
  };

  const registerPasskey = async () => {
    setError(null);
    const optsRes = await fetch('/api/auth/passkeys/register/options', {
      method: 'POST',
      credentials: 'include',
    });
    const { options, error: optsErr } = await optsRes.json();
    if (!optsRes.ok) {
      setError(optsErr || 'Unable to start passkey registration');
      return;
    }
    const { startRegistration } = await import('@simplewebauthn/browser');
    const attestation = await startRegistration({ optionsJSON: options });
    const verifyRes = await fetch('/api/auth/passkeys/register/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: attestation }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      setError(verifyData.error || 'Passkey registration failed');
      return;
    }
    setMessage('Passkey registered.');
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Security</h1>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="flex flex-col gap-2 rounded border p-4">
        <h2 className="font-medium">Two-factor authentication</h2>
        <p className="text-sm text-muted-foreground">
          Status: {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </p>
        {!user.twoFactorEnabled && !totpUri ? (
          <>
            <input
              type="password"
              className="rounded border px-3 py-2"
              placeholder="Current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={start2fa} className="rounded bg-black px-4 py-2 text-white">
              Enable 2FA
            </button>
          </>
        ) : null}
        {totpUri ? (
          <>
            <QRCodeSVG value={totpUri} size={180} />
            <input
              className="rounded border px-3 py-2"
              placeholder="Authenticator code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="button" onClick={confirm2fa} className="rounded bg-black px-4 py-2 text-white">
              Confirm setup
            </button>
          </>
        ) : null}
        {backupCodes ? (
          <div className="text-sm">
            <p className="font-medium">Save these backup codes (shown once):</p>
            <ul className="mt-2 list-disc pl-5">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {user.twoFactorEnabled ? (
          <>
            <input
              className="rounded border px-3 py-2"
              placeholder="TOTP or backup code to disable"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button type="button" onClick={disable2fa} className="rounded border px-4 py-2">
              Disable 2FA
            </button>
          </>
        ) : null}
      </section>

      <section className="flex flex-col gap-2 rounded border p-4">
        <h2 className="font-medium">Passkeys</h2>
        <button type="button" onClick={registerPasskey} className="rounded bg-black px-4 py-2 text-white">
          Add passkey
        </button>
      </section>
    </div>
  );
}
