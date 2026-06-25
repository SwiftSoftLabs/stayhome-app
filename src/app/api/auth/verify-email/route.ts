import { verifyEmail } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';
import { verifyEmailSchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = verifyEmailSchema.parse(await request.json());
    const user = await verifyEmail(body.email, body.code);
    return Response.json({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
