import { signupWithEmail } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';
import { emailPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = emailPasswordSchema.parse(await request.json());
    const result = await signupWithEmail(body.email, body.password);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
