"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";

type AuditStatus = "Pending Review" | "Approved" | "Flagged";

interface Audit {
  id: string; address: string; assessor: string; family: string; date: string; status: AuditStatus; risk: number; summary: string;
}

const initialAudits: Audit[] = [
  { id: "A-1042", address: "123 Oak St", assessor: "Mike Torres", family: "Chen", date: "2026-03-18", status: "Pending Review", risk: 72, summary: "Found 3 trip hazards in hallways, loose handrail on stairs, and inadequate bathroom grab bars." },
  { id: "A-1041", address: "456 Elm Ave", assessor: "Jane Liu", family: "Walsh", date: "2026-03-17", status: "Approved", risk: 45, summary: "Minor lighting issues in basement. Overall home is in good condition." },
  { id: "A-1040", address: "789 Pine Rd", assessor: "James Obi", family: "Park", date: "2026-03-16", status: "Flagged", risk: 91, summary: "Critical: exposed wiring in kitchen, unstable flooring in living room, no smoke detectors on 2nd floor." },
  { id: "A-1039", address: "321 Maple Dr", assessor: "Mike Torres", family: "Patel", date: "2026-03-15", status: "Pending Review", risk: 63, summary: "Bathroom floor slippery, kitchen cabinets need securing, front steps cracked." },
  { id: "A-1038", address: "654 Cedar Ln", assessor: "Noah Wilson", family: "Kim", date: "2026-03-14", status: "Approved", risk: 38, summary: "Well-maintained home. Recommended additional lighting in garage." },
  { id: "A-1037", address: "987 Birch Ct", assessor: "Jane Liu", family: "Brown", date: "2026-03-13", status: "Approved", risk: 52, summary: "Moderate concerns with stair carpet wear. Suggested non-slip treatments." },
  { id: "A-1036", address: "147 Walnut St", assessor: "James Obi", family: "Ruiz", date: "2026-03-12", status: "Flagged", risk: 85, summary: "Multiple fire safety issues: blocked exits, missing extinguisher, faulty wiring." },
  { id: "A-1035", address: "258 Spruce Ave", assessor: "Noah Wilson", family: "Reed", date: "2026-03-11", status: "Pending Review", risk: 58, summary: "Deck railing unstable, uneven walkway, poor outdoor lighting." },
  { id: "A-1034", address: "369 Ash Blvd", assessor: "Mike Torres", family: "Wilson", date: "2026-03-10", status: "Approved", risk: 29, summary: "Excellent condition. Minor recommendation for carbon monoxide detector update." },
  { id: "A-1033", address: "480 Poplar Way", assessor: "Jane Liu", family: "Obi", date: "2026-03-09", status: "Pending Review", risk: 67, summary: "Bathroom accessibility issues, narrow doorways, carpet edges lifting." },
];

const statusVariant = (s: AuditStatus) => s === "Approved" ? "success" : s === "Flagged" ? "destructive" : "warning";

export default function AuditsPage() {
  const [audits, setAudits] = useState(initialAudits);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { addNotification } = useStore();

  function updateStatus(id: string, status: AuditStatus) {
    setAudits((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    addNotification({ title: "Audit Updated", message: `Audit ${id} marked as ${status}.`, type: status === "Approved" ? "success" : "warning" });
  }

  function renderTable(list: Audit[]) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-gray-500">
            <th className="pb-2 font-medium">ID</th><th className="pb-2 font-medium">Address</th><th className="pb-2 font-medium">Assessor</th><th className="pb-2 font-medium">Family</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Risk</th><th className="pb-2 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{a.id}</td>
                <td className="py-3">{a.address}</td>
                <td className="py-3">{a.assessor}</td>
                <td className="py-3">{a.family}</td>
                <td className="py-3 text-gray-500">{a.date}</td>
                <td className="py-3"><Badge variant={statusVariant(a.status)}>{a.status}</Badge></td>
                <td className="py-3"><span className={a.risk >= 75 ? "font-bold text-red-600" : a.risk >= 50 ? "text-amber-600" : "text-green-600"}>{a.risk}</span></td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>Review</Button>
                    {a.status !== "Approved" && <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, "Approved")}>Approve</Button>}
                    {a.status !== "Flagged" && <Button size="sm" variant="destructive" onClick={() => updateStatus(a.id, "Flagged")}>Flag</Button>}
                  </div>
                  {expanded === a.id && (
                    <div className="mt-2 rounded bg-gray-50 p-3 text-xs text-gray-700">{a.summary}</div>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-gray-400">No audits found.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Review</h1>
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({audits.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending Review ({audits.filter((a) => a.status === "Pending Review").length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({audits.filter((a) => a.status === "Approved").length})</TabsTrigger>
                <TabsTrigger value="flagged">Flagged ({audits.filter((a) => a.status === "Flagged").length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all">{renderTable(audits)}</TabsContent>
              <TabsContent value="pending">{renderTable(audits.filter((a) => a.status === "Pending Review"))}</TabsContent>
              <TabsContent value="approved">{renderTable(audits.filter((a) => a.status === "Approved"))}</TabsContent>
              <TabsContent value="flagged">{renderTable(audits.filter((a) => a.status === "Flagged"))}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
