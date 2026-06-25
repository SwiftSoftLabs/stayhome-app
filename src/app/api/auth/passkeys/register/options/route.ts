import { jsonError, jsonOk } from '@/lib/auth/http';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { createRegistrationOptions } from '@/lib/auth/webauthn';

export async function POST() {
  try {
    const { user } = await requireAuth();
    const options = await createRegistrationOptions(user.id, user.email);
    return jsonOk({ options });
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return jsonError(error instanceof Error ? error.message : 'Unable to start passkey registration.', 500);
  }
}
