"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

const revenueCards = [
  { label: "Total Revenue", value: "$234,500" },
  { label: "Referral Fees", value: "$89,200" },
  { label: "Audit Fees", value: "$145,300" },
  { label: "Pending Payouts", value: "$12,400" },
];

interface Transaction {
  id: string; date: string; type: string; user: string; amount: string; status: "completed" | "pending" | "failed";
}

const initialTransactions: Transaction[] = [
  { id: "T-301", date: "2026-03-19", type: "Audit Fee", user: "Chen Family", amount: "$1,200", status: "completed" },
  { id: "T-300", date: "2026-03-19", type: "Referral Fee", user: "BuildRight Inc.", amount: "$350", status: "completed" },
  { id: "T-299", date: "2026-03-18", type: "Assessor Payout", user: "Mike Torres", amount: "$850", status: "pending" },
  { id: "T-298", date: "2026-03-18", type: "Audit Fee", user: "Park Family", amount: "$1,100", status: "completed" },
  { id: "T-297", date: "2026-03-17", type: "Referral Fee", user: "SafeFix Co.", amount: "$420", status: "completed" },
  { id: "T-296", date: "2026-03-17", type: "Assessor Payout", user: "Jane Liu", amount: "$920", status: "pending" },
  { id: "T-295", date: "2026-03-16", type: "Audit Fee", user: "Walsh Family", amount: "$1,050", status: "completed" },
  { id: "T-294", date: "2026-03-16", type: "Referral Fee", user: "HomeGuard LLC", amount: "$280", status: "failed" },
  { id: "T-293", date: "2026-03-15", type: "Assessor Payout", user: "James Obi", amount: "$780", status: "completed" },
  { id: "T-292", date: "2026-03-15", type: "Audit Fee", user: "Kim Family", amount: "$1,300", status: "completed" },
];

const statusVariant = (s: string) => s === "completed" ? "success" : s === "pending" ? "warning" : "destructive";

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const { addNotification } = useStore();

  function processPayout() {
    setTransactions((prev) =>
      prev.map((t) => t.status === "pending" ? { ...t, status: "completed" as const } : t)
    );
    addNotification({ title: "Payouts Processed", message: "All pending payouts have been processed successfully.", type: "success" });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Platform Payments</h1>
          <Button onClick={processPayout}>Process Payouts</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {revenueCards.map((r) => (
            <Card key={r.label}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">{r.label}</p>
                <p className="mt-1 text-2xl font-bold">{r.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 text-gray-500">{t.date}</td>
                      <td className="py-3">{t.type}</td>
                      <td className="py-3 font-medium">{t.user}</td>
                      <td className="py-3 font-medium">{t.amount}</td>
                      <td className="py-3"><Badge variant={statusVariant(t.status)}>{t.status}</Badge></td>
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
