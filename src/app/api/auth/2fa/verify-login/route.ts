import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { AuthError, requireMfaPending } from '@/lib/auth/middleware';
import { completeMfaLogin } from '@/lib/auth/service';

export async function POST(request: Request) {
  try {
    const { userId } = await requireMfaPending();
    const body = await parseJson<{ code: string }>(request);
    const user = await completeMfaLogin(userId, body.code);
    return jsonOk({ user });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Invalid verification code.', 400);
  }
}
