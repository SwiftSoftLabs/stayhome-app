import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { disableTwoFactor } from '@/lib/auth/webauthn';

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const body = await parseJson<{ code: string }>(request);
    await disableTwoFactor(user.id, user.email, body.code);
    return jsonOk({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to disable 2FA.', 400);
  }
}
