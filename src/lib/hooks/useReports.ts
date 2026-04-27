"use client";
import { useEffect, useState, useCallback } from "react";
import { reportService } from "@/lib/services/report.service";
import { useStore } from "@/lib/store";
import type { Report } from "@/lib/types";

export function useReports() {
  const { currentUser } = useStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    const result = currentUser.role === "admin"
      ? await reportService.listAll()
      : await reportService.listForFamily(currentUser.id);
    if (result.error) setError(String(result.error));
    else setReports(result.data ?? []);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { refresh(); }, [refresh]);

  return { reports, loading, error, refresh };
}
