import { useCallback, useEffect, useMemo, useState } from "react";
import type { Transaction } from "../../../models/transaction";
import type { WorkspaceRole } from "../../../services/transactionService.compat";
import { getMonthRange, listTransactionsForMonth } from "../../../services/transactionService.compat";

export function useWorkspaceTxForMonth(args: {
  workspaceId?: string;
  role: WorkspaceRole | null;
  selectedMonth: string;
}) {
  const { workspaceId, role, selectedMonth } = args;

  const [tx, setTx] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = useMemo(() => Boolean(workspaceId && role), [workspaceId, role]);

  const reloadTx = useCallback(async () => {
    if (!workspaceId || !role) return;

    setLoadingTx(true);
    setError(null);
    try {
      const range = getMonthRange(selectedMonth);
      const data = await listTransactionsForMonth(workspaceId, range, { installmentLookbackMonths: 36 });
      setTx(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar transações");
      setTx([]);
    } finally {
      setLoadingTx(false);
    }
  }, [workspaceId, role, selectedMonth]);

  useEffect(() => {
    if (!enabled) return;
    reloadTx();
  }, [enabled, reloadTx]);

  return { tx, setTx, loadingTx, error, setError, reloadTx };
}