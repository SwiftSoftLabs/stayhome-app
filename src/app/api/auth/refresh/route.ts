import { refreshSession } from '@/lib/auth/service';
import { toErrorResponse } from '@/lib/auth/http';

export async function POST() {
  try {
    const user = await refreshSession();
    if (!user) {
      return Response.json({ error: 'Session expired' }, { status: 401 });
    }
    return Response.json({ user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
