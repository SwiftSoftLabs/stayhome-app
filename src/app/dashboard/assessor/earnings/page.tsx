"use client";

import { PayoutsUnavailable } from "@/components/payouts-unavailable";

export default function EarningsPage() {
  return (
    <PayoutsUnavailable
      title="Earnings"
      body="Assessor payouts are not available. Families are not charged during the free launch, and this screen does not calculate a fee."
    />
  );
}
