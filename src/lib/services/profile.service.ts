import { db } from "@/lib/insforge";
import type { Profile } from "@/lib/types";

export const profileService = {
  async getById(id: string) {
    const { data, error } = await db.from("profiles").select("*").eq("id", id).single();
    return { data: data as Profile | null, error };
  },

  async upsert(profile: Partial<Profile> & { id: string }) {
    const { data, error } = await db
      .from("profiles")
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select()
      .single();
    return { data: data as Profile | null, error };
  },

  async listContractors() {
    const { data, error } = await db
      .from("contractor_profiles")
      .select("*, profile:profiles(*)")
      .eq("verified", true)
      .order("rating", { ascending: false });
    return { data: data as Array<Record<string, unknown>> | null, error };
  },

  async listAll() {
    const { data, error } = await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    return { data: data as Profile[] | null, error };
  },
};
