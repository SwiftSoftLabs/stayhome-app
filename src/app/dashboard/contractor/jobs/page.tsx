"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useJobs } from "@/lib/hooks/useLeads";
import { jobService } from "@/lib/services/lead.service";
import { useStore } from "@/lib/store";
import type { Job, JobStage } from "@/lib/types";
import { useState } from "react";

const stages: JobStage[] = ["Quoted", "Scheduled", "In Progress", "Completed"];
const stageProgress: Record<JobStage, number> = { Quoted: 25, Scheduled: 50, "In Progress": 75, Completed: 100 };
const stageVariant: Record<JobStage, "secondary" | "warning" | "default" | "success"> = {
  Quoted: "secondary",
  Scheduled: "warning",
  "In Progress": "default",
  Completed: "success",
};

export default function ContractorJobsPage() {
  const { addNotification } = useStore();
  const { jobs, loading, refresh } = useJobs();
  const [advancing, setAdvancing] = useState<string | null>(null);

  const activeJobs = jobs.filter((j) => j.stage !== "Completed");

  const advanceStage = async (job: Job) => {
    const idx = stages.indexOf(job.stage);
    if (idx < stages.length - 1) {
      const next = stages[idx + 1];
      const nextProgress = stageProgress[next];
      setAdvancing(job.id);
      const { error } = await jobService.updateStage(job.id, next, nextProgress);
      if (!error) {
        addNotification({ title: "Job Updated", message: `Job moved to "${next}".`, type: "success" });
        await refresh();
      }
      setAdvancing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Jobs</h1>
          <p className="text-gray-500">Track and update your current projects.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />)}
          </div>
        ) : activeJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <p>No active jobs. Accept leads to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Link href={`/dashboard/contractor/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                          {job.title}
                        </Link>
                        <Badge variant={stageVariant[job.stage]}>{job.stage}</Badge>
                      </div>
                      {job.address && <p className="mt-0.5 text-sm text-gray-500">{job.address}</p>}
                      <p className="text-sm text-gray-500">{job.family_profile?.name}</p>
                      {job.amount && (
                        <p className="mt-0.5 text-sm font-medium text-gray-700">${job.amount.toLocaleString()}</p>
                      )}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{job.progress}%</span>
                      </div>
                    </div>
                    {job.stage !== "Completed" && (
                      <Button
                        size="sm"
                        className="shrink-0"
                        disabled={advancing === job.id}
                        onClick={() => advanceStage(job)}
                      >
                        {advancing === job.id ? "Updating..." : "Update Status"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
