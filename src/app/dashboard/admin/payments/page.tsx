"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useAudits } from "@/lib/hooks/useAudits";
import { useReports } from "@/lib/hooks/useReports";

const AUDIT_FEE = 1200;
const ASSESSOR_FEE = 300;
const REFERRAL_FEE = 350;

export default function AdminPaymentsPage() {
  const { addNotification } = useStore();
  const { audits, loading: auditsLoading } = useAudits();
  const { reports, loading: reportsLoading } = useReports();
  const [processed, setProcessed] = useState(false);
  const loading = auditsLoading || reportsLoading;

  const completedAudits = audits.filter((a) => a.status === "completed");
  const auditRevenue = completedAudits.length * AUDIT_FEE;
  const assessorPayouts = completedAudits.length * ASSESSOR_FEE;
  const referralFees = reports.length * REFERRAL_FEE;
  const netRevenue = auditRevenue - assessorPayouts;

  const handleProcess = () => {
    setProcessed(true);
    addNotification({ title: "Payouts Processed", message: "All pending payouts have been processed.", type: "success" });
  };

  const revenueCards = [
    { label: "Total Audit Revenue", value: `$${auditRevenue.toLocaleString()}`, color: "text-blue-600" },
    { label: "Referral Fees", value: `$${referralFees.toLocaleString()}`, color: "text-green-600" },
    { label: "Assessor Payouts", value: `$${assessorPayouts.toLocaleString()}`, color: "text-amber-600" },
    { label: "Net Revenue", value: `$${netRevenue.toLocaleString()}`, color: "text-purple-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Platform Payments</h1>
          <Button onClick={handleProcess} disabled={processed}>
            {processed ? "Payouts Sent" : "Process Payouts"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {revenueCards.map((r) => (
            <Card key={r.label}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">{r.label}</p>
                <p className={`mt-1 text-2xl font-bold ${r.color}`}>
                  {loading ? "—" : r.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Completed Audits</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0,1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : completedAudits.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No completed audits yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Family</th>
                      <th className="pb-2 font-medium">Address</th>
                      <th className="pb-2 font-medium">Audit Fee</th>
                      <th className="pb-2 font-medium">Assessor Payout</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedAudits.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-3 text-gray-500">{a.scheduled_date ?? "—"}</td>
                        <td className="py-3 font-medium text-gray-900">{a.family_profile?.name ?? "—"}</td>
                        <td className="py-3 text-gray-500">{a.property?.street ?? "—"}</td>
                        <td className="py-3 font-medium">${AUDIT_FEE.toLocaleString()}</td>
                        <td className="py-3 text-gray-500">${ASSESSOR_FEE.toLocaleString()}</td>
                        <td className="py-3">
                          <Badge variant={processed ? "success" : "warning"}>
                            {processed ? "completed" : "pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
