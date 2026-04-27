"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { reportService } from "@/lib/services/report.service";
import { auditService } from "@/lib/services/audit.service";
import Link from "next/link";
import type { Report, AuditFinding } from "@/lib/types";
import { MapPin, User, Calendar, ChevronDown, ChevronRight } from "lucide-react";

function riskBadge(severity: AuditFinding["severity"]) {
  const map = { critical: "destructive", high: "destructive", medium: "warning", low: "secondary" } as const;
  return map[severity];
}

function scoreColor(s: number) {
  if (s > 80) return { ring: "border-green-400", text: "text-green-600" };
  if (s >= 50) return { ring: "border-amber-400", text: "text-amber-500" };
  return { ring: "border-red-400", text: "text-red-500" };
}

export default function ReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    // Try to load report by report ID, or by audit ID
    Promise.all([
      reportService.getById(id).catch(() => ({ data: null, error: null })),
      reportService.getByAuditId(id).catch(() => ({ data: null, error: null })),
    ]).then(async ([byId, byAudit]) => {
      const r = byId.data ?? byAudit.data;
      setReport(r);
      if (r?.audit_id) {
        const { data: f } = await auditService.getFindingsByAudit(r.audit_id);
        setFindings(f ?? []);
        // Auto-expand first room
        const rooms = [...new Set((f ?? []).map(fi => fi.room))];
        if (rooms[0]) setExpandedRooms({ [rooms[0]]: true });
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)}</div>
      </DashboardLayout>
    );
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-gray-700">Report not found</p>
          <Link href="/dashboard/family/audits"><Button className="mt-4" variant="outline">Back to Audits</Button></Link>
        </div>
      </DashboardLayout>
    );
  }

  const colors = scoreColor(report.safety_score);
  const rooms = [...new Set(findings.map(f => f.room))];
  const totalEstCost = report.recommendations?.reduce((sum, r) => {
    const m = r.estimated_cost?.replace(/[^0-9]/g, "");
    return sum + (m ? parseInt(m) : 0);
  }, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Assessment Report</h1>
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              {report.audit?.property && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {report.audit.property.street}, {report.audit.property.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(report.created_at).toLocaleDateString()}
              </span>
              {report.audit?.assessor_profile && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {report.audit.assessor_profile.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${colors.ring} bg-white shadow-inner`}>
              <div className="text-center">
                <p className={`text-2xl font-bold ${colors.text}`}>{report.safety_score}</p>
                <p className="text-xs text-gray-400">/100</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => alert("PDF export coming soon")}>Download PDF</Button>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">{report.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Room-by-room findings */}
        {findings.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Room-by-Room Findings</h2>
            {rooms.map((room) => {
              const roomFindings = findings.filter(f => f.room === room);
              const isOpen = expandedRooms[room];
              return (
                <Card key={room}>
                  <button
                    className="flex w-full items-center justify-between p-5 text-left"
                    onClick={() => setExpandedRooms(prev => ({ ...prev, [room]: !prev[room] }))}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{room}</span>
                      <Badge variant="secondary">{roomFindings.length} finding{roomFindings.length > 1 ? "s" : ""}</Badge>
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <CardContent className="space-y-3 border-t pt-4">
                      {roomFindings.map((f) => (
                        <div key={f.id} className="flex items-start justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{f.finding}</span>
                              <Badge variant={riskBadge(f.severity)}>{f.severity}</Badge>
                              {f.resolved && <Badge variant="success">Resolved</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Priority Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {report.recommendations.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant={r.priority === "high" ? "destructive" : r.priority === "medium" ? "warning" : "secondary"}>
                      {r.priority}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900">{r.title}</p>
                      <p className="text-sm text-gray-500">{r.description}</p>
                    </div>
                  </div>
                  {r.estimated_cost && (
                    <span className="shrink-0 text-sm font-semibold text-gray-700">{r.estimated_cost}</span>
                  )}
                </div>
              ))}
              {totalEstCost > 0 && (
                <div className="flex justify-between border-t pt-3 font-bold text-gray-900">
                  <span>Total Estimated</span>
                  <span>${totalEstCost.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/family/contractors">
            <Button>Find Contractors</Button>
          </Link>
          <Button variant="outline" onClick={() => alert("PDF export coming soon")}>Download PDF</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
