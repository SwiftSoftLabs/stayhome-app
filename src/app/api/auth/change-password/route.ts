import { changePassword } from '@/lib/auth/service';
import { AuthError, requireAuth } from '@/lib/auth/middleware';
import { jsonError, jsonOk, parseJson, toErrorResponse } from '@/lib/auth/http';
import type { ChangePasswordBody } from '@/lib/auth/types';
import { z } from 'zod';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();
    const body = schema.parse(await request.json()) as ChangePasswordBody;
    const result = await changePassword(user.id, body.currentPassword, body.newPassword);
    return jsonOk(result);
  } catch (error) {
    if (error instanceof AuthError) return jsonError(error.message, error.status);
    return toErrorResponse(error);
  }
}
