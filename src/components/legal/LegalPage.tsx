import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import {
  documentBody,
  fetchSignedRelease,
  formatSignedDate,
  LEGAL_DOCUMENTS,
  type LegalDocumentType,
  publicDocuments,
  type SignedRelease,
  SYNLEX_PORTAL_URL,
} from "@/lib/legal";

const verifyLink = (
  <a href={SYNLEX_PORTAL_URL} target="_blank" rel="noopener noreferrer">
    Verify the signed release
  </a>
);

function LegalShell({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main data-testid={testId} className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:py-16">
        <article className="legal-prose">{children}</article>
      </main>
      <Footer />
    </div>
  );
}

function ReleaseLine({ release }: { release: SignedRelease }) {
  return (
    <p data-testid="legal-release" className="text-sm text-gray-500">
      Version {release.version}, signed <time dateTime={release.signedAt}>{formatSignedDate(release.signedAt)}</time> · {verifyLink}
    </p>
  );
}

function Unavailable({ release }: { release: SignedRelease | null }) {
  return (
    <p role="status" data-testid="legal-unavailable">
      {release
        ? "This document is not part of the current signed release."
        : "The signed documents are temporarily unavailable. Please try again in a few minutes."}{" "}
      {verifyLink}
    </p>
  );
}

/** One signed Synlex document as a page. Renders per request; the release fetch itself is cached for 300 s. */
export async function LegalPage({ type }: { type: LegalDocumentType }) {
  // Per request, so a failed fetch is retried on the next visit instead of being prerendered as the page.
  await connection();
  const release = await fetchSignedRelease();
  const doc = release?.documents.find((d) => d.type === type);
  const page = LEGAL_DOCUMENTS.find((d) => d.type === type)!;

  return (
    <LegalShell testId={`legal-${page.href.split("/").pop()}`}>
      <h1>{doc?.title ?? page.label}</h1>
      {release && doc ? (
        <>
          <ReleaseLine release={release} />
          {/* skipHtml: raw HTML in a document is dropped, never rendered. The default urlTransform drops javascript: and other unsafe links. */}
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
            {documentBody(doc.content)}
          </ReactMarkdown>
        </>
      ) : (
        <Unavailable release={release} />
      )}
    </LegalShell>
  );
}

/** /legal: every public document in the current signed release. */
export async function LegalCenter() {
  await connection();
  const release = await fetchSignedRelease();

  return (
    <LegalShell testId="legal-center">
      <h1>Legal Center</h1>
      {release ? (
        <>
          <ReleaseLine release={release} />
          <p>The documents SwiftSoft Labs LLC signed for StayHome. Each one opens on its own page.</p>
          <ul>
            {publicDocuments(release).map((d) => (
              <li key={d.type}>
                <Link href={d.href}>{d.title}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Unavailable release={null} />
      )}
    </LegalShell>
  );
}
