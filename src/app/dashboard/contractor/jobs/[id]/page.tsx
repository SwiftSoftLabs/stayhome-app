"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const jobsData: Record<string, { family: string; address: string; status: string; description: string; hazards: { name: string; desc: string }[]; timeline: { date: string; event: string }[]; estimated: number; actual: number }> = {
  "1": { family: "Smith Family", address: "321 Elm St, Springfield", status: "In Progress", description: "Lead paint removal - kitchen and living room", hazards: [{ name: "Lead Paint", desc: "Peeling lead-based paint on kitchen walls and window frames" }, { name: "Lead Dust", desc: "Contaminated dust on living room surfaces" }], timeline: [{ date: "2026-03-05", event: "Lead assigned" }, { date: "2026-03-07", event: "Quote submitted" }, { date: "2026-03-10", event: "Work started" }], estimated: 2400, actual: 2100 },
  "2": { family: "Brown Family", address: "654 Cedar Ln, Riverside", status: "Scheduled", description: "Asbestos abatement - basement ceiling tiles", hazards: [{ name: "Asbestos Tiles", desc: "Friable asbestos in basement ceiling tiles" }], timeline: [{ date: "2026-03-12", event: "Lead assigned" }, { date: "2026-03-15", event: "Quote submitted" }, { date: "2026-03-18", event: "Scheduled for Mar 22" }], estimated: 3100, actual: 0 },
  "3": { family: "Davis Family", address: "987 Birch Dr, Lakeview", status: "Quoted", description: "Mold remediation - bathroom and crawl space", hazards: [{ name: "Black Mold", desc: "Extensive mold growth in bathroom ceiling" }, { name: "Crawl Space Mold", desc: "Moisture-related mold in crawl space" }], timeline: [{ date: "2026-03-16", event: "Lead assigned" }, { date: "2026-03-18", event: "Quote submitted" }], estimated: 1800, actual: 0 },
  "4": { family: "Anderson Family", address: "357 Ash Blvd, Westfield", status: "In Progress", description: "Radon mitigation system installation", hazards: [{ name: "Radon Gas", desc: "Elevated radon levels measured at 8.2 pCi/L in basement" }], timeline: [{ date: "2026-03-02", event: "Lead assigned" }, { date: "2026-03-04", event: "Quote submitted" }, { date: "2026-03-08", event: "Work started" }], estimated: 1500, actual: 1350 },
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const job = jobsData[id] ?? jobsData["1"];
  const [status, setStatus] = useState(job.status);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const markComplete = () => { setStatus("Completed"); showToast("Job marked as complete!"); };

  const statusVariant = { Quoted: "secondary", Scheduled: "warning", "In Progress": "default", Completed: "success" } as const;

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.address}</h1>
          <p className="mt-1 text-sm text-gray-500">{job.family} &middot; {job.description}</p>
        </div>
        <Badge variant={statusVariant[status as keyof typeof statusVariant] ?? "default"}>{status}</Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative border-l border-gray-200 pl-4">
              {job.timeline.map((t, i) => (
                <li key={i} className="mb-4 last:mb-0">
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                  <p className="text-sm font-medium text-gray-900">{t.event}</p>
                  <p className="text-xs text-gray-500">{t.date}</p>
                </li>
              ))}
              {status === "Completed" && (
                <li className="mb-0">
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-green-600" />
                  <p className="text-sm font-medium text-green-700">Completed</p>
                  <p className="text-xs text-gray-500">Today</p>
                </li>
              )}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Scope of Work</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {job.hazards.map((h) => (
              <div key={h.name} className="rounded-md border p-3">
                <p className="font-medium text-gray-900">{h.name}</p>
                <p className="text-sm text-gray-500">{h.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
                  Photo {n}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cost Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Estimated Cost</span>
                <span className="font-medium">${job.estimated.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Actual Cost</span>
                <span className="font-medium">{job.actual ? `$${job.actual.toLocaleString()}` : "TBD"}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm font-semibold">
                <span>Variance</span>
                <span className={job.actual ? (job.actual <= job.estimated ? "text-green-600" : "text-red-600") : "text-gray-400"}>
                  {job.actual ? `$${(job.estimated - job.actual).toLocaleString()}` : "--"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <textarea
            className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
            placeholder="Add notes about this job..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      {status !== "Completed" && (
        <div className="mt-6">
          <Button onClick={markComplete}>Mark as Complete</Button>
        </div>
      )}
    </DashboardLayout>
  );
}
