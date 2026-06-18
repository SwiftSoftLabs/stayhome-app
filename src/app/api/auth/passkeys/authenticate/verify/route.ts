import { jsonError, jsonOk, parseJson } from '@/lib/auth/http';
import { clearMfaPendingFromCookies, getMfaPendingTokenFromCookies } from '@/lib/auth/cookies';
import { verifyMfaPendingToken } from '@/lib/auth/tokens';
import { getUserById } from '@/lib/auth/middleware';
import { issueSessionForUser } from '@/lib/auth/service';
import { verifyAuthentication } from '@/lib/auth/webauthn';

export async function POST(request: Request) {
  try {
    const body = await parseJson<{ response: unknown }>(request);
    const mfaToken = await getMfaPendingTokenFromCookies();
    let expectedUserId: string | undefined;
    if (mfaToken) {
      expectedUserId = (await verifyMfaPendingToken(mfaToken)).sub;
    }

    const userId = await verifyAuthentication(body.response, expectedUserId);
    const user = await getUserById(userId);
    if (!user) return jsonError('User not found.', 404);

    if (mfaToken) {
      await clearMfaPendingFromCookies();
    }

    const authUser = await issueSessionForUser(user);
    return jsonOk({ user: authUser });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Passkey authentication failed.', 400);
  }
}
