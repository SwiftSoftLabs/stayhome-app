"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const mockAudits = [
  { id: "AUD-2026-042", label: "Johnson Family - 142 Oak Lane (Mar 20)" },
  { id: "AUD-2026-041", label: "Martinez Family - 88 Maple Drive (Mar 19)" },
  { id: "AUD-2026-039", label: "Chen Family - 22 Pine Road (Mar 18)" },
];

const reportSections = {
  summary: "This home safety assessment identified 5 hazards across 3 rooms requiring attention. The overall safety score is 72/100. Primary concerns center around inadequate grab bar installations in the bathroom, a tripping hazard in the hallway, and insufficient lighting on the stairway. Immediate action is recommended for 2 high-priority items to reduce fall risk for the elderly occupant.",
  bathroom: "Two hazards identified: (1) Missing grab bar near toilet - Risk 8/10, estimated cost $150. (2) Slippery tile surface near bathtub - Risk 7/10, estimated cost $200 for non-slip treatment.",
  kitchen: "One hazard identified: (1) Loose floor mat near sink creating tripping hazard - Risk 6/10, estimated cost $50 for secured replacement mat.",
  hallway: "One hazard identified: (1) Insufficient lighting in main corridor - Risk 5/10, estimated cost $120 for motion-activated LED installation.",
  stairs: "One hazard identified: (1) Worn carpet on top 3 steps - Risk 8/10, estimated cost $300 for carpet replacement and non-slip treads.",
};

const recommendations = [
  { priority: "High", item: "Install grab bar near toilet", room: "Bathroom", cost: "$150" },
  { priority: "High", item: "Replace worn stair carpet with non-slip treads", room: "Stairs", cost: "$300" },
  { priority: "Medium", item: "Apply non-slip treatment to bathtub area", room: "Bathroom", cost: "$200" },
  { priority: "Medium", item: "Install motion-activated hallway lights", room: "Hallway", cost: "$120" },
  { priority: "Low", item: "Replace loose kitchen floor mat", room: "Kitchen", cost: "$50" },
];

const costSummary = [
  { category: "Grab Bars & Supports", cost: "$150" },
  { category: "Flooring & Surfaces", cost: "$550" },
  { category: "Lighting", cost: "$120" },
  { category: "Total Estimated", cost: "$820" },
];

export default function ReportBuilderPage() {
  const [selectedAudit, setSelectedAudit] = useState(mockAudits[0].id);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [sections, setSections] = useState(reportSections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  const updateSection = (key: string, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const renderSection = (key: string, title: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <Button size="sm" variant="ghost" onClick={() => setEditingSection(editingSection === key ? null : key)}>
          {editingSection === key ? "Done" : "Edit"}
        </Button>
      </div>
      {editingSection === key ? (
        <Textarea value={sections[key as keyof typeof sections]} onChange={(e) => updateSection(key, e.target.value)} className="min-h-[100px]" />
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed">{sections[key as keyof typeof sections]}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {notification && (
          <div className="fixed right-4 top-4 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">{notification}</div>
        )}
        <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select label="Select Audit" value={selectedAudit} onChange={(e) => { setSelectedAudit(e.target.value); setGenerated(false); }}>
                {mockAudits.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </Select>
            </div>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Generating...
                </span>
              ) : "Generate Report with AI"}
            </Button>
          </CardContent>
        </Card>

        {generated && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">Home Safety Assessment Report</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">Audit {selectedAudit} | March 20, 2026 | 142 Oak Lane, Springfield</p>
                </div>
                <Badge variant="success">AI Generated</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderSection("summary", "Executive Summary")}
              <hr />
              <h2 className="text-base font-bold text-gray-900">Room-by-Room Findings</h2>
              {renderSection("bathroom", "Bathroom")}
              {renderSection("kitchen", "Kitchen")}
              {renderSection("hallway", "Hallway")}
              {renderSection("stairs", "Stairs")}
              <hr />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority Recommendations</h3>
                <div className="space-y-2">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border border-gray-100 p-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={r.priority === "High" ? "destructive" : r.priority === "Medium" ? "warning" : "secondary"}>{r.priority}</Badge>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.item}</p>
                          <p className="text-xs text-gray-500">{r.room}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{r.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
              <hr />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Summary</h3>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-gray-500"><th className="pb-2 font-medium">Category</th><th className="pb-2 text-right font-medium">Estimated Cost</th></tr></thead>
                  <tbody>
                    {costSummary.map((row, i) => (
                      <tr key={i} className={i === costSummary.length - 1 ? "font-bold border-t" : "border-b border-gray-50"}>
                        <td className="py-2 text-gray-700">{row.category}</td>
                        <td className="py-2 text-right text-gray-900">{row.cost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {generated && (
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => showNotification("Report finalized and sent to family!")}>Finalize &amp; Send to Family</Button>
            <Button variant="outline" onClick={() => showNotification("PDF download started")}>Download PDF</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
