"use client";
import { useEffect, useState, useCallback } from "react";
import { leadService, jobService } from "@/lib/services/lead.service";
import { useStore } from "@/lib/store";
import type { Lead, Job } from "@/lib/types";

export function useLeads() {
  const { currentUser } = useStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const result = currentUser.role === "contractor"
      ? await leadService.listForContractor(currentUser.id)
      : await leadService.listAvailable();
    setLeads(result.data ?? []);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { refresh(); }, [refresh]);

  const acceptLead = useCallback(async (id: string) => {
    if (!currentUser) return;
    const { error } = await leadService.acceptLead(id, currentUser.id);
    if (!error) refresh();
    return { error };
  }, [currentUser, refresh]);

  const declineLead = useCallback(async (id: string) => {
    const { error } = await leadService.declineLead(id);
    if (!error) refresh();
    return { error };
  }, [refresh]);

  return { leads, loading, refresh, acceptLead, declineLead };
}

export function useJobs() {
  const { currentUser } = useStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const result = await jobService.listForContractor(currentUser.id);
    setJobs(result.data ?? []);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { refresh(); }, [refresh]);

  return { jobs, loading, refresh };
}
