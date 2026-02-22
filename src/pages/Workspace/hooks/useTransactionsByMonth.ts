import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Transaction } from "../../../models/transaction";
import type { MonthRange, WorkspaceRole } from "../../../services/transactionService.compat";
import { getMonthRange, listTransactionsForMonth } from "../../../services/transactionService.compat";

type Params = {
  workspaceId: string | undefined;
  role: WorkspaceRole | null;
  month: string; // "YYYY-MM"
  installmentLookbackMonths?: number; // default 36
};

type State = {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
};

export function useTransactionsByMonth(params: Params) {
  const { workspaceId, role, month, installmentLookbackMonths = 36 } = params;

  const [state, setState] = useState<State>({
    transactions: [],
    loading: false,
    error: null,
  });

  // key = `${workspaceId}|${YYYY-MM}`
  const cacheRef = useRef<Record<string, Transaction[]>>({});

  const cacheKey = useCallback((wsId: string, m: string) => `${wsId}|${m}`, []);

  const invalidateMonth = useCallback(
    (wsId: string, m: string) => {
      delete cacheRef.current[cacheKey(wsId, m)];
    },
    [cacheKey]
  );

  const clearWorkspaceCache = useCallback(
    (wsId: string) => {
      const prefix = `${wsId}|`;
      for (const key of Object.keys(cacheRef.current)) {
        if (key.startsWith(prefix)) delete cacheRef.current[key];
      }
    },
    []
  );

  const fetchMonth = useCallback(
    async (opts: { preferCache: boolean }) => {
      if (!workspaceId) return;
      if (!role) return;

      const key = cacheKey(workspaceId, month);

      if (opts.preferCache && cacheRef.current[key]) {
        setState((prev) => ({
          ...prev,
          transactions: cacheRef.current[key],
          error: null,
        }));
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const range: MonthRange = getMonthRange(month);
        const data = await listTransactionsForMonth(workspaceId, range, {
          installmentLookbackMonths,
        });

        cacheRef.current[key] = data;
        setState({ transactions: data, loading: false, error: null });
      } catch (e) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e.message : "Erro ao carregar transações",
        }));
      }
    },
    [workspaceId, role, month, installmentLookbackMonths, cacheKey]
  );

  // quando trocar de workspace, limpa cache daquele workspace (evita leak)
  useEffect(() => {
    if (!workspaceId) return;
    clearWorkspaceCache(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // quando tiver role + month, busca
  useEffect(() => {
    if (!workspaceId) return;
    if (!role) return;
    fetchMonth({ preferCache: true });
  }, [workspaceId, role, month, fetchMonth]);

  const api = useMemo(() => {
    return {
      refetch: () => fetchMonth({ preferCache: false }),
      preferCache: () => fetchMonth({ preferCache: true }),
      invalidateMonth: (m: string) => {
        if (!workspaceId) return;
        invalidateMonth(workspaceId, m);
      },
    };
  }, [fetchMonth, invalidateMonth, workspaceId]);

  return {
    ...state,
    ...api,
  };
}