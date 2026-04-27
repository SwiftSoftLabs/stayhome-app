"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useJobs } from "@/lib/hooks/useLeads";
import { CheckCircle, DollarSign, Star } from "lucide-react";

export default function CompletedJobsPage() {
  const { jobs, loading } = useJobs();

  const completed = jobs.filter((j) => j.stage === "Completed");
  const totalEarnings = completed.reduce((sum, j) => sum + (j.amount ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Completed Jobs</h1>
          <p className="text-gray-500">Your work history and earnings summary.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{loading ? "—" : completed.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? "—" : `$${totalEarnings.toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Job Value</p>
                <p className="text-2xl font-bold text-amber-600">
                  {loading || completed.length === 0 ? "—" : `$${Math.round(totalEarnings / completed.length).toLocaleString()}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : completed.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-400">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-gray-200" />
              <p>No completed jobs yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Job History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {completed.map((job) => (
                <div key={job.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-sm text-gray-500">
                      {job.family_profile?.name}
                      {job.completed_at && ` · Completed ${new Date(job.completed_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.amount && (
                      <Badge variant="success">${job.amount.toLocaleString()}</Badge>
                    )}
                    <Badge variant="secondary">{job.stage}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
