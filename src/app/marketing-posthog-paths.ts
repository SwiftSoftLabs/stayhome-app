export const MARKETING_PATHS = new Set([
  "/",
  "/about",
  "/affiliates",
  "/book",
  "/contact",
  "/dti-calculator",
  "/help",
  "/how-it-works",
  "/join",
  "/legal",
  "/portfolio",
  "/preview",
  "/pricing",
  "/privacy",
  "/privacy-policy",
  "/security",
  "/showcase",
  "/success",
  "/support",
  "/tax-disclaimer",
  "/terms",
  "/terms-and-conditions",
]);

export function isMarketingPath(path: string | null | undefined): boolean {
  if (!path) return false;
  const bare = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return MARKETING_PATHS.has(bare);
}

export function buildCapture(opts: {
  apiKey: string;
  event: string;
  distinctId: string;
  url: string;
  product: string;
  properties?: Record<string, unknown>;
}): Record<string, unknown> {
  const url = new URL(opts.url);
  return {
    api_key: opts.apiKey,
    event: opts.event,
    distinct_id: opts.distinctId,
    properties: {
      distinct_id: opts.distinctId,
      $current_url: opts.url,
      $pathname: url.pathname || "/",
      $host: url.host,
      $lib: "web",
      token: opts.apiKey,
      product: opts.product,
      surface: "marketing",
      ...(opts.properties ?? {}),
    },
  };
}
