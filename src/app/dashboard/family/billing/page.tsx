"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import BillingSettings from "@/components/billing/BillingSettings";

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <BillingSettings />
      </div>
    </DashboardLayout>
  );
}
