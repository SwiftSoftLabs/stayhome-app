"use client";

import { PayoutsUnavailable } from "@/components/payouts-unavailable";

export default function ContractorPayments() {
  return (
    <PayoutsUnavailable
      title="Payments"
      body="Contractor payments are not available. This screen does not show a balance or a payment history."
    />
  );
}
