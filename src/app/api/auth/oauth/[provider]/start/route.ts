import { NextResponse } from 'next/server';
import { buildGoogleAuthUrl, createOAuthState } from '@/lib/auth/service';
import { setOAuthStateCookie } from '@/lib/auth/cookies';
import { getAppBaseUrl } from '@/lib/auth/config';
import { AuthHttpError } from '@/lib/auth/http';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (provider !== 'google') {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 404 });
  }

  try {
    const state = createOAuthState();
    await setOAuthStateCookie(state);
    const redirectUri = `${getAppBaseUrl(request.url)}/api/auth/oauth/google/callback`;
    const url = buildGoogleAuthUrl(state, redirectUri);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof AuthHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to start OAuth flow' }, { status: 500 });
  }
}
