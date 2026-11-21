/**
 * StayHome's legal pages show the documents SwiftSoft Labs LLC signed in Synlex.
 * Synlex serves the latest signed release as public JSON, so a newly signed
 * release shows here without a deploy. Server only: the pages fetch it on the server.
 */

/** Synlex moves to its launch domain later; only this env var changes then. */
const SYNLEX_PUBLIC_BASE = (process.env.SYNLEX_PUBLIC_BASE || 'https://synlex.swiftsoftlabs.com').replace(/\/+$/, '');
const SYNLEX_ORG = 'swiftsoftlabs';
const SYNLEX_PROJECT = 'stayhome-app';

export const SYNLEX_RELEASE_API = `${SYNLEX_PUBLIC_BASE}/api/public/v1/${SYNLEX_ORG}/${SYNLEX_PROJECT}`;
/** Anyone can view and verify the signed release here, internal records included. */
export const SYNLEX_PORTAL_URL = `${SYNLEX_PUBLIC_BASE}/p/${SYNLEX_ORG}/${SYNLEX_PROJECT}`;

/**
 * The public document types in the signed release, each with its page. /privacy
 * and /terms are the URLs the sign-up and Google consent checkboxes link. The
 * release's other types (ROPA, retention, access control, encryption, transfers)
 * are internal records: no page, and /legal/<their slug> is a 404. The verify
 * link covers them.
 */
export const LEGAL_DOCUMENTS = [
  { type: 'privacy_policy', href: '/privacy', label: 'Privacy Policy' },
  { type: 'terms', href: '/terms', label: 'Terms of Service' },
  { type: 'cookie_policy', href: '/legal/cookies', label: 'Cookie Policy' },
  { type: 'cookie_consent', href: '/legal/cookie-preferences', label: 'Cookie Preferences' },
  { type: 'erasure_policy', href: '/legal/account-deletion', label: 'Account Deletion' },
  { type: 'healthcare', href: '/legal/health', label: 'Healthcare and Wellness Notice' },
  { type: 'ai_use', href: '/legal/ai-use', label: 'AI Use' },
  { type: 'subprocessor_list', href: '/legal/subprocessors', label: 'Sub-processors' },
  { type: 'accessibility', href: '/legal/accessibility', label: 'Accessibility' },
  { type: 'copyright', href: '/legal/copyright', label: 'Copyright' },
  { type: 'legal_contact', href: '/legal/contact', label: 'Legal Contact' },
] as const;

export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];
export type LegalDocumentType = LegalDocument['type'];

/** The document served at /legal/<slug>, or undefined (unknown slug or internal record: 404). */
export function documentForSlug(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((d) => d.href === `/legal/${slug}`);
}

export type SignedDocument = { type: string; title: string; content: string };
export type SignedRelease = { version: string; signedAt: string; documents: SignedDocument[] };

/** Seconds a fetched release is reused. A failed fetch is never stored: Next caches status 200 only. */
export const RELEASE_REVALIDATE_SECONDS = 300;

/**
 * The latest signed release, or null when Synlex is down, has no published
 * release (404), or returns something unexpected.
 */
export async function fetchSignedRelease(): Promise<SignedRelease | null> {
  try {
    const res = await fetch(SYNLEX_RELEASE_API, {
      next: { revalidate: RELEASE_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return parseRelease(await res.json());
  } catch {
    return null;
  }
}

/** Keeps only what the pages use, and rejects a body that is not a release. */
export function parseRelease(body: unknown): SignedRelease | null {
  if (!body || typeof body !== 'object') return null;
  const { version, signedAt, documents } = body as Record<string, unknown>;
  if (typeof version !== 'string' || typeof signedAt !== 'string' || !Array.isArray(documents)) return null;
  return {
    version,
    signedAt,
    documents: documents.flatMap((d) =>
      d && typeof d.type === 'string' && typeof d.title === 'string' && typeof d.content === 'string'
        ? [{ type: d.type, title: d.title, content: d.content }]
        : [],
    ),
  };
}

/** The release's public documents, in LEGAL_DOCUMENTS order, each with its page. Internal records are left out. */
export function publicDocuments(release: SignedRelease) {
  return LEGAL_DOCUMENTS.flatMap((page) => {
    const doc = release.documents.find((d) => d.type === page.type);
    return doc ? [{ ...page, title: doc.title }] : [];
  });
}

/**
 * Older Synlex releases put this drafting line under every document's title.
 * StayHome's 1.0.0 doesn't have it, but a future release compiled the old way
 * could. SwiftSoft Labs published the signed release as its policy, so the line
 * is removed when rendering. It speaks to the drafter; removing it doesn't mean
 * a lawyer reviewed the text (none has).
 */
const SYNLEX_DRAFTING_LINE = /^This draft is compiled from your compliance plan\b/;

/** The body for the page: without the drafting line, and without its `# Title` (the page renders its own h1). */
export function documentBody(markdown: string): string {
  const lines = markdown.split('\n').filter((line) => !SYNLEX_DRAFTING_LINE.test(line.trim()));
  const first = lines.findIndex((line) => line.trim() !== '');
  if (first !== -1 && /^#\s/.test(lines[first])) lines.splice(first, 1);
  return lines.join('\n').trim();
}

/** "November 20, 2026" from an ISO time, in UTC so the server's zone never shifts the day. */
export function formatSignedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
