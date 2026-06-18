import { resetPassword } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';
import { resetPasswordSchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = resetPasswordSchema.parse(await request.json());
    const result = await resetPassword(body.email, body.code, body.password);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
