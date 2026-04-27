import { db } from "@/lib/insforge";
import type { Audit, AuditFinding, AuditStatus, AuditPackage } from "@/lib/types";

export const auditService = {
  async listForFamily(familyId: string) {
    const { data, error } = await db
      .from("audits")
      .select("*, property:properties(*)")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false });
    return { data: data as Audit[] | null, error };
  },

  async listForAssessor(assessorId: string) {
    const { data, error } = await db
      .from("audits")
      .select("*, property:properties(*), family_profile:profiles!audits_family_id_fkey(*)")
      .eq("assessor_id", assessorId)
      .order("scheduled_date", { ascending: true });
    return { data: data as Audit[] | null, error };
  },

  async listAll() {
    const { data, error } = await db
      .from("audits")
      .select("*, property:properties(*), family_profile:profiles!audits_family_id_fkey(*)")
      .order("created_at", { ascending: false });
    return { data: data as Audit[] | null, error };
  },

  async getById(id: string) {
    const { data, error } = await db
      .from("audits")
      .select("*, property:properties(*), family_profile:profiles!audits_family_id_fkey(*), assessor_profile:profiles!audits_assessor_id_fkey(*)")
      .eq("id", id)
      .single();
    return { data: data as Audit | null, error };
  },

  async create(payload: {
    property_id: string;
    family_id: string;
    package: AuditPackage;
    scheduled_date: string;
    scheduled_time: string;
  }) {
    const { data, error } = await db
      .from("audits")
      .insert(payload)
      .select()
      .single();
    return { data: data as Audit | null, error };
  },

  async updateStatus(id: string, status: AuditStatus, extra?: Partial<Audit>) {
    const { data, error } = await db
      .from("audits")
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data: data as Audit | null, error };
  },

  async getFindingsByAudit(auditId: string) {
    const { data, error } = await db
      .from("audit_findings")
      .select("*")
      .eq("audit_id", auditId)
      .order("severity");
    return { data: data as AuditFinding[] | null, error };
  },

  async addFinding(finding: Omit<AuditFinding, "id" | "created_at">) {
    const { data, error } = await db
      .from("audit_findings")
      .insert(finding)
      .select()
      .single();
    return { data: data as AuditFinding | null, error };
  },

  async resolveFinding(id: string) {
    const { data, error } = await db
      .from("audit_findings")
      .update({ resolved: true })
      .eq("id", id)
      .select()
      .single();
    return { data: data as AuditFinding | null, error };
  },
};
