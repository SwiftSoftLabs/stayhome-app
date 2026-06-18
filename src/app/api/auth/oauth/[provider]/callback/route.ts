import { NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/auth/service';
import { consumeOAuthStateCookie } from '@/lib/auth/cookies';
import { getAppBaseUrl } from '@/lib/auth/config';
import { AuthHttpError } from '@/lib/auth/http';

const POST_LOGIN = '/dashboard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  const baseUrl = getAppBaseUrl(request.url);
  const loginUrl = `${baseUrl}/login`;

  if (oauthError) {
    return NextResponse.redirect(`${loginUrl}?error=oauth_denied`);
  }

  if (provider !== 'google' || !code || !state) {
    return NextResponse.redirect(`${loginUrl}?error=oauth_invalid`);
  }

  const savedState = await consumeOAuthStateCookie();
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${loginUrl}?error=oauth_state`);
  }

  try {
    const result = await exchangeGoogleCode(code, `${baseUrl}/api/auth/oauth/google/callback`);
    if (result && typeof result === 'object' && 'mfaRequired' in result && result.mfaRequired) {
      return NextResponse.redirect(`${baseUrl}/mfa`);
    }
    return NextResponse.redirect(`${baseUrl}${POST_LOGIN}`);
  } catch (error) {
    const message = error instanceof AuthHttpError ? error.message : 'Google sign-in failed';
    return NextResponse.redirect(`${loginUrl}?error=${encodeURIComponent(message)}`);
  }
}
