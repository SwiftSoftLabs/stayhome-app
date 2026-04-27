import { db } from "@/lib/insforge";
import type { Report, Recommendation } from "@/lib/types";

export const reportService = {
  async listForFamily(familyId: string) {
    const { data, error } = await db
      .from("reports")
      .select("*, audit:audits(*, property:properties(*))")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });
    return { data: data as Report[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await db
      .from("reports")
      .select("*, audit:audits(*, property:properties(*))")
      .eq("id", id)
      .single();
    return { data: data as Report | null, error };
  },

  async getByAuditId(auditId: string) {
    const { data, error } = await db
      .from("reports")
      .select("*")
      .eq("audit_id", auditId)
      .single();
    return { data: data as Report | null, error };
  },

  async create(payload: {
    audit_id: string;
    family_id: string;
    safety_score: number;
    summary: string;
    recommendations: Recommendation[];
  }) {
    const { data, error } = await db
      .from("reports")
      .insert(payload)
      .select()
      .single();
    return { data: data as Report | null, error };
  },

  async listAll() {
    const { data, error } = await db
      .from("reports")
      .select("*, audit:audits(*, property:properties(*))")
      .order("created_at", { ascending: false });
    return { data: data as Report[] | null, error };
  },
};
