"use client";
import { useEffect, useState, useCallback } from "react";
import { auditService } from "@/lib/services/audit.service";
import { useStore } from "@/lib/store";
import type { Audit } from "@/lib/types";

export function useAudits() {
  const { currentUser } = useStore();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    let result: { data: Audit[] | null; error: unknown };
    if (currentUser.role === "assessor") {
      result = await auditService.listForAssessor(currentUser.id);
    } else if (currentUser.role === "admin") {
      result = await auditService.listAll();
    } else {
      result = await auditService.listForFamily(currentUser.id);
    }
    if (result.error) setError(String(result.error));
    else setAudits(result.data ?? []);
    setLoading(false);
  }, [currentUser]);

  useEffect(() => { refresh(); }, [refresh]);

  return { audits, loading, error, refresh };
}
