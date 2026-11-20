import { signupWithEmail } from '@/lib/auth/service';
import { AuthHttpError, toErrorResponse } from '@/lib/auth/http';
import { signupSchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = signupSchema.parse(await request.json());
    if (body.acceptedLegal !== true) {
      throw new AuthHttpError(
        'Accept the Privacy Policy and Terms of Service to create an account.',
        400,
      );
    }
    const result = await signupWithEmail(body.email, body.password, true);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
