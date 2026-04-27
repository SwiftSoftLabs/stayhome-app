"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReports } from "@/lib/hooks/useReports";

function scoreColor(s: number) {
  if (s >= 80) return "success";
  if (s >= 50) return "warning";
  return "destructive";
}

// Simple bar chart from real data
function MiniChart({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-3 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-600">{d.count || ""}</span>
          <div
            className="w-full rounded-t bg-blue-500 transition-all min-h-[4px]"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="text-xs text-gray-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminReportsPage() {
  const { reports, loading } = useReports();

  const avgScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + r.safety_score, 0) / reports.length)
    : 0;

  // Monthly breakdown (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: d.toLocaleString("en-US", { month: "short" }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      count: 0,
    };
  });
  reports.forEach((r) => {
    const key = r.created_at.slice(0, 7);
    const m = months.find((m) => m.key === key);
    if (m) m.count++;
  });

  const kpis = [
    { label: "Total Reports", value: loading ? "—" : reports.length },
    { label: "Avg Safety Score", value: loading ? "—" : `${avgScore}/100` },
    { label: "High Risk (<50)", value: loading ? "—" : reports.filter((r) => r.safety_score < 50).length },
    { label: "This Month", value: loading ? "—" : months[5].count },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500">{k.label}</p>
                <p className="mt-1 text-2xl font-bold">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Reports Per Month</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-32 animate-pulse rounded bg-gray-100" />
            ) : (
              <MiniChart data={months.map((m) => ({ label: m.label, count: m.count }))} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>All Reports</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0,1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : reports.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No reports yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Address</th>
                      <th className="pb-2 font-medium">Safety Score</th>
                      <th className="pb-2 font-medium">Recommendations</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-3 font-medium text-gray-900">
                          {r.audit?.property?.street ?? "—"}, {r.audit?.property?.city ?? ""}
                        </td>
                        <td className="py-3">
                          <Badge variant={scoreColor(r.safety_score)}>{r.safety_score}/100</Badge>
                        </td>
                        <td className="py-3 text-gray-500">{r.recommendations?.length ?? 0}</td>
                        <td className="py-3">
                          <Link href={`/dashboard/family/reports/${r.id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
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
