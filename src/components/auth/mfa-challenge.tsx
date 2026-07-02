'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyMfaLogin } from '@/lib/auth/client';
import { useAuth } from '@/lib/AuthProvider';

const POST_LOGIN = '/dashboard';

export function MfaChallenge() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await verifyMfaLogin(code.trim());
      await refreshUser();
      router.push(POST_LOGIN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-sm flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Two-factor authentication</h1>
      <p className="text-sm text-muted-foreground">Enter the code from your authenticator app or a backup code.</p>
      <input
        className="rounded border px-3 py-2"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="6-digit code"
        autoComplete="one-time-code"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" disabled={loading} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
        {loading ? 'Verifying…' : 'Continue'}
      </button>
    </form>
  );
}
