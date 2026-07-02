import { jsonError, jsonOk } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { getPasskeysForUser } from '@/lib/auth/webauthn';

export async function GET() {
  try {
    const { user } = await requireAuth();
    const passkeys = await getPasskeysForUser(user.id);
    return jsonOk({
      passkeys: passkeys.map((row) => ({
        id: row.id,
        deviceName: row.device_name,
        createdAt: row.created_at,
        lastUsedAt: row.last_used_at,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to load passkeys.', 500);
  }
}
