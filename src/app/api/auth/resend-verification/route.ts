import { resendVerification } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';
import { emailOnlySchema } from '@/lib/auth/validation';

export async function POST(request: Request) {
  try {
    const body = emailOnlySchema.parse(await request.json());
    const result = await resendVerification(body.email);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
