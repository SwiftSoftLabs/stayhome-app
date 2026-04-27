"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { jobService } from "@/lib/services/lead.service";
import { useStore } from "@/lib/store";
import type { Job, JobStage } from "@/lib/types";
import { MapPin, User, DollarSign, ChevronRight } from "lucide-react";

const stages: JobStage[] = ["Quoted", "Scheduled", "In Progress", "Completed"];
const stageProgress: Record<JobStage, number> = { Quoted: 25, Scheduled: 50, "In Progress": 75, Completed: 100 };
const stageVariant: Record<JobStage, "secondary" | "warning" | "default" | "success"> = {
  Quoted: "secondary",
  Scheduled: "warning",
  "In Progress": "default",
  Completed: "success",
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addNotification } = useStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (!id) return;
    jobService.getById(id).then(({ data }) => {
      setJob(data);
      setLoading(false);
    });
  }, [id]);

  const advanceStage = async () => {
    if (!job) return;
    const idx = stages.indexOf(job.stage);
    if (idx >= stages.length - 1) return;
    const next = stages[idx + 1];
    setAdvancing(true);
    const { data, error } = await jobService.updateStage(job.id, next, stageProgress[next]);
    if (!error && data) {
      setJob(data);
      addNotification({ title: "Job Updated", message: `Job moved to "${next}".`, type: "success" });
    }
    setAdvancing(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-gray-700">Job not found</p>
          <Link href="/dashboard/contractor/jobs">
            <Button className="mt-4" variant="outline">Back to Jobs</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const currentStageIdx = stages.indexOf(job.stage);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
              {job.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {job.address}
                </span>
              )}
              {job.family_profile?.name && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> {job.family_profile.name}
                </span>
              )}
              {job.amount && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> ${job.amount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Badge variant={stageVariant[job.stage]} className="self-start text-sm px-3 py-1">{job.stage}</Badge>
        </div>

        {/* Stage Pipeline */}
        <Card>
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {stages.map((s, i) => (
                <div key={s} className="flex flex-1 items-center">
                  <div className={`flex h-8 flex-1 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    i < currentStageIdx
                      ? "bg-blue-600 text-white"
                      : i === currentStageIdx
                      ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                      : "bg-gray-100 text-gray-400"
                  }`}>{s}</div>
                  {i < stages.length - 1 && (
                    <ChevronRight className={`h-4 w-4 shrink-0 mx-0.5 ${i < currentStageIdx ? "text-blue-400" : "text-gray-300"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${stageProgress[job.stage]}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
          <CardContent>
            <ol className="relative border-l border-gray-200 pl-5 space-y-4">
              <li>
                <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                <p className="text-sm font-medium text-gray-900">Job Created</p>
                <p className="text-xs text-gray-400">{new Date(job.created_at).toLocaleDateString()}</p>
              </li>
              {job.stage !== "Quoted" && (
                <li>
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                  <p className="text-sm font-medium text-gray-900">Scheduled</p>
                </li>
              )}
              {(job.stage === "In Progress" || job.stage === "Completed") && (
                <li>
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600" />
                  <p className="text-sm font-medium text-gray-900">Work Started</p>
                </li>
              )}
              {job.stage === "Completed" && (
                <li>
                  <div className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border-2 border-white bg-green-600" />
                  <p className="text-sm font-medium text-green-700">Completed</p>
                  {job.completed_at && (
                    <p className="text-xs text-gray-400">{new Date(job.completed_at).toLocaleDateString()}</p>
                  )}
                </li>
              )}
            </ol>
          </CardContent>
        </Card>

        {/* Photos placeholder */}
        <Card>
          <CardHeader><CardTitle>Site Photos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                  Photo {n}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {job.stage !== "Completed" && (
          <Button onClick={advanceStage} disabled={advancing} size="lg" className="w-full sm:w-auto">
            {advancing ? "Updating..." : `Advance to ${stages[currentStageIdx + 1] ?? "Complete"}`}
          </Button>
        )}
      </div>
    </DashboardLayout>
  );
}
