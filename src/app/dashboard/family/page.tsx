"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store";
import { useAudits } from "@/lib/hooks/useAudits";
import { useReports } from "@/lib/hooks/useReports";
import Link from "next/link";
import { ArrowRight, Calendar, FileText, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react";

function scoreColor(s: number) {
  if (s > 80) return "text-green-600";
  if (s >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBorder(s: number) {
  if (s > 80) return "border-green-400";
  if (s >= 50) return "border-amber-400";
  return "border-red-400";
}

export default function FamilyDashboard() {
  const { currentUser } = useStore();
  const { audits, loading: auditsLoading } = useAudits();
  const { reports, loading: reportsLoading } = useReports();

  const firstName = currentUser?.name?.split(" ")[0] ?? "there";
  const completedAudits = audits.filter((a) => a.status === "completed");
  const scheduledAudits = audits.filter((a) => a.status === "scheduled" || a.status === "in_progress");
  const latestScore = completedAudits[0]?.safety_score ?? reports[0]?.safety_score ?? null;
  const pendingFindings = reports.reduce((acc, r) => acc + (r.recommendations?.filter(rec => rec.priority === "high").length ?? 0), 0);

  const stats = [
    { label: "Active Audits", value: scheduledAudits.length.toString(), color: "text-blue-600", icon: Calendar },
    { label: "Pending Fixes", value: pendingFindings.toString(), color: "text-amber-600", icon: AlertTriangle },
    { label: "Completed Audits", value: completedAudits.length.toString(), color: "text-green-600", icon: CheckCircle },
    { label: "Reports Ready", value: reports.length.toString(), color: "text-purple-600", icon: FileText },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName} 👋</h1>
            <p className="text-gray-500">Here is your home safety overview.</p>
          </div>
          <Link href="/book">
            <Button className="gap-2">
              Book Audit <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Score + Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {/* Safety Score Ring */}
          <Card className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white to-blue-50">
            <p className="text-sm font-medium text-gray-500 mb-3">Safety Score</p>
            {latestScore !== null ? (
              <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${scoreBorder(latestScore)} bg-white shadow-inner`}>
                <span className={`text-3xl font-bold ${scoreColor(latestScore)}`}>{latestScore}</span>
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-gray-200 bg-white">
                <span className="text-sm text-gray-400">N/A</span>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-400">/100</p>
          </Card>

          {stats.map((s) => (
            <Card key={s.label} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-gray-100 p-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500">{s.label}</p>
              {auditsLoading || reportsLoading ? (
                <div className="mt-1 h-8 w-12 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link href="/book"><Button>Book New Audit</Button></Link>
          <Link href="/dashboard/family/audits"><Button variant="outline">View Audits</Button></Link>
          <Link href="/dashboard/family/contractors"><Button variant="outline">Find Contractors</Button></Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Audits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Audits</CardTitle>
              <Link href="/dashboard/family/audits" className="text-sm text-blue-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {auditsLoading ? (
                <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}</div>
              ) : scheduledAudits.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Shield className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">No upcoming audits</p>
                  <Link href="/book"><Button size="sm">Book your first audit</Button></Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {scheduledAudits.slice(0, 4).map((audit) => (
                    <li key={audit.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-800">{audit.property?.street ?? "Unknown address"}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {audit.scheduled_date ?? "Date TBD"} {audit.scheduled_time && `· ${audit.scheduled_time}`}
                        </p>
                      </div>
                      <Badge variant={audit.status === "in_progress" ? "warning" : "default"}>
                        {audit.status.replace("_", " ")}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reports</CardTitle>
              <Link href="/dashboard/family/audits" className="text-sm text-blue-600 hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}</div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">No reports yet</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {reports.slice(0, 4).map((r) => (
                    <li key={r.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-medium text-gray-800">{r.audit?.property?.street ?? "Report"}</p>
                        <p className="text-sm text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      <Link href={`/dashboard/family/reports/${r.id}`}>
                        <Badge className={`cursor-pointer ${r.safety_score > 80 ? "bg-green-100 text-green-700" : r.safety_score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          Score: {r.safety_score}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
