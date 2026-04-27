"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudits } from "@/lib/hooks/useAudits";
import { useStore } from "@/lib/store";

const AUDIT_FEE = 300; // $300 per completed audit

// Determine month label from date string
function monthLabel(d: string) {
  const dt = new Date(d);
  return dt.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function EarningsPage() {
  const { addNotification } = useStore();
  const { audits, loading } = useAudits();

  const completed = audits.filter((a) => a.status === "completed");

  // Build last 6 months earnings
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      amount: 0,
    };
  });

  completed.forEach((a) => {
    if (!a.scheduled_date) return;
    const key = a.scheduled_date.slice(0, 7);
    const m = months.find((m) => m.key === key);
    if (m) m.amount += AUDIT_FEE;
  });

  const thisMonth = months[5].amount;
  const lastMonth = months[4].amount;
  const total = months.reduce((s, m) => s + m.amount, 0);
  const maxAmount = Math.max(...months.map((m) => m.amount), 1);

  const transactions = [...completed].reverse().slice(0, 10);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <Button onClick={() => addNotification({ title: "Payout Requested", message: "Your payout has been submitted for processing.", type: "success" })}>
            Request Payout
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "This Month", value: `$${thisMonth.toLocaleString()}`, color: "text-green-600" },
            { label: "Last Month", value: `$${lastMonth.toLocaleString()}`, color: "text-blue-600" },
            { label: "6-Month Total", value: `$${total.toLocaleString()}`, color: "text-purple-600" },
            { label: "Audits Completed", value: completed.length, color: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader><CardTitle>Earnings Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {months.map((m) => (
                <div key={m.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">
                    {m.amount > 0 ? `$${(m.amount / 1000).toFixed(1)}k` : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-blue-500 transition-all hover:bg-blue-600 min-h-[4px]"
                    style={{ height: `${(m.amount / maxAmount) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No completed audits yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Family</th>
                      <th className="pb-2 font-medium">Address</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 text-gray-500">{a.scheduled_date ?? "—"}</td>
                        <td className="py-2.5 font-medium text-gray-900">{a.family_profile?.name ?? "—"}</td>
                        <td className="py-2.5 text-gray-500">{a.property?.street ?? "—"}</td>
                        <td className="py-2.5 font-semibold text-gray-900">${AUDIT_FEE}</td>
                        <td className="py-2.5">
                          <Badge variant="success">paid</Badge>
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
