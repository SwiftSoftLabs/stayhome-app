"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAudits } from "@/lib/hooks/useAudits";
import { auditService } from "@/lib/services/audit.service";
import type { Audit } from "@/lib/types";
import { MapPin, Clock, User } from "lucide-react";

const statusVariant = {
  scheduled: "default" as const,
  in_progress: "warning" as const,
  completed: "success" as const,
  cancelled: "destructive" as const,
};

function AuditItem({ audit, onStartAudit }: { audit: Audit; onStartAudit: (id: string) => void }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="w-20 shrink-0 pt-0.5 text-sm font-semibold text-blue-600">{audit.scheduled_time ?? "TBD"}</span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
              <User className="h-3.5 w-3.5 text-gray-400" />
              {audit.family_profile?.name ?? "Family"}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {audit.property?.street ?? "Address TBD"}
            </div>
            <p className="text-xs text-gray-400">{audit.package} Package</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[audit.status]}>{audit.status.replace("_", " ")}</Badge>
          {audit.status === "scheduled" && (
            <Button size="sm" onClick={() => onStartAudit(audit.id)}>Start</Button>
          )}
          {audit.status === "in_progress" && (
            <Button size="sm" variant="outline" onClick={() => window.location.href = `/dashboard/assessor/audit-tool?audit=${audit.id}`}>
              Continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SchedulePage() {
  const { audits, loading, refresh } = useAudits();
  const [starting, setStarting] = useState<string | null>(null);

  const today = audits.filter(a => a.status === "scheduled" || a.status === "in_progress");
  const upcoming = audits.filter(a => a.status === "scheduled");
  const past = audits.filter(a => a.status === "completed" || a.status === "cancelled");

  const handleStartAudit = async (id: string) => {
    setStarting(id);
    await auditService.updateStatus(id, "in_progress");
    await refresh();
    setStarting(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500">Your upcoming and past home safety audits.</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Today", value: today.length, color: "text-blue-600" },
            { label: "Upcoming", value: upcoming.length, color: "text-amber-600" },
            { label: "Completed", value: past.filter(a => a.status === "completed").length, color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label} className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="today">
          <TabsList>
            <TabsTrigger value="today">Today ({today.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3 mt-4">
            {loading ? (
              <div className="space-y-3">{[0,1].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
            ) : today.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-gray-400">
                <Clock className="mx-auto h-8 w-8 text-gray-200 mb-2" />
                No audits scheduled for today.
              </CardContent></Card>
            ) : (
              today.map(a => <AuditItem key={a.id} audit={a} onStartAudit={handleStartAudit} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3 mt-4">
            {loading ? (
              <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
            ) : upcoming.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-gray-400">No upcoming audits.</CardContent></Card>
            ) : (
              upcoming.map(a => <AuditItem key={a.id} audit={a} onStartAudit={handleStartAudit} />)
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {loading ? (
              <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div>
            ) : past.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-gray-400">No past audits yet.</CardContent></Card>
            ) : (
              <Card>
                <CardHeader><CardTitle>Audit History</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {past.map(a => (
                    <div key={a.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{a.family_profile?.name ?? "Family"}</p>
                        <p className="text-xs text-gray-500">{a.property?.street} · {a.scheduled_date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {a.safety_score && <Badge variant="success">{a.safety_score}/100</Badge>}
                        <Badge variant={statusVariant[a.status]}>{a.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
