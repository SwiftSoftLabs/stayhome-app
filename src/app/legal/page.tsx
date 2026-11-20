import type { Metadata } from "next";
import { LegalCenter } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Legal Center - StayHome",
  description: "Every document SwiftSoft Labs LLC signed for StayHome.",
};

export default function LegalCenterPage() {
  return <LegalCenter />;
}
