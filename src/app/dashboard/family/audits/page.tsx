"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAudits } from "@/lib/hooks/useAudits";
import Link from "next/link";
import { Calendar, MapPin, Clock, Package, FileText } from "lucide-react";
import type { Audit, AuditStatus } from "@/lib/types";

const statusConfig: Record<AuditStatus, { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  scheduled: { label: "Scheduled", variant: "default" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function AuditCard({ audit }: { audit: Audit }) {
  const s = statusConfig[audit.status];
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-400" />
            <p className="font-semibold text-gray-900">{audit.property?.street ?? "Property"}, {audit.property?.city}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{audit.scheduled_date ?? "Date TBD"}</span>
            {audit.scheduled_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{audit.scheduled_time}</span>}
            <span className="flex items-center gap-1"><Package className="h-3 w-3" />{audit.package}</span>
          </div>
          {audit.safety_score !== null && (
            <p className={`text-sm font-semibold ${audit.safety_score > 80 ? "text-green-600" : audit.safety_score >= 50 ? "text-amber-500" : "text-red-500"}`}>
              Safety Score: {audit.safety_score}/100
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={s.variant}>{s.label}</Badge>
          {audit.status === "completed" && (
            <Link href={`/dashboard/family/reports/${audit.id}`}>
              <Button size="sm" variant="outline" className="gap-1">
                <FileText className="h-3.5 w-3.5" /> Report
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuditsPage() {
  const { audits, loading } = useAudits();
  const [tab, setTab] = useState("all");

  const filtered = tab === "all" ? audits : audits.filter((a) => a.status === tab || a.status === tab.replace("-", "_"));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Audits</h1>
            <p className="text-gray-500">Track all your home safety assessments.</p>
          </div>
          <Link href="/book"><Button>Book New Audit</Button></Link>
        </div>

        <Tabs defaultValue="all" onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All ({audits.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-3">{[0,1,2].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No audits in this category.</div>
            ) : (
              <div className="space-y-3">{filtered.map((a) => <AuditCard key={a.id} audit={a} />)}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
