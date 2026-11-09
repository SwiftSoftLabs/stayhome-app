"use client";

import { PayoutsUnavailable } from "@/components/payouts-unavailable";

export default function AdminPaymentsPage() {
  return (
    <PayoutsUnavailable
      title="Platform payments"
      body="Platform payouts are not available. This screen does not calculate fees from audits."
    />
  );
}
