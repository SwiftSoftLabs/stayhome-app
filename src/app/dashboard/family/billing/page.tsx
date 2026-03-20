"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const transactions = [
  { date: "Mar 12, 2026", description: "Standard Audit — 42 Oak Lane", amount: "$249.00", status: "paid" },
  { date: "Feb 18, 2026", description: "Premium Audit — 42 Oak Lane", amount: "$299.00", status: "paid" },
  { date: "Jan 8, 2026", description: "Basic Audit — 15 Maple Dr", amount: "$199.00", status: "paid" },
  { date: "Dec 5, 2025", description: "Grab Bar Installation (SafeStep Pros)", amount: "$350.00", status: "paid" },
  { date: "Nov 22, 2025", description: "Standard Audit — 42 Oak Lane", amount: "$249.00", status: "refunded" },
];

const statusBadge: Record<string, "success" | "warning"> = {
  paid: "success",
  refunded: "warning",
};

export default function BillingPage() {
  const [showUpdate, setShowUpdate] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>

        {/* Subscription */}
        <Card>
          <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Pay-per-audit</p>
                <p className="text-sm text-gray-500">No active subscription. You are billed per audit booking.</p>
              </div>
              <Badge variant="secondary">Free Tier</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
          <CardContent>
            {!showUpdate ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-14 items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-500">VISA</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">**** **** **** 4242</p>
                    <p className="text-xs text-gray-500">Expires 12/28</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowUpdate(true)}>Update</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-gray-700">Card Number</span>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="4242 4242 4242 4242" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">Expiry</span>
                    <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="MM/YY" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-sm font-medium text-gray-700">CVC</span>
                    <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="123" />
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setShowUpdate(false)}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowUpdate(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t, i) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-700">{t.date}</td>
                      <td className="py-3 text-gray-700">{t.description}</td>
                      <td className="py-3 font-medium text-gray-900">{t.amount}</td>
                      <td className="py-3">
                        <Badge variant={statusBadge[t.status]}>{t.status}</Badge>
                      </td>
                      <td className="py-3">
                        <Button size="sm" variant="ghost" onClick={() => alert("Receipt download coming soon")}>Receipt</Button>
                      </td>
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
