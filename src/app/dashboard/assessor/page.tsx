"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Today's Audits", value: "3", color: "text-blue-600" },
  { label: "Pending Reports", value: "2", color: "text-amber-600" },
  { label: "Completed This Month", value: "15", color: "text-green-600" },
  { label: "Earnings This Month", value: "$4,500", color: "text-purple-600" },
];

const todaysAudits = [
  { time: "9:00 AM", address: "142 Oak Lane, Springfield", family: "Johnson Family", status: "upcoming" as const },
  { time: "11:30 AM", address: "88 Maple Drive, Shelbyville", family: "Martinez Family", status: "in-progress" as const },
  { time: "2:00 PM", address: "305 Elm Street, Springfield", family: "Williams Family", status: "completed" as const },
];

const recentCompletions = [
  { date: "Mar 18", family: "Chen Family", address: "22 Pine Road", score: 78 },
  { date: "Mar 17", family: "Patel Family", address: "410 Cedar Ave", score: 65 },
  { date: "Mar 16", family: "O'Brien Family", address: "7 Birch Court", score: 82 },
  { date: "Mar 15", family: "Garcia Family", address: "199 Walnut Blvd", score: 71 },
];

const statusVariant = { "upcoming": "default", "in-progress": "warning", "completed": "success" } as const;

export default function AssessorDashboard() {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Sarah</h1>
          <p className="text-gray-500">Here is your assessor overview for today.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysAudits.map((a) => (
                  <div key={a.time} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center gap-4">
                      <span className="w-20 text-sm font-medium text-gray-600">{a.time}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{a.family}</p>
                        <p className="text-xs text-gray-500">{a.address}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant[a.status]}>{a.status.replace("-", " ")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Start Audit", href: "/dashboard/assessor/audit-tool" },
                { label: "Write Report", href: "/dashboard/assessor/report-builder" },
                { label: "View Earnings", href: "/dashboard/assessor/earnings" },
              ].map((action) => (
                <a key={action.label} href={action.href}>
                  <Button
                    variant={activeAction === action.label ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setActiveAction(action.label)}
                  >
                    {action.label}
                  </Button>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Family</th>
                    <th className="pb-2 font-medium">Address</th>
                    <th className="pb-2 font-medium">Safety Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompletions.map((c) => (
                    <tr key={c.date + c.family} className="border-b border-gray-50">
                      <td className="py-2 text-gray-600">{c.date}</td>
                      <td className="py-2 font-medium text-gray-900">{c.family}</td>
                      <td className="py-2 text-gray-600">{c.address}</td>
                      <td className="py-2">
                        <Badge variant={c.score >= 75 ? "success" : "warning"}>{c.score}/100</Badge>
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
