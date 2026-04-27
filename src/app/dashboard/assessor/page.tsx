"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAudits } from "@/lib/hooks/useAudits";
import { useReports } from "@/lib/hooks/useReports";
import { useStore } from "@/lib/store";
import { Calendar, ClipboardList, CheckCircle, TrendingUp } from "lucide-react";

const statusVariant = {
  scheduled: "default",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
} as const;

export default function AssessorDashboard() {
  const { currentUser } = useStore();
  const { audits, loading: auditsLoading } = useAudits();
  const { reports, loading: reportsLoading } = useReports();

  const today = audits.filter((a) => a.status === "scheduled" || a.status === "in_progress");
  const completed = audits.filter((a) => a.status === "completed");
  const recentCompletions = completed.slice(0, 5);

  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, a) => sum + (a.safety_score ?? 0), 0) / completed.length)
    : 0;

  const stats = [
    { label: "Today's Audits", value: today.length, color: "text-blue-600", icon: <Calendar className="h-5 w-5 text-blue-300" /> },
    { label: "Pending Reports", value: reports.filter((r) => !r.pdf_url).length, color: "text-amber-600", icon: <ClipboardList className="h-5 w-5 text-amber-300" /> },
    { label: "Completed", value: completed.length, color: "text-green-600", icon: <CheckCircle className="h-5 w-5 text-green-300" /> },
    { label: "Avg Score", value: avgScore ? `${avgScore}/100` : "—", color: "text-purple-600", icon: <TrendingUp className="h-5 w-5 text-purple-300" /> },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {currentUser?.name ?? "Assessor"}
          </h1>
          <p className="text-gray-500">Here is your assessor overview for today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                {s.icon}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Today's schedule */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Today&apos;s Schedule</CardTitle></CardHeader>
            <CardContent>
              {auditsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}
                </div>
              ) : today.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">No audits scheduled for today.</p>
              ) : (
                <div className="space-y-3">
                  {today.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-4">
                        <span className="w-20 shrink-0 text-sm font-medium text-blue-600">
                          {a.scheduled_time ?? "TBD"}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {a.family_profile?.name ?? "Family"}
                          </p>
                          <p className="text-xs text-gray-500">{a.property?.street ?? "Address TBD"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant[a.status]}>{a.status.replace("_", " ")}</Badge>
                        {a.status === "in_progress" && (
                          <Link href={`/dashboard/assessor/audit-tool?audit=${a.id}`}>
                            <Button size="sm" variant="outline">Continue</Button>
                          </Link>
                        )}
                        {a.status === "scheduled" && (
                          <Link href={`/dashboard/assessor/schedule`}>
                            <Button size="sm">Start</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "View Schedule", href: "/dashboard/assessor/schedule" },
                { label: "Write Report", href: "/dashboard/assessor/report-builder" },
                { label: "View Earnings", href: "/dashboard/assessor/earnings" },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className="w-full justify-start">{action.label}</Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent completions */}
        <Card>
          <CardHeader><CardTitle>Recent Completions</CardTitle></CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : recentCompletions.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No completed audits yet.</p>
            ) : (
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
                    {recentCompletions.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 text-gray-500">{a.scheduled_date ?? "—"}</td>
                        <td className="py-2.5 font-medium text-gray-900">{a.family_profile?.name ?? "—"}</td>
                        <td className="py-2.5 text-gray-500">{a.property?.street ?? "—"}</td>
                        <td className="py-2.5">
                          {a.safety_score ? (
                            <Badge variant={a.safety_score >= 75 ? "success" : "warning"}>{a.safety_score}/100</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
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
