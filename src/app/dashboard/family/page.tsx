"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const safetyScore = 72;

const stats = [
  { label: "Active Audits", value: "2", color: "text-blue-600" },
  { label: "Pending Fixes", value: "5", color: "text-amber-600" },
  { label: "Completed Fixes", value: "12", color: "text-green-600" },
  { label: "Next Check-in", value: "Apr 15", color: "text-purple-600" },
];

const recentActivity = [
  { text: "Bathroom grab bar installation completed", time: "2 hours ago", type: "success" as const },
  { text: "New hazard identified in kitchen — loose tile", time: "Yesterday", type: "warning" as const },
  { text: "Audit report for 42 Oak Lane is ready", time: "2 days ago", type: "info" as const },
  { text: "Contractor quote received from SafeStep Pros", time: "3 days ago", type: "info" as const },
  { text: "Hallway lighting upgrade scheduled", time: "5 days ago", type: "success" as const },
];

const upcoming = [
  { title: "Home audit — 42 Oak Lane", date: "Apr 5, 2026", badge: "Scheduled" },
  { title: "Grab bar installation follow-up", date: "Apr 10, 2026", badge: "Pending" },
  { title: "Quarterly safety check-in", date: "Apr 15, 2026", badge: "Recurring" },
];

function scoreColor(s: number) {
  if (s > 80) return "text-green-600 border-green-400";
  if (s >= 50) return "text-amber-500 border-amber-400";
  return "text-red-600 border-red-400";
}

const badgeVariantMap: Record<string, "success" | "warning" | "default"> = {
  success: "success",
  warning: "warning",
  info: "default",
};

export default function FamilyDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, Sarah</h1>
          <p className="text-gray-500">Here is your home safety overview.</p>
        </div>

        {/* Score + Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="md:col-span-1 flex flex-col items-center justify-center p-6">
            <p className="text-sm font-medium text-gray-500 mb-2">Safety Score</p>
            <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${scoreColor(safetyScore)}`}>
              <span className="text-3xl font-bold">{safetyScore}</span>
            </div>
          </Card>
          {stats.map((s) => (
            <Card key={s.label} className="p-6">
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/book"><Button>Book New Audit</Button></Link>
          <Link href="/dashboard/family/audits"><Button variant="outline">View Reports</Button></Link>
          <Link href="/dashboard/family/contractors"><Button variant="outline">Find Contractors</Button></Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recentActivity.map((a, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={badgeVariantMap[a.type]}>{a.type}</Badge>
                      <span className="text-gray-700">{a.text}</span>
                    </div>
                    <span className="shrink-0 text-gray-400">{a.time}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader><CardTitle>Upcoming</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {upcoming.map((u, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                    <div>
                      <p className="font-medium text-gray-800">{u.title}</p>
                      <p className="text-sm text-gray-500">{u.date}</p>
                    </div>
                    <Badge variant="secondary">{u.badge}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
