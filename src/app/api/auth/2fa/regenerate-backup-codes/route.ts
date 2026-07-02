import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { regenerateBackupCodes } from '@/lib/auth/webauthn';

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const body = await parseJson<{ code: string }>(request);
    const backupCodes = await regenerateBackupCodes(user.id, user.email, body.code);
    return jsonOk({ backupCodes });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to regenerate backup codes.', 400);
  }
}
