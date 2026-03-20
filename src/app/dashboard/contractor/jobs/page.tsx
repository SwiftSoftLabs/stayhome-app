"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stages = ["Quoted", "Scheduled", "In Progress", "Completed"] as const;
type Stage = (typeof stages)[number];

const stageVariant: Record<Stage, "secondary" | "warning" | "default" | "success"> = {
  Quoted: "secondary",
  Scheduled: "warning",
  "In Progress": "default",
  Completed: "success",
};

const stageProgress: Record<Stage, number> = { Quoted: 25, Scheduled: 50, "In Progress": 75, Completed: 100 };

interface Job {
  id: number;
  family: string;
  address: string;
  description: string;
  stage: Stage;
  startDate: string;
  estCompletion: string;
}

const initialJobs: Job[] = [
  { id: 1, family: "Smith Family", address: "321 Elm St, Springfield", description: "Lead paint removal - kitchen and living room", stage: "In Progress", startDate: "2026-03-10", estCompletion: "2026-03-25" },
  { id: 2, family: "Brown Family", address: "654 Cedar Ln, Riverside", description: "Asbestos abatement - basement ceiling tiles", stage: "Scheduled", startDate: "2026-03-22", estCompletion: "2026-04-05" },
  { id: 3, family: "Davis Family", address: "987 Birch Dr, Lakeview", description: "Mold remediation - bathroom and crawl space", stage: "Quoted", startDate: "2026-03-28", estCompletion: "2026-04-10" },
  { id: 4, family: "Anderson Family", address: "357 Ash Blvd, Westfield", description: "Radon mitigation system installation", stage: "In Progress", startDate: "2026-03-08", estCompletion: "2026-03-22" },
];

export default function ContractorJobs() {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const advanceStage = (id: number) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const idx = stages.indexOf(j.stage);
        if (idx < stages.length - 1) {
          const next = stages[idx + 1];
          showToast(`Job updated to "${next}"`);
          return { ...j, stage: next };
        }
        return j;
      })
    );
  };

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-green-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <h1 className="text-2xl font-bold text-gray-900">Active Jobs</h1>
      <p className="mt-1 text-sm text-gray-500">Track and update your current projects.</p>

      <div className="mt-6 space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/contractor/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                      {job.address}
                    </Link>
                    <Badge variant={stageVariant[job.stage]}>{job.stage}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{job.family}</p>
                  <p className="text-sm text-gray-500">{job.description}</p>
                  <div className="mt-1 flex gap-4 text-xs text-gray-400">
                    <span>Start: {job.startDate}</span>
                    <span>Est. completion: {job.estCompletion}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 rounded-full bg-gray-200">
                      <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${stageProgress[job.stage]}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{stageProgress[job.stage]}%</span>
                  </div>
                </div>
                {job.stage !== "Completed" && (
                  <Button size="sm" className="ml-4 shrink-0" onClick={() => advanceStage(job.id)}>
                    Update Status
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
