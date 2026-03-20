"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Lead {
  id: number;
  family: string;
  address: string;
  hazards: string[];
  value: string;
  urgency: "High" | "Medium" | "Low";
  date: string;
  status: "new" | "accepted" | "declined";
}

const urgencyVariant = { High: "destructive", Medium: "warning", Low: "secondary" } as const;

const initialLeads: Lead[] = [
  { id: 1, family: "Johnson Family", address: "123 Oak St, Springfield", hazards: ["Lead Paint", "Mold"], value: "$2,400", urgency: "High", date: "2026-03-18", status: "new" },
  { id: 2, family: "Garcia Family", address: "456 Maple Ave, Riverside", hazards: ["Asbestos"], value: "$3,100", urgency: "Medium", date: "2026-03-17", status: "new" },
  { id: 3, family: "Williams Family", address: "789 Pine Rd, Lakeview", hazards: ["Mold", "Radon"], value: "$1,800", urgency: "Low", date: "2026-03-16", status: "new" },
  { id: 4, family: "Martinez Family", address: "135 Walnut St, Oakdale", hazards: ["Lead Paint"], value: "$2,000", urgency: "High", date: "2026-03-15", status: "new" },
  { id: 5, family: "Lee Family", address: "246 Spruce Ct, Hillside", hazards: ["Asbestos", "Mold"], value: "$4,200", urgency: "Medium", date: "2026-03-14", status: "new" },
  { id: 6, family: "Anderson Family", address: "357 Ash Blvd, Westfield", hazards: ["Radon"], value: "$1,500", urgency: "Low", date: "2026-03-12", status: "accepted" },
  { id: 7, family: "Taylor Family", address: "468 Cherry Ln, Eastview", hazards: ["Lead Paint"], value: "$2,800", urgency: "High", date: "2026-03-10", status: "accepted" },
  { id: 8, family: "Thomas Family", address: "579 Poplar Dr, Northgate", hazards: ["Mold"], value: "$1,900", urgency: "Medium", date: "2026-03-08", status: "accepted" },
  { id: 9, family: "White Family", address: "680 Willow Way, Southpark", hazards: ["Asbestos"], value: "$3,500", urgency: "High", date: "2026-03-06", status: "declined" },
  { id: 10, family: "Harris Family", address: "791 Sycamore Pl, Midtown", hazards: ["Radon", "Mold"], value: "$2,200", urgency: "Low", date: "2026-03-04", status: "declined" },
];

export default function ContractorLeads() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const updateLead = (id: number, status: "accepted" | "declined") => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    showToast(status === "accepted" ? "Lead accepted successfully!" : "Lead declined.");
  };

  const renderLeadCard = (lead: Lead) => (
    <Card key={lead.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900">{lead.family}</p>
            <p className="text-sm text-gray-500">{lead.address}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {lead.hazards.map((h) => (<Badge key={h} variant="outline">{h}</Badge>))}
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
              <span>Est. {lead.value}</span>
              <Badge variant={urgencyVariant[lead.urgency]}>{lead.urgency}</Badge>
              <span>Received {lead.date}</span>
            </div>
          </div>
          {lead.status === "new" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => updateLead(lead.id, "accepted")}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => updateLead(lead.id, "declined")}>Decline</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const byStatus = (s: string) => leads.filter((l) => l.status === s);

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
      <p className="mt-1 text-sm text-gray-500">Manage incoming project leads.</p>

      <Tabs defaultValue="new" className="mt-6">
        <TabsList>
          <TabsTrigger value="new">New ({byStatus("new").length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({byStatus("accepted").length})</TabsTrigger>
          <TabsTrigger value="declined">Declined ({byStatus("declined").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="new">{byStatus("new").map(renderLeadCard)}</TabsContent>
        <TabsContent value="accepted">{byStatus("accepted").map(renderLeadCard)}</TabsContent>
        <TabsContent value="declined">{byStatus("declined").map(renderLeadCard)}</TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
