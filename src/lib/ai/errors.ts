import { InsForgeError } from '@insforge/sdk';

export function aiErrorResponse(error: unknown): Response {
  if (error instanceof InsForgeError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.statusCode === 429) {
      return Response.json({ error: 'AI rate limit reached. Try again shortly.' }, { status: 429 });
    }
  }
  return Response.json({ error: 'AI request failed. Please try again.' }, { status: 500 });
}
