"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const initialLeads = [
  { id: 1, family: "Johnson Family", address: "123 Oak St", hazard: "Lead Paint", urgency: "High" as const, value: "$2,400" },
  { id: 2, family: "Garcia Family", address: "456 Maple Ave", hazard: "Asbestos", urgency: "Medium" as const, value: "$3,100" },
  { id: 3, family: "Williams Family", address: "789 Pine Rd", hazard: "Mold", urgency: "Low" as const, value: "$1,800" },
];

const activeJobs = [
  { id: 1, family: "Smith Family", address: "321 Elm St", stage: "In Progress", progress: 75 },
  { id: 2, family: "Brown Family", address: "654 Cedar Ln", stage: "Scheduled", progress: 50 },
  { id: 3, family: "Davis Family", address: "987 Birch Dr", stage: "Quoted", progress: 25 },
];

const urgencyVariant = { High: "destructive", Medium: "warning", Low: "secondary" } as const;

export default function ContractorDashboard() {
  const [leads, setLeads] = useState(initialLeads);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLead = (id: number, action: "accept" | "decline") => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    showToast(action === "accept" ? "Lead accepted!" : "Lead declined.");
  };

  const stats = [
    { label: "New Leads", value: "5", color: "text-blue-600" },
    { label: "Active Jobs", value: "3", color: "text-green-600" },
    { label: "Completed This Month", value: "8", color: "text-purple-600" },
    { label: "Revenue This Month", value: "$12,500", color: "text-amber-600" },
  ];

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, Contractor</h1>
      <p className="mt-1 text-sm text-gray-500">Here is your activity overview.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium text-gray-900">{lead.family}</p>
                  <p className="text-sm text-gray-500">{lead.address} &middot; {lead.hazard}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={urgencyVariant[lead.urgency]}>{lead.urgency}</Badge>
                    <span className="text-sm text-gray-500">{lead.value}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleLead(lead.id, "accept")}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => handleLead(lead.id, "decline")}>Decline</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{job.family}</p>
                  <Badge variant="default">{job.stage}</Badge>
                </div>
                <p className="text-sm text-gray-500">{job.address}</p>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${job.progress}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex gap-4">
        <Link href="/dashboard/contractor/leads"><Button>View Leads</Button></Link>
        <Link href="/dashboard/contractor/jobs"><Button variant="outline">View Active Jobs</Button></Link>
      </div>
    </DashboardLayout>
  );
}
