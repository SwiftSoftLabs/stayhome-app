import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { AuthError, requireMfaPending } from '@/lib/auth/middleware';
import { createAuthenticationOptions } from '@/lib/auth/webauthn';

export async function POST(request: Request) {
  try {
    const body = await parseJson<{ email?: string }>(request);
    let userId: string | undefined;
    try {
      const pending = await requireMfaPending();
      userId = pending.userId;
    } catch {
      userId = undefined;
    }
    const options = await createAuthenticationOptions(userId, body.email);
    return jsonOk({ options });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to start passkey authentication.', 500);
  }
}
