import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy - StayHome",
  description: "How SwiftSoft Labs LLC handles personal data in StayHome.",
};

/** Keep this URL: the sign-up and Google consent checkboxes link it. */
export default function PrivacyPage() {
  return <LegalPage type="privacy_policy" />;
}
