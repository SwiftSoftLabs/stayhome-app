"use client";

import { useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStore, type Notification } from "@/lib/store";

const mockNotifications: Omit<Notification, "id" | "read" | "createdAt">[] = [
  { title: "Audit Completed", message: "Audit #A-1042 for 123 Oak St has been completed by Mike Torres.", type: "success" },
  { title: "New User Signup", message: "Sarah Chen has registered as a Family member.", type: "info" },
  { title: "Payment Received", message: "Payment of $1,200 received from Chen Family.", type: "success" },
  { title: "Audit Flagged", message: "Audit #A-1040 has been flagged for critical safety issues.", type: "warning" },
  { title: "Contractor Joined", message: "BuildRight Inc. has joined the contractor network.", type: "info" },
  { title: "Payout Pending", message: "Assessor payout of $850 for Mike Torres is pending.", type: "warning" },
  { title: "System Update", message: "Platform maintenance scheduled for March 25th.", type: "info" },
  { title: "Review Required", message: "Audit #A-1039 is awaiting admin review.", type: "warning" },
];

const typeIcons: Record<string, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

const typeBg: Record<string, string> = {
  info: "bg-blue-50",
  success: "bg-green-50",
  warning: "bg-amber-50",
  error: "bg-red-50",
};

function getGroup(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  if (date >= todayStart) return "Today";
  if (date >= yesterdayStart) return "Yesterday";
  return "Earlier";
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { notifications, addNotification, markNotificationRead, markAllRead } = useStore();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    // Stagger mock notifications with different timestamps
    mockNotifications.forEach((n, i) => {
      setTimeout(() => addNotification(n), i * 50);
    });
  }, [addNotification]);

  const grouped: Record<string, Notification[]> = {};
  for (const n of notifications) {
    const g = getGroup(n.createdAt);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(n);
  }

  const groupOrder = ["Today", "Yesterday", "Earlier"];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllRead}>Mark All as Read</Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <span className="text-4xl">🔔</span>
              <p className="mt-3 text-lg font-medium text-gray-700">No notifications</p>
              <p className="text-sm text-gray-400">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          groupOrder.map((group) =>
            grouped[group]?.length ? (
              <div key={group}>
                <h2 className="mb-2 text-sm font-semibold text-gray-500">{group}</h2>
                <div className="space-y-2">
                  {grouped[group].map((n) => (
                    <Card
                      key={n.id}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? "border-l-4 border-l-blue-500" : ""}`}
                      onClick={() => !n.read && markNotificationRead(n.id)}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${typeBg[n.type]}`}>
                          {typeIcons[n.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>{n.title}</p>
                            {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                          </div>
                          <p className="text-sm text-gray-500">{n.message}</p>
                          <p className="mt-1 text-xs text-gray-400">{formatTime(n.createdAt)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </div>
    </DashboardLayout>
  );
}
