import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPage } from "@/components/legal/LegalPage";
import { documentForSlug } from "@/lib/legal";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = documentForSlug((await params).slug);
  return doc ? { title: `${doc.label} - StayHome` } : {};
}

/** /privacy and /terms have their own routes; the other public documents live here. Internal records 404. */
export default async function LegalDocumentPage({ params }: Props) {
  const doc = documentForSlug((await params).slug);
  if (!doc) notFound();
  return <LegalPage type={doc.type} />;
}
