import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { verifyUserPassword } from '@/lib/auth/service';
import { buildTwoFactorSetup } from '@/lib/auth/webauthn';

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const body = await parseJson<{ password: string }>(request);
    const valid = await verifyUserPassword(user.id, body.password);
    if (!valid) return jsonError('Password is incorrect.', 401);
    const setup = await buildTwoFactorSetup(user.id, user.email);
    return jsonOk(setup);
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to start 2FA setup.', 500);
  }
}
