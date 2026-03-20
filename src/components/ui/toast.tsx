"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore, type Notification } from "@/lib/store";

const styles: Record<Notification["type"], string> = {
  success: "border-green-500 bg-green-50 text-green-800",
  error: "border-red-500 bg-red-50 text-red-800",
  warning: "border-amber-500 bg-amber-50 text-amber-800",
  info: "border-blue-500 bg-blue-50 text-blue-800",
};

const icons: Record<Notification["type"], React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

function Toast({ notification, onDismiss }: { notification: Notification; onDismiss: () => void }) {
  const Icon = icons[notification.type];
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-md", styles[notification.type])}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold">{notification.title}</p>
        <p className="text-sm">{notification.message}</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ToastContainer() {
  const { notifications, markNotificationRead } = useStore();
  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    setVisible((prev) => [...new Set([...prev, ...unread])]);
  }, [notifications]);

  const dismiss = (id: string) => {
    setVisible((prev) => prev.filter((v) => v !== id));
    markNotificationRead(id);
  };

  const shown = notifications.filter((n) => visible.includes(n.id)).slice(0, 5);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
      {shown.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={() => dismiss(n.id)} />
      ))}
    </div>
  );
}

export { Toast, ToastContainer };
