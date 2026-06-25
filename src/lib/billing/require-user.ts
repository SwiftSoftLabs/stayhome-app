import { requireAuthUser } from '@/lib/auth/api-guard';

export async function requireBillingUser(request: Request) {
  try {
    return await requireAuthUser(request);
  } catch {
    throw new Error('UNAUTHORIZED');
  }
}
