import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service - StayHome",
  description: "The terms for using StayHome.",
};

/** Keep this URL: the sign-up and Google consent checkboxes link it. */
export default function TermsPage() {
  return <LegalPage type="terms" />;
}
