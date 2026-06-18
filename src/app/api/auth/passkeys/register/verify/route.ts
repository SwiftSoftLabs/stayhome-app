import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { verifyRegistration } from '@/lib/auth/webauthn';

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const body = await parseJson<{ response: unknown; deviceName?: string }>(request);
    await verifyRegistration(user.id, body.response, body.deviceName);
    return jsonOk({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Passkey registration failed.', 400);
  }
}
