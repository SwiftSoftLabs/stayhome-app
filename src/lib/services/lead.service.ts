import { db } from "@/lib/insforge";
import type { Lead, Job, JobStage, Urgency } from "@/lib/types";

export const leadService = {
  async listAvailable() {
    // Leads with no contractor assigned yet
    const { data, error } = await db
      .from("leads")
      .select("*, family_profile:profiles!leads_family_id_fkey(*), audit:audits(*, property:properties(*))")
      .eq("status", "pending")
      .is("contractor_id", null)
      .order("created_at", { ascending: false });
    return { data: data as Lead[] | null, error };
  },

  async listForContractor(contractorId: string) {
    const { data, error } = await db
      .from("leads")
      .select("*, family_profile:profiles!leads_family_id_fkey(*), audit:audits(*, property:properties(*))")
      .eq("contractor_id", contractorId)
      .order("created_at", { ascending: false });
    return { data: data as Lead[] | null, error };
  },

  async acceptLead(id: string, contractorId: string) {
    const { data, error } = await db
      .from("leads")
      .update({ contractor_id: contractorId, status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data: data as Lead | null, error };
  },

  async declineLead(id: string) {
    const { data, error } = await db
      .from("leads")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data: data as Lead | null, error };
  },

  async createLead(payload: {
    audit_id: string;
    family_id: string;
    hazard: string;
    urgency: Urgency;
    estimated_value?: number;
  }) {
    const { data, error } = await db
      .from("leads")
      .insert(payload)
      .select()
      .single();
    return { data: data as Lead | null, error };
  },
};

export const jobService = {
  async listForContractor(contractorId: string) {
    const { data, error } = await db
      .from("jobs")
      .select("*, family_profile:profiles!jobs_family_id_fkey(*)")
      .eq("contractor_id", contractorId)
      .order("updated_at", { ascending: false });
    return { data: data as Job[] | null, error };
  },

  async listCompleted(contractorId: string) {
    const { data, error } = await db
      .from("jobs")
      .select("*, family_profile:profiles!jobs_family_id_fkey(*)")
      .eq("contractor_id", contractorId)
      .eq("stage", "Completed")
      .order("completed_at", { ascending: false });
    return { data: data as Job[] | null, error };
  },

  async updateStage(id: string, stage: JobStage, progress: number) {
    const payload: Partial<Job> & { updated_at: string } = {
      stage,
      progress,
      updated_at: new Date().toISOString(),
    };
    if (stage === "Completed") {
      payload.completed_at = new Date().toISOString();
    }
    const { data, error } = await db
      .from("jobs")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    return { data: data as Job | null, error };
  },

  async create(payload: Omit<Job, "id" | "created_at" | "updated_at" | "completed_at">) {
    const { data, error } = await db
      .from("jobs")
      .insert(payload)
      .select()
      .single();
    return { data: data as Job | null, error };
  },

  async listAll() {
    const { data, error } = await db
      .from("jobs")
      .select("*, family_profile:profiles!jobs_family_id_fkey(*)")
      .order("created_at", { ascending: false });
    return { data: data as Job[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await db
      .from("jobs")
      .select("*, family_profile:profiles!jobs_family_id_fkey(*), lead:leads(*, audit:audits(*, property:properties(*)))")
      .eq("id", id)
      .single();
    return { data: data as Job | null, error };
  },
};
