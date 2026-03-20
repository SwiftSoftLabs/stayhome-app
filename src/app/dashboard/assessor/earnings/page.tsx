"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const summaryCards = [
  { label: "This Month", value: "$4,500", color: "text-green-600" },
  { label: "Last Month", value: "$3,800", color: "text-blue-600" },
  { label: "Total", value: "$28,400", color: "text-purple-600" },
  { label: "Pending", value: "$1,200", color: "text-amber-600" },
];

const chartData = [
  { month: "Oct", amount: 3200 },
  { month: "Nov", amount: 3600 },
  { month: "Dec", amount: 2900 },
  { month: "Jan", amount: 4100 },
  { month: "Feb", amount: 3800 },
  { month: "Mar", amount: 4500 },
];

const transactions = [
  { date: "Mar 20, 2026", auditId: "AUD-042", family: "Johnson Family", amount: "$300", status: "pending" as const, method: "Direct Deposit" },
  { date: "Mar 19, 2026", auditId: "AUD-041", family: "Martinez Family", amount: "$300", status: "pending" as const, method: "Direct Deposit" },
  { date: "Mar 18, 2026", auditId: "AUD-039", family: "Chen Family", amount: "$300", status: "paid" as const, method: "Direct Deposit" },
  { date: "Mar 17, 2026", auditId: "AUD-038", family: "Patel Family", amount: "$300", status: "paid" as const, method: "Direct Deposit" },
  { date: "Mar 16, 2026", auditId: "AUD-037", family: "O'Brien Family", amount: "$300", status: "paid" as const, method: "Direct Deposit" },
  { date: "Mar 14, 2026", auditId: "AUD-035", family: "Davis Family", amount: "$300", status: "paid" as const, method: "Direct Deposit" },
  { date: "Mar 12, 2026", auditId: "AUD-033", family: "Robinson Family", amount: "$300", status: "paid" as const, method: "Check" },
  { date: "Mar 10, 2026", auditId: "AUD-031", family: "Lee Family", amount: "$300", status: "paid" as const, method: "Direct Deposit" },
  { date: "Mar 8, 2026", auditId: "AUD-029", family: "Brown Family", amount: "$300", status: "pending" as const, method: "Direct Deposit" },
  { date: "Mar 5, 2026", auditId: "AUD-027", family: "Thompson Family", amount: "$300", status: "paid" as const, method: "Check" },
];

const maxAmount = Math.max(...chartData.map((d) => d.amount));

export default function EarningsPage() {
  const [notification, setNotification] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {notification && (
          <div className="fixed right-4 top-4 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">{notification}</div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <Button onClick={() => { setNotification("Payout requested successfully!"); setTimeout(() => setNotification(null), 3000); }}>
            Request Payout
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Earnings Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {chartData.map((d) => (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">${(d.amount / 1000).toFixed(1)}k</span>
                  <div
                    className="w-full rounded-t-md bg-blue-500 transition-all hover:bg-blue-600"
                    style={{ height: `${(d.amount / maxAmount) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500">{d.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Audit ID</th>
                    <th className="pb-2 font-medium">Family</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.auditId} className="border-b border-gray-50">
                      <td className="py-2.5 text-gray-600">{t.date}</td>
                      <td className="py-2.5 font-mono text-xs text-gray-500">{t.auditId}</td>
                      <td className="py-2.5 font-medium text-gray-900">{t.family}</td>
                      <td className="py-2.5 font-semibold text-gray-900">{t.amount}</td>
                      <td className="py-2.5">
                        <Badge variant={t.status === "paid" ? "success" : "warning"}>{t.status}</Badge>
                      </td>
                      <td className="py-2.5 text-gray-600">{t.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
