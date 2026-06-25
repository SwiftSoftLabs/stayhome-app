function trimTrailingSlash(origin: string) {
  return origin.replace(/\/$/, '');
}

function isLoopbackHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isConfiguredPublicOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:') return true;
    return !isLoopbackHost(url.hostname);
  } catch {
    return false;
  }
}

export function getOriginFromRequest(request: Request): string | null {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost?.split(',')[0]?.trim() || request.headers.get('host');
  if (!host) return null;

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const proto =
    forwardedProto?.split(',')[0]?.trim()
    || (isLoopbackHost(host.split(':')[0] ?? host) ? 'http' : 'https');

  return `${proto}://${host}`;
}

export function getAppOrigin(request?: Request) {
  const configured = trimTrailingSlash(
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '',
  );

  if (configured && isConfiguredPublicOrigin(configured)) {
    return configured;
  }

  if (request) {
    const fromRequest = getOriginFromRequest(request);
    if (fromRequest) {
      return trimTrailingSlash(fromRequest);
    }
  }

  if (configured) {
    return configured;
  }

  return 'http://localhost:3000';
}
