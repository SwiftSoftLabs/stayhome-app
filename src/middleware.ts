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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
