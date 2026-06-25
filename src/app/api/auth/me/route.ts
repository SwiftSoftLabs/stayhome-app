import { getCurrentUser, refreshSession } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) {
      user = await refreshSession();
    }
    if (!user) {
      return Response.json({ user: null }, { status: 401 });
    }
    return Response.json({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
