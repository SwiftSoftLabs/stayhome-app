import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'sh_access';
const REFRESH_COOKIE = 'sh_refresh';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/profile',
  '/settings',
  '/book-audit',
  '/reports',
  '/schedule',
  '/report-builder',
  '/leads',
  '/active-jobs',
  '/users',
  '/audits',
];

const PUBLIC_AUTH_PATHS = ['/mfa', '/forgot-password', '/reset-password'];

function isPublicAuthApi(pathname: string): boolean {
  if (!pathname.startsWith('/api/auth/')) return false;
  if (pathname.startsWith('/api/auth/oauth/')) return true;
  if (pathname === '/api/auth/2fa/verify-login') return true;
  if (pathname.startsWith('/api/auth/passkeys/authenticate/')) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (isPublicAuthApi(pathname)) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) return NextResponse.next();

  const hasAccess = request.cookies.get(ACCESS_COOKIE);
  const hasRefresh = request.cookies.get(REFRESH_COOKIE);

  if (!hasAccess && !hasRefresh) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/mfa',
    '/forgot-password',
    '/forgot-password/:path*',
    '/reset-password',
    '/reset-password/:path*',
    '/api/auth/:path*',
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/book-audit/:path*',
    '/reports/:path*',
    '/schedule/:path*',
    '/report-builder/:path*',
    '/leads/:path*',
    '/active-jobs/:path*',
    '/users/:path*',
    '/audits/:path*',
  ],
};
