"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAudits } from "@/lib/hooks/useAudits";
import { auditService } from "@/lib/services/audit.service";
import { useStore } from "@/lib/store";
import type { Audit, AuditStatus } from "@/lib/types";

const statusVariant: Record<AuditStatus, "default" | "warning" | "success" | "destructive"> = {
  scheduled: "default",
  in_progress: "warning",
  completed: "success",
  cancelled: "destructive",
};

export default function AdminAuditsPage() {
  const { addNotification } = useStore();
  const { audits, loading, refresh } = useAudits();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const pending = audits.filter((a) => a.status === "in_progress");
  const scheduled = audits.filter((a) => a.status === "scheduled");
  const completed = audits.filter((a) => a.status === "completed");
  const cancelled = audits.filter((a) => a.status === "cancelled");

  const updateStatus = async (id: string, status: AuditStatus) => {
    setUpdating(id);
    const { error } = await auditService.updateStatus(id, status);
    if (!error) {
      addNotification({ title: "Audit Updated", message: `Audit marked as ${status}.`, type: status === "completed" ? "success" : "warning" });
      await refresh();
    }
    setUpdating(null);
  };

  function renderTable(list: Audit[]) {
    if (list.length === 0) {
      return <p className="py-8 text-center text-sm text-gray-400">No audits found.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 font-medium">Family</th>
              <th className="pb-2 font-medium">Address</th>
              <th className="pb-2 font-medium">Package</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <>
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-3 font-medium text-gray-900">{a.family_profile?.name ?? "—"}</td>
                  <td className="py-3 text-gray-500">{a.property?.street ?? "—"}</td>
                  <td className="py-3 text-gray-500">{a.package}</td>
                  <td className="py-3 text-gray-500">{a.scheduled_date ?? "TBD"}</td>
                  <td className="py-3"><Badge variant={statusVariant[a.status]}>{a.status.replace("_", " ")}</Badge></td>
                  <td className="py-3">
                    {a.safety_score ? (
                      <Badge variant={a.safety_score >= 75 ? "success" : "warning"}>{a.safety_score}</Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        Details
                      </Button>
                      {a.status !== "completed" && (
                        <Button size="sm" variant="outline" disabled={updating === a.id} onClick={() => updateStatus(a.id, "completed")}>
                          Complete
                        </Button>
                      )}
                      {a.status !== "cancelled" && (
                        <Button size="sm" variant="destructive" disabled={updating === a.id} onClick={() => updateStatus(a.id, "cancelled")}>
                          Cancel
                        </Button>
                      )}
                    </div>
                    {expanded === a.id && (
                      <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
                        <p><strong>Audit ID:</strong> {a.id}</p>
                        <p><strong>Property:</strong> {a.property?.street}, {a.property?.city}, {a.property?.state}</p>
                        <p><strong>Time:</strong> {a.scheduled_time ?? "TBD"}</p>
                        {a.notes && <p><strong>Notes:</strong> {a.notes}</p>}
                      </div>
                    )}
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Management</h1>
        <Card>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[0,1,2,3].map((i) => <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />)}
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All ({audits.length})</TabsTrigger>
                  <TabsTrigger value="active">In Progress ({pending.length})</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                  <TabsContent value="all">{renderTable(audits)}</TabsContent>
                  <TabsContent value="active">{renderTable(pending)}</TabsContent>
                  <TabsContent value="scheduled">{renderTable(scheduled)}</TabsContent>
                  <TabsContent value="completed">{renderTable(completed)}</TabsContent>
                  <TabsContent value="cancelled">{renderTable(cancelled)}</TabsContent>
                </div>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
