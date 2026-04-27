"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAudits } from "@/lib/hooks/useAudits";
import { auditService } from "@/lib/services/audit.service";
import { reportService } from "@/lib/services/report.service";
import { leadService } from "@/lib/services/lead.service";
import { useStore } from "@/lib/store";
import type { AuditFinding, Recommendation } from "@/lib/types";
import { Plus, Trash2, CheckCircle } from "lucide-react";

const ROOMS = ["Bathroom", "Kitchen", "Bedroom", "Hallway", "Stairs", "Living Room", "Garage", "Exterior"];
const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export default function ReportBuilderPage() {
  const { currentUser, addNotification } = useStore();
  const { audits, loading: auditsLoading } = useAudits();
  const [selectedAuditId, setSelectedAuditId] = useState("");
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [newFinding, setNewFinding] = useState({ room: "Bathroom", finding: "", severity: "medium" as AuditFinding["severity"] });
  const [safetyScore, setSafetyScore] = useState(75);
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [newRec, setNewRec] = useState({ title: "", description: "", priority: "medium" as Recommendation["priority"], estimated_cost: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing findings when audit changes
  useEffect(() => {
    if (!selectedAuditId) return;
    auditService.getFindingsByAudit(selectedAuditId).then(({ data }) => {
      setFindings(data ?? []);
    });
    setSaved(false);
  }, [selectedAuditId]);

  const inProgressAudits = audits.filter(a => a.status === "in_progress" || a.status === "scheduled");

  const addFinding = async () => {
    if (!newFinding.finding || !selectedAuditId) return;
    const { data } = await auditService.addFinding({
      audit_id: selectedAuditId,
      room: newFinding.room,
      finding: newFinding.finding,
      severity: newFinding.severity,
      resolved: false,
    });
    if (data) {
      setFindings(prev => [...prev, data]);
      setNewFinding(prev => ({ ...prev, finding: "" }));
    }
  };

  const removeFindingLocal = (id: string) => {
    setFindings(prev => prev.filter(f => f.id !== id));
  };

  const addRecommendation = () => {
    if (!newRec.title) return;
    setRecommendations(prev => [...prev, { ...newRec }]);
    setNewRec({ title: "", description: "", priority: "medium", estimated_cost: "" });
  };

  const handleFinalize = async () => {
    if (!selectedAuditId || !currentUser) return;
    const audit = audits.find(a => a.id === selectedAuditId);
    if (!audit) return;
    setSaving(true);
    // Create report
    const { error } = await reportService.create({
      audit_id: selectedAuditId,
      family_id: audit.family_id,
      safety_score: safetyScore,
      summary,
      recommendations,
    });
    if (!error) {
      // Update audit status to completed + score
      await auditService.updateStatus(selectedAuditId, "completed", { safety_score: safetyScore });
      // Create leads for high/critical findings
      const urgentFindings = findings.filter(f => f.severity === "high" || f.severity === "critical");
      for (const f of urgentFindings.slice(0, 3)) {
        await leadService.createLead({
          audit_id: selectedAuditId,
          family_id: audit.family_id,
          hazard: f.finding,
          urgency: f.severity === "critical" ? "high" : "medium",
        });
      }
      addNotification({ title: "Report Submitted", message: "Report finalized and sent to the family.", type: "success" });
      setSaved(true);
    }
    setSaving(false);
  };

  if (saved) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Report Submitted!</h2>
          <p className="text-gray-500">The report has been sent to the family and contractor leads have been created.</p>
          <Button onClick={() => { setSaved(false); setSelectedAuditId(""); setFindings([]); setRecommendations([]); setSummary(""); }}>
            Create Another Report
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
          <p className="text-gray-500">Document findings and generate safety reports for families.</p>
        </div>

        {/* Select Audit */}
        <Card>
          <CardContent className="p-6">
            {auditsLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ) : (
              <Select
                label="Select Audit"
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
              >
                <option value="">— Choose an audit —</option>
                {inProgressAudits.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.family_profile?.name ?? "Family"} · {a.property?.street} · {a.scheduled_date ?? "TBD"}
                  </option>
                ))}
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedAuditId && (
          <>
            {/* Safety Score */}
            <Card>
              <CardHeader><CardTitle>Safety Score</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    type="range" min={0} max={100} value={safetyScore}
                    onChange={e => setSafetyScore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className={`text-3xl font-bold w-16 text-right ${safetyScore > 80 ? "text-green-600" : safetyScore >= 50 ? "text-amber-500" : "text-red-500"}`}>
                    {safetyScore}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Add Findings */}
            <Card>
              <CardHeader><CardTitle>Findings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Select value={newFinding.room} onChange={e => setNewFinding(p => ({ ...p, room: e.target.value }))}>
                    {ROOMS.map(r => <option key={r}>{r}</option>)}
                  </Select>
                  <Input
                    placeholder="Describe the hazard..."
                    value={newFinding.finding}
                    onChange={e => setNewFinding(p => ({ ...p, finding: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addFinding()}
                  />
                  <Select value={newFinding.severity} onChange={e => setNewFinding(p => ({ ...p, severity: e.target.value as AuditFinding["severity"] }))}>
                    {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                  </Select>
                </div>
                <Button size="sm" onClick={addFinding} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Finding
                </Button>

                <div className="space-y-2 mt-2">
                  {findings.map(f => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={f.severity === "critical" || f.severity === "high" ? "destructive" : f.severity === "medium" ? "warning" : "secondary"}>
                          {f.severity}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{f.finding}</p>
                          <p className="text-xs text-gray-500">{f.room}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFindingLocal(f.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {findings.length === 0 && <p className="py-4 text-center text-sm text-gray-400">No findings added yet.</p>}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write a summary of the assessment findings..."
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="min-h-[120px]"
                />
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Title" value={newRec.title} onChange={e => setNewRec(p => ({ ...p, title: e.target.value }))} />
                  <Input placeholder="Est. cost (e.g. $350)" value={newRec.estimated_cost} onChange={e => setNewRec(p => ({ ...p, estimated_cost: e.target.value }))} />
                  <Input placeholder="Description" value={newRec.description} onChange={e => setNewRec(p => ({ ...p, description: e.target.value }))} className="col-span-2" />
                  <Select value={newRec.priority} onChange={e => setNewRec(p => ({ ...p, priority: e.target.value as Recommendation["priority"] }))}>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </Select>
                  <Button size="sm" onClick={addRecommendation} className="gap-1">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "warning" : "secondary"}>{r.priority}</Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.title}</p>
                          <p className="text-xs text-gray-500">{r.description}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{r.estimated_cost}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleFinalize} disabled={saving} className="w-full" size="lg">
              {saving ? "Submitting..." : "Finalize & Send to Family"}
            </Button>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
