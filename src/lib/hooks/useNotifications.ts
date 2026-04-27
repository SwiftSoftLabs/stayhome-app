"use client";
import { useEffect, useCallback } from "react";
import { notificationService } from "@/lib/services/notification.service";
import { useStore } from "@/lib/store";
import type { AppNotification } from "@/lib/types";

export function useNotifications() {
  const { currentUser, _setNotifications, markNotificationRead, markAllRead } = useStore();

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await notificationService.listForUser(currentUser.id);
    if (data) _setNotifications(data);
  }, [currentUser, _setNotifications]);

  useEffect(() => {
    if (!currentUser) return;
    refresh();

    notificationService.subscribeToUser(currentUser.id, (n: AppNotification) => {
      _setNotifications((prev: AppNotification[]) => [n, ...prev]);
    }).catch(() => { /* realtime optional */ });

    return () => {
      notificationService.unsubscribeFromUser(currentUser.id);
    };
  }, [currentUser, refresh, _setNotifications]);

  const markRead = useCallback(async (id: string) => {
    markNotificationRead(id);
    await notificationService.markRead(id);
  }, [markNotificationRead]);

  const markAll = useCallback(async () => {
    markAllRead();
    if (currentUser) await notificationService.markAllRead(currentUser.id);
  }, [currentUser, markAllRead]);

  return { refresh, markRead, markAll };
}
