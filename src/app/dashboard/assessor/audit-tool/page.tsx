"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { auditService } from "@/lib/services/audit.service";
import { useStore } from "@/lib/store";
import type { Audit, AuditFinding } from "@/lib/types";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

const ROOMS = ["Bathroom", "Kitchen", "Hallway", "Bedroom", "Stairs", "Living Room", "Exterior"];
const SEVERITIES = ["low", "medium", "high", "critical"] as const;
const severityVariant = {
  critical: "destructive",
  high: "destructive",
  medium: "warning",
  low: "secondary",
} as const;

function AuditToolInner() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("audit") ?? "";
  const { addNotification } = useStore();

  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    finding: "",
    severity: "medium" as AuditFinding["severity"],
  });
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, Record<string, boolean>>>(() => {
    const d: Record<string, Record<string, boolean>> = {};
    ROOMS.forEach((r) => {
      d[r] = {
        "Photos taken": false,
        "Measurements recorded": false,
        "Hazards documented": false,
        "Occupant interviewed": false,
      };
    });
    return d;
  });

  useEffect(() => {
    if (!auditId) { setLoading(false); return; }
    Promise.all([
      auditService.getById(auditId),
      auditService.getFindingsByAudit(auditId),
    ]).then(([{ data: a }, { data: f }]) => {
      setAudit(a);
      setFindings(f ?? []);
      setLoading(false);
    });
  }, [auditId]);

  const addFinding = async () => {
    if (!draft.finding || !auditId) return;
    setSaving(true);
    const { data } = await auditService.addFinding({
      audit_id: auditId,
      room: activeRoom,
      finding: draft.finding,
      severity: draft.severity,
      resolved: false,
    });
    if (data) {
      setFindings((prev) => [...prev, data]);
      setDraft((p) => ({ ...p, finding: "" }));
      addNotification({ title: "Finding Added", message: `${draft.severity} finding logged for ${activeRoom}.`, type: "success" });
    }
    setSaving(false);
  };

  const resolveFinding = async (id: string) => {
    const { data } = await auditService.resolveFinding(id);
    if (data) setFindings((prev) => prev.map((f) => f.id === id ? data : f));
  };

  const toggleCheck = (room: string, item: string) => {
    setChecklist((prev) => ({
      ...prev,
      [room]: { ...prev[room], [item]: !prev[room][item] },
    }));
  };

  const roomFindings = (room: string) => findings.filter((f) => f.room === room);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!auditId) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-gray-700">No audit selected.</p>
          <Link href="/dashboard/assessor/schedule">
            <Button className="mt-4" variant="outline">Go to Schedule</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Tool</h1>
          {audit && (
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span><strong>Family:</strong> {audit.family_profile?.name ?? "—"}</span>
              <span><strong>Address:</strong> {audit.property?.street ?? "—"}</span>
              <span><strong>Date:</strong> {audit.scheduled_date ?? "—"}</span>
              <span><strong>Package:</strong> {audit.package}</span>
            </div>
          )}
        </div>

        <Tabs value={activeRoom} onValueChange={setActiveRoom}>
          <TabsList className="flex-wrap">
            {ROOMS.map((r) => {
              const rf = roomFindings(r);
              return (
                <TabsTrigger key={r} value={r} className="gap-1">
                  {r}
                  {rf.length > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs justify-center">
                      {rf.length}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ROOMS.map((room) => (
            <TabsContent key={room} value={room}>
              <div className="space-y-4 mt-4">
                {/* Add Finding */}
                <Card>
                  <CardHeader><CardTitle>Add Finding — {room}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Input
                        placeholder="Describe the hazard..."
                        value={draft.finding}
                        onChange={(e) => setDraft((p) => ({ ...p, finding: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addFinding()}
                        className="sm:col-span-2"
                      />
                      <Select
                        value={draft.severity}
                        onChange={(e) => setDraft((p) => ({ ...p, severity: e.target.value as AuditFinding["severity"] }))}
                      >
                        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      onClick={addFinding}
                      disabled={saving || !draft.finding}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      {saving ? "Adding..." : "Add Finding"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Findings List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Findings ({roomFindings(room).length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {roomFindings(room).length === 0 ? (
                      <p className="py-4 text-center text-sm text-gray-400">No findings for this room.</p>
                    ) : (
                      roomFindings(room).map((f) => (
                        <div key={f.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center gap-3">
                            <Badge variant={severityVariant[f.severity]}>{f.severity}</Badge>
                            <span className={`text-sm ${f.resolved ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {f.finding}
                            </span>
                            {f.resolved && <Badge variant="success">Resolved</Badge>}
                          </div>
                          {!f.resolved && (
                            <button
                              onClick={() => resolveFinding(f.id)}
                              className="text-gray-400 hover:text-green-500 transition-colors"
                              title="Mark resolved"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Checklist */}
                <Card>
                  <CardHeader><CardTitle>Room Checklist</CardTitle></CardHeader>
                  <CardContent className="space-y-1">
                    {Object.entries(checklist[room]).map(([item, checked]) => (
                      <label key={item} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheck(room, item)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex gap-4 text-sm">
            <span className="font-medium text-gray-700">Total findings: <strong>{findings.length}</strong></span>
            <span className="text-red-600 font-medium">
              Critical/High: <strong>{findings.filter((f) => f.severity === "critical" || f.severity === "high").length}</strong>
            </span>
          </div>
          <Link href={`/dashboard/assessor/report-builder?audit=${auditId}`}>
            <Button>Go to Report Builder</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AuditToolPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      </DashboardLayout>
    }>
      <AuditToolInner />
    </Suspense>
  );
}
