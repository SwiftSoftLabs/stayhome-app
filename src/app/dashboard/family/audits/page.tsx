"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";

interface Audit {
  id: string;
  date: string;
  address: string;
  assessor: string;
  status: "scheduled" | "in-progress" | "completed";
  hazards: number;
}

const audits: Audit[] = [
  { id: "rpt-1", date: "Apr 5, 2026", address: "42 Oak Lane, Austin TX", assessor: "James Carter", status: "scheduled", hazards: 0 },
  { id: "rpt-2", date: "Mar 12, 2026", address: "42 Oak Lane, Austin TX", assessor: "Maria Gonzalez", status: "in-progress", hazards: 3 },
  { id: "rpt-3", date: "Feb 18, 2026", address: "42 Oak Lane, Austin TX", assessor: "James Carter", status: "completed", hazards: 7 },
  { id: "rpt-4", date: "Jan 8, 2026", address: "15 Maple Dr, Austin TX", assessor: "Linda Pham", status: "completed", hazards: 4 },
  { id: "rpt-5", date: "Nov 22, 2025", address: "42 Oak Lane, Austin TX", assessor: "Maria Gonzalez", status: "completed", hazards: 9 },
];

const statusBadge: Record<string, { label: string; variant: "default" | "warning" | "success" }> = {
  scheduled: { label: "Scheduled", variant: "default" },
  "in-progress": { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
};

function AuditCard({ audit }: { audit: Audit }) {
  const s = statusBadge[audit.status];
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{audit.address}</p>
          <p className="text-sm text-gray-500">{audit.date} &middot; Assessor: {audit.assessor}</p>
          {audit.hazards > 0 && (
            <p className="text-sm text-red-600">{audit.hazards} hazard{audit.hazards > 1 ? "s" : ""} found</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={s.variant}>{s.label}</Badge>
          {audit.status === "completed" && (
            <Link href={`/dashboard/family/reports/${audit.id}`}>
              <Button size="sm" variant="outline">View Report</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function filterAudits(tab: string) {
  if (tab === "all") return audits;
  return audits.filter((a) => a.status === tab);
}

export default function AuditsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">My Audits</h1>
          <Link href="/book"><Button>Book New Audit</Button></Link>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          {["all", "scheduled", "in-progress", "completed"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="space-y-3">
                {filterAudits(tab).length === 0 ? (
                  <p className="py-8 text-center text-gray-400">No audits in this category.</p>
                ) : (
                  filterAudits(tab).map((a) => <AuditCard key={a.id} audit={a} />)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
