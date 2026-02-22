import { useCallback, useEffect, useState } from "react";
import type { Category } from "../../../models/category";
import { listCategoriesByWorkspace } from "../../../services/transactionService.compat";

export function useWorkspaceCategories(workspaceId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadCategories = useCallback(async () => {
    if (!workspaceId) return;

    setLoadingCategories(true);
    setError(null);
    try {
      const data = await listCategoriesByWorkspace(workspaceId);
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar categorias");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    reloadCategories();
  }, [reloadCategories]);

  return { categories, loadingCategories, error, setError, reloadCategories, setCategories };
}