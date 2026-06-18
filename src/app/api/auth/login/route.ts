import { loginWithEmail } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';
import { emailPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = emailPasswordSchema.parse(await request.json());
    const result = await loginWithEmail(body.email, body.password);
    if (result && typeof result === 'object' && 'mfaRequired' in result && result.mfaRequired) {
      return Response.json({ mfaRequired: true, user: result.user });
    }
    return Response.json({ user: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
