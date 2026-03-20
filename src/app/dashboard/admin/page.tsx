"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Total Users", value: "1,247", growth: "+12%", icon: "👥" },
  { label: "Active Audits", value: "23", growth: "+8%", icon: "📋" },
  { label: "Revenue This Month", value: "$45,600", growth: "+15%", icon: "💰" },
  { label: "Contractor Network", value: "52", growth: "+5%", icon: "🔧" },
];

const initialActivity = [
  { id: 1, text: "New user Sarah Chen signed up as Family", time: "2 min ago", type: "signup" },
  { id: 2, text: "Audit #A-1042 completed by Mike Torres", time: "15 min ago", type: "audit" },
  { id: 3, text: "Payment of $1,200 received from Johnson family", time: "32 min ago", type: "payment" },
  { id: 4, text: "Contractor BuildRight Inc. joined the network", time: "1 hr ago", type: "signup" },
  { id: 5, text: "Audit #A-1039 flagged for review", time: "1.5 hrs ago", type: "flag" },
  { id: 6, text: "New user David Park signed up as Assessor", time: "2 hrs ago", type: "signup" },
  { id: 7, text: "Payment of $850 processed for assessor Jane Liu", time: "3 hrs ago", type: "payment" },
  { id: 8, text: "Audit #A-1037 approved by admin", time: "3.5 hrs ago", type: "audit" },
  { id: 9, text: "User complaint resolved for ticket #T-221", time: "4 hrs ago", type: "flag" },
  { id: 10, text: "New user Amy Walsh signed up as Family", time: "5 hrs ago", type: "signup" },
];

const quickLinks = [
  { label: "Manage Users", href: "/dashboard/admin/users" },
  { label: "Review Audits", href: "/dashboard/admin/audits" },
  { label: "View Reports", href: "/dashboard/admin/reports" },
  { label: "Payments", href: "/dashboard/admin/payments" },
];

function typeColor(type: string) {
  switch (type) {
    case "signup": return "bg-blue-400";
    case "audit": return "bg-green-400";
    case "payment": return "bg-amber-400";
    case "flag": return "bg-red-400";
    default: return "bg-gray-400";
  }
}

export default function AdminDashboardPage() {
  const [activity] = useState(initialActivity);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <span className="text-xl">{s.icon}</span>
                </div>
                <p className="mt-1 text-2xl font-bold">{s.value}</p>
                <Badge variant="success" className="mt-2">{s.growth}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${typeColor(a.type)}`} />
                    <div className="flex-1">
                      <p className="text-gray-800">{a.text}</p>
                      <p className="text-xs text-gray-400">{a.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {quickLinks.map((l) => (
                  <a key={l.label} href={l.href}>
                    <Button variant="outline" className="w-full justify-start">{l.label}</Button>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
