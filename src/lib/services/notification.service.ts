import { db, realtime } from "@/lib/insforge";
import type { AppNotification, NotificationType } from "@/lib/types";

export const notificationService = {
  async listForUser(userId: string) {
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { data: data as AppNotification[] | null, error };
  },

  async create(userId: string, title: string, message: string, type: NotificationType = "info") {
    const { data, error } = await db
      .from("notifications")
      .insert({ user_id: userId, title, message, type })
      .select()
      .single();
    return { data: data as AppNotification | null, error };
  },

  async markRead(id: string) {
    const { data, error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .select()
      .single();
    return { data: data as AppNotification | null, error };
  },

  async markAllRead(userId: string) {
    const { error } = await db
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    return { error };
  },

  async subscribeToUser(userId: string, onEvent: (n: AppNotification) => void) {
    const channel = `notifications:${userId}`;
    await realtime.connect();
    await realtime.subscribe(channel);
    realtime.on("new_notification", onEvent);
    return { channel };
  },

  unsubscribeFromUser(userId: string) {
    const channel = `notifications:${userId}`;
    realtime.unsubscribe(channel);
  },
};
