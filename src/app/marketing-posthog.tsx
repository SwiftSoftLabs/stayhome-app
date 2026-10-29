"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { buildCapture, isMarketingPath } from "./marketing-posthog-paths";

const PRODUCT = "stayhome-app";
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || "";
const HOST = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com").replace(/\/+$/, "");
const DISTINCT_KEY = "ssl-marketing-distinct-id";

function distinctId(): string {
  try {
    const existing = window.sessionStorage.getItem(DISTINCT_KEY);
    if (existing) return existing;
    const id = window.crypto.randomUUID();
    window.sessionStorage.setItem(DISTINCT_KEY, id);
    return id;
  } catch {
    return window.crypto.randomUUID();
  }
}

export function captureMarketing(event: string, properties?: Record<string, unknown>): void {
  if (!KEY || typeof window === "undefined") return;
  const url = window.location.href;
  const body = buildCapture({ apiKey: KEY, event, distinctId: distinctId(), url, product: PRODUCT, properties });
  void fetch(`${HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

/** Pageviews for public marketing routes. No-op until NEXT_PUBLIC_POSTHOG_KEY is set. */
export default function MarketingPostHog() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!isMarketingPath(pathname)) return;
    if (last.current === pathname) return;
    last.current = pathname;
    captureMarketing("$pageview");
  }, [pathname]);
  return null;
}
