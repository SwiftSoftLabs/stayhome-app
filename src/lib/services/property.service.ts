import { db } from "@/lib/insforge";
import type { Property } from "@/lib/types";

export const propertyService = {
  async listForOwner(ownerId: string) {
    const { data, error } = await db
      .from("properties")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    return { data: data as Property[] | null, error };
  },

  async create(payload: Omit<Property, "id" | "created_at" | "safety_score">) {
    const { data, error } = await db
      .from("properties")
      .insert(payload)
      .select()
      .single();
    return { data: data as Property | null, error };
  },

  async getById(id: string) {
    const { data, error } = await db
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    return { data: data as Property | null, error };
  },

  async updateScore(id: string, score: number) {
    const { data, error } = await db
      .from("properties")
      .update({ safety_score: score, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    return { data: data as Property | null, error };
  },
};
