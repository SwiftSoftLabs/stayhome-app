import { query } from '@/lib/auth/db';
import { jsonError, jsonOk } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireAuth();
    const { id } = await params;
    await query(`DELETE FROM auth_passkeys WHERE id = $1 AND user_id = $2`, [id, user.id]);
    return jsonOk({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to delete passkey.', 400);
  }
}
