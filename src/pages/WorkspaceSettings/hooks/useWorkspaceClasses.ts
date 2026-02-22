import { useCallback, useEffect, useState } from "react";
import type { TransactionClass } from "../../../models/transactionClass";
import { listClassesByWorkspace } from "../../../services/transactionService.compat";

export function useWorkspaceClasses(workspaceId?: string) {
  const [classes, setClasses] = useState<TransactionClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadClasses = useCallback(async () => {
    if (!workspaceId) return;

    setLoadingClasses(true);
    setError(null);
    try {
      const data = await listClassesByWorkspace(workspaceId);
      setClasses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar classes");
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    reloadClasses();
  }, [reloadClasses]);

  return { classes, loadingClasses, error, setError, reloadClasses, setClasses };
}