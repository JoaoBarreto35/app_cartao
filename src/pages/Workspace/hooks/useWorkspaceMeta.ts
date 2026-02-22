import { useCallback, useEffect, useMemo, useState } from "react";
import type { Category } from "../../../models/category";
import type { TransactionClass } from "../../../models/transactionClass";
import { listCategoriesByWorkspace } 
from "../../../services/categoryService";

import { listClassesByWorkspace } 
from "../../../services/transactionClassService";
type State = {
  categories: Category[];
  classes: TransactionClass[];
  loading: boolean;
  error: string | null;
};

export function useWorkspaceMeta(workspaceId: string | undefined) {
  const [state, setState] = useState<State>({
    categories: [],
    classes: [],
    loading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!workspaceId) return;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      categories: [],
      classes: [],
    }));

    try {
      const [categories, classes] = await Promise.all([
        listCategoriesByWorkspace(workspaceId),
        listClassesByWorkspace(workspaceId),
      ]);

      setState({
        categories,
        classes,
        loading: false,
        error: null,
      });
    } catch (e) {
      setState({
        categories: [],
        classes: [],
        loading: false,
        error: e instanceof Error ? e.message : "Erro ao carregar categorias/classes",
      });
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    refetch();
  }, [workspaceId, refetch]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of state.categories) map.set(c.id, c.name);
    return map;
  }, [state.categories]);

  const classNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of state.classes) map.set(c.id, c.name);
    return map;
  }, [state.classes]);

  return {
    ...state,
    categoryNameById,
    classNameById,
    refetch,
  };
}