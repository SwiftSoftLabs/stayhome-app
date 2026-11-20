// Runs in vitest (`npm run test:unit`), not node --test: it renders the TSX legal pages.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { config, middleware } from '@/middleware';
import { LegalCenter, LegalPage } from '@/components/legal/LegalPage';
import { Footer } from '@/components/footer';
import LegalDocumentPage from '@/app/legal/[slug]/page';
import {
  documentBody,
  documentForSlug,
  formatSignedDate,
  LEGAL_DOCUMENTS,
  parseRelease,
  SYNLEX_PORTAL_URL,
  SYNLEX_RELEASE_API,
} from '@/lib/legal';

// The pages call connection() to render per request; outside a Next request there is nothing to wait for.
vi.mock('next/server', async (orig) => ({ ...(await orig<object>()), connection: async () => {} }));
// The navbar needs the signed-in store; the legal pages don't depend on it.
vi.mock('@/components/navbar', () => ({ Navbar: () => null }));

const drafting =
  'This draft is compiled from your compliance plan. It is not legal advice. Have a qualified lawyer review it before you publish it.';
const release = {
  organization: 'SwiftSoft Labs',
  project: 'stayhome-app',
  version: '1.0.0',
  signedAt: '2026-11-20T12:15:35.578Z',
  signature: { algorithm: 'Ed25519' },
  documents: [
    {
      type: 'privacy_policy',
      title: 'Privacy Policy',
      content: `# Privacy Policy\n\n${drafting}\n\n## 1. Who we are\n\nSwiftSoft Labs LLC. Write to legal@swiftsoftlabs.com.\n\n- DPA: https://vercel.com/legal/dpa\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))`,
    },
    { type: 'healthcare', title: 'Healthcare and Wellness Notice', content: '# Healthcare and Wellness Notice\n\n## 3. Health and wellness data\n\nNot medical advice.' },
    { type: 'ropa', title: 'Record of Processing Activities', content: '# ROPA' },
    { type: 'broken' },
  ],
};

const html = async (node: Promise<ReactElement>) => renderToStaticMarkup(await node);
const serve = (body: unknown, status = 200) => vi.stubGlobal('fetch', vi.fn(async () => Response.json(body, { status })));

afterEach(() => vi.unstubAllGlobals());

describe('legal pages from the signed Synlex release', () => {
  it('reads the stayhome-app release and keeps /privacy and /terms for the consent checkboxes', () => {
    expect(SYNLEX_RELEASE_API).toBe('https://synlex.vercel.app/api/public/v1/swiftsoftlabs/stayhome-app');
    expect(SYNLEX_PORTAL_URL).toBe('https://synlex.vercel.app/p/swiftsoftlabs/stayhome-app');
    expect(LEGAL_DOCUMENTS.find((d) => d.type === 'privacy_policy')?.href).toBe('/privacy');
    expect(LEGAL_DOCUMENTS.find((d) => d.type === 'terms')?.href).toBe('/terms');
  });

  it('drops the drafting line and the title heading, and keeps the rest', () => {
    expect(documentBody(`# Privacy Policy\n\n${drafting}\n\n## Who we are\n\nSwiftSoft Labs LLC.\n\n# Not the title`)).toBe(
      '## Who we are\n\nSwiftSoft Labs LLC.\n\n# Not the title',
    );
  });

  it('parses a release and rejects the 404 body', () => {
    expect(parseRelease(release)?.documents.map((d) => d.type)).toEqual(['privacy_policy', 'healthcare', 'ropa']);
    expect(parseRelease({ error: { code: 'NOT_FOUND' } })).toBeNull();
    expect(formatSignedDate('2026-11-20T12:15:35.578Z')).toBe('November 20, 2026');
  });

  it('renders a document with the version line and verify link, and no drafting line, raw HTML or javascript: link', async () => {
    serve(release);
    const page = await html(LegalPage({ type: 'privacy_policy' }));
    expect(page).toContain('data-testid="legal-privacy"');
    expect(page).toContain('<h1>Privacy Policy</h1>');
    expect(page).toContain('<h2>1. Who we are</h2>');
    expect(page).toContain('<a href="https://vercel.com/legal/dpa">https://vercel.com/legal/dpa</a>');
    expect(page).toMatch(/Version 1\.0\.0, signed <time[^>]*>November 20, 2026<\/time>/);
    expect(page).toContain(`href="${SYNLEX_PORTAL_URL}"`);
    expect(page).toContain('Verify the signed release');
    expect(page).toContain('href="/legal"');
    expect(page).not.toContain('This draft is compiled');
    expect(page).not.toContain('<script');
    expect(page).not.toContain('javascript:');
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(SYNLEX_RELEASE_API, expect.objectContaining({ next: { revalidate: 300 } }));
  });

  it('shows the unavailable note with the verify link when Synlex is down or has no release', async () => {
    serve({ error: { code: 'NOT_FOUND' } }, 404);
    const down = await html(LegalPage({ type: 'terms' }));
    expect(down).toContain('<h1>Terms of Service</h1>');
    expect(down).toContain('temporarily unavailable');
    expect(down).toContain('Verify the signed release');

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));
    expect(await html(LegalCenter())).toContain('temporarily unavailable');
  });

  it('lists the public documents in the Legal Center and leaves internal records out', async () => {
    serve(release);
    const center = await html(LegalCenter());
    expect(center).toContain('<a href="/privacy">Privacy Policy</a>');
    expect(center).toContain('<a href="/legal/health">Healthcare and Wellness Notice</a>');
    expect(center).not.toContain('Record of Processing Activities');
    expect(center).toContain('Verify the signed release');
  });

  it('serves public slugs and 404s internal records and unknown slugs', async () => {
    expect(documentForSlug('health')?.type).toBe('healthcare');
    expect(documentForSlug('contact')?.type).toBe('legal_contact');
    for (const slug of ['ropa', 'retention_policy', 'access_control', 'encryption_policy', 'logging_policy', 'transfer_documentation', 'dpa', 'refund', 'privacy', 'nope']) {
      expect(documentForSlug(slug), slug).toBeUndefined();
      await expect(LegalDocumentPage({ params: Promise.resolve({ slug }) }), slug).rejects.toMatchObject({
        digest: expect.stringContaining('404'),
      });
    }
  });

  it('links the Legal Center, Privacy, Terms and the legal contact from the footer, and no dead page', () => {
    const footer = renderToStaticMarkup(Footer());
    for (const href of ['/legal', '/privacy', '/terms', '/legal/contact']) expect(footer).toContain(`href="${href}"`);
    expect(footer).not.toContain('href="/about"');
    expect(footer).not.toContain('href="/contact"');
  });

  it('lets signed-out visitors open the legal pages, and still sends them from app pages to login', () => {
    for (const path of ['/legal', '/legal/health', '/legal/ropa', '/privacy', '/terms']) {
      expect(middleware(new NextRequest(`http://127.0.0.1${path}`)).headers.get('location'), path).toBeNull();
    }
    expect(config.matcher.filter((m) => /^\/(legal|privacy|terms)\b/.test(m))).toEqual([]);
    expect(middleware(new NextRequest('http://127.0.0.1/settings')).headers.get('location')).toContain('/login?from=%2Fsettings');
  });
});
