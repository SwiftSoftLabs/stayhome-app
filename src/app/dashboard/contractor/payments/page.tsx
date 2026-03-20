"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: 1, date: "2026-03-18", job: "JOB-1021", amount: "$2,400", status: "Paid", method: "Direct Deposit" },
  { id: 2, date: "2026-03-15", job: "JOB-1019", amount: "$1,800", status: "Pending", method: "Direct Deposit" },
  { id: 3, date: "2026-03-12", job: "JOB-1017", amount: "$3,100", status: "Paid", method: "Check" },
  { id: 4, date: "2026-03-08", job: "JOB-1015", amount: "$1,500", status: "Paid", method: "Direct Deposit" },
  { id: 5, date: "2026-02-28", job: "JOB-1012", amount: "$2,200", status: "Paid", method: "Direct Deposit" },
  { id: 6, date: "2026-02-20", job: "JOB-1010", amount: "$4,000", status: "Paid", method: "Check" },
  { id: 7, date: "2026-02-15", job: "JOB-1008", amount: "$1,900", status: "Paid", method: "Direct Deposit" },
  { id: 8, date: "2026-02-10", job: "JOB-1005", amount: "$2,800", status: "Paid", method: "Direct Deposit" },
  { id: 9, date: "2026-01-30", job: "JOB-1003", amount: "$1,600", status: "Paid", method: "Check" },
  { id: 10, date: "2026-01-22", job: "JOB-1001", amount: "$1,200", status: "Paid", method: "Direct Deposit" },
];

export default function ContractorPayments() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const balanceCards = [
    { label: "Available Balance", value: "$3,200", color: "text-green-600" },
    { label: "Pending", value: "$1,800", color: "text-amber-600" },
    { label: "Total Earned", value: "$45,000", color: "text-blue-600" },
  ];

  const statusVariant = (s: string) => (s === "Paid" ? "success" : "warning");

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <p className="mt-1 text-sm text-gray-500">Track your earnings and payment history.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {balanceCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{c.label}</CardTitle>
            </CardHeader>
            <CardContent><p className={`text-2xl font-bold ${c.color}`}>{c.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        <Button onClick={() => showToast("Withdrawal request submitted!")}>Request Withdrawal</Button>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Job Reference</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.job}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.amount}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{t.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
