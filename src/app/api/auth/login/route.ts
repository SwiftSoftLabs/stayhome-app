import { loginWithEmail } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';
import { emailPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = emailPasswordSchema.parse(await request.json());
    const user = await loginWithEmail(body.email, body.password);
    return Response.json({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
