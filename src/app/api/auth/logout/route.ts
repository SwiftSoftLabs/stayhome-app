import { logout } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';

export async function POST() {
  try {
    await logout();
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
