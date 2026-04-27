"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAudits } from "@/lib/hooks/useAudits";
import { useReports } from "@/lib/hooks/useReports";
import { profileService } from "@/lib/services/profile.service";

function typeColor(role: string) {
  switch (role) {
    case "family": return "bg-blue-400";
    case "assessor": return "bg-green-400";
    case "contractor": return "bg-amber-400";
    case "admin": return "bg-purple-400";
    default: return "bg-gray-400";
  }
}

export default function AdminDashboardPage() {
  const { audits, loading: auditsLoading } = useAudits();
  const { reports, loading: reportsLoading } = useReports();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [recentUsers, setRecentUsers] = useState<Array<{ id: string; name: string | null; role: string; created_at: string }>>([]);

  useEffect(() => {
    profileService.listAll().then(({ data }) => {
      setUserCount(data?.length ?? 0);
      setRecentUsers((data ?? []).slice(0, 8));
    });
  }, []);

  const activeAudits = audits.filter((a) => a.status === "in_progress" || a.status === "scheduled");
  const completedAudits = audits.filter((a) => a.status === "completed");
  const loading = auditsLoading || reportsLoading;

  const stats = [
    { label: "Total Users", value: userCount ?? "—", icon: "👥" },
    { label: "Active Audits", value: loading ? "—" : activeAudits.length, icon: "📋" },
    { label: "Total Reports", value: loading ? "—" : reports.length, icon: "📄" },
    { label: "Completed Audits", value: loading ? "—" : completedAudits.length, icon: "✅" },
  ];

  const quickLinks = [
    { label: "Manage Users", href: "/dashboard/admin/users" },
    { label: "Review Audits", href: "/dashboard/admin/audits" },
    { label: "View Reports", href: "/dashboard/admin/reports" },
    { label: "Payments", href: "/dashboard/admin/payments" },
  ];

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
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Users */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Recent Signups</CardTitle></CardHeader>
            <CardContent>
              {recentUsers.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">Loading users...</p>
              ) : (
                <ul className="space-y-3">
                  {recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 text-sm">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${typeColor(u.role)}`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{u.name ?? "Unnamed User"}</p>
                        <p className="text-xs text-gray-400 capitalize">{u.role} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {quickLinks.map((l) => (
                  <Link key={l.label} href={l.href}>
                    <Button variant="outline" className="w-full justify-start">{l.label}</Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
