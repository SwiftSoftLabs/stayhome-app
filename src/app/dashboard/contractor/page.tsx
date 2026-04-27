"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLeads, useJobs } from "@/lib/hooks/useLeads";
import { useStore } from "@/lib/store";
import { leadService } from "@/lib/services/lead.service";
import { Briefcase, CheckCircle, DollarSign, Zap } from "lucide-react";

const urgencyVariant = { high: "destructive", medium: "warning", low: "secondary" } as const;
const stageVariant = {
  Quoted: "secondary",
  Scheduled: "warning",
  "In Progress": "default",
  Completed: "success",
} as const;

export default function ContractorDashboard() {
  const { currentUser, addNotification } = useStore();
  const { leads, loading: leadsLoading, refresh: refreshLeads } = useLeads();
  const { jobs, loading: jobsLoading } = useJobs();

  const availableLeads = leads.filter((l) => l.status === "pending");
  const activeJobs = jobs.filter((j) => j.stage !== "Completed");
  const completedJobs = jobs.filter((j) => j.stage === "Completed");
  const totalEarnings = completedJobs.reduce((sum, j) => sum + (j.amount ?? 0), 0);

  const handleAccept = async (leadId: string) => {
    if (!currentUser) return;
    const { error } = await leadService.acceptLead(leadId, currentUser.id);
    if (!error) {
      addNotification({ title: "Lead Accepted", message: "Lead added to your active jobs.", type: "success" });
      refreshLeads();
    }
  };

  const handleDecline = async (leadId: string) => {
    const { error } = await leadService.declineLead(leadId);
    if (!error) {
      addNotification({ title: "Lead Declined", message: "Lead has been declined.", type: "info" });
      refreshLeads();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {currentUser?.name ?? "Contractor"}
          </h1>
          <p className="text-gray-500">Here is your activity overview.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "New Leads", value: availableLeads.length, color: "text-blue-600", icon: <Zap className="h-5 w-5 text-blue-300" /> },
            { label: "Active Jobs", value: activeJobs.length, color: "text-green-600", icon: <Briefcase className="h-5 w-5 text-green-300" /> },
            { label: "Completed", value: completedJobs.length, color: "text-purple-600", icon: <CheckCircle className="h-5 w-5 text-purple-300" /> },
            { label: "Total Earned", value: `$${totalEarnings.toLocaleString()}`, color: "text-amber-600", icon: <DollarSign className="h-5 w-5 text-amber-300" /> },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                {s.icon}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* New Leads */}
          <Card>
            <CardHeader><CardTitle>New Leads</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {leadsLoading ? (
                [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)
              ) : availableLeads.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No new leads available.</p>
              ) : (
                availableLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {lead.family_profile?.name ?? "Family"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {lead.audit?.property?.street ?? "Address TBD"} · {lead.hazard}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={urgencyVariant[lead.urgency]}>{lead.urgency}</Badge>
                        {lead.estimated_value && (
                          <span className="text-sm text-gray-500">${lead.estimated_value.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAccept(lead.id)}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDecline(lead.id)}>Decline</Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card>
            <CardHeader><CardTitle>Active Jobs</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {jobsLoading ? (
                [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)
              ) : activeJobs.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">No active jobs.</p>
              ) : (
                activeJobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <Badge variant={stageVariant[job.stage]}>{job.stage}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{job.address ?? job.family_profile?.name}</p>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/contractor/leads"><Button>View All Leads</Button></Link>
          <Link href="/dashboard/contractor/jobs"><Button variant="outline">View Active Jobs</Button></Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
