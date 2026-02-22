import { useCallback, useEffect, useState } from "react";
import type {WorkspaceRole } from "../../../services/transactionService.compat";
import type {Workspace} from "../../../models/workspace"
import { getMyWorkspaceRole, getWorkspaceById } from "../../../services/transactionService.compat";

type State = {
  workspace: Workspace | null;
  role: WorkspaceRole | null;
  loading: boolean;
  error: string | null;
};

export function useWorkspaceHeader(workspaceId?: string) {
  const [state, setState] = useState<State>({
    workspace: null,
    role: null,
    loading: false,
    error: null,
  });

  const reload = useCallback(async () => {
    if (!workspaceId) return;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [w, r] = await Promise.all([getWorkspaceById(workspaceId), getMyWorkspaceRole(workspaceId)]);
      setState({ workspace: w, role: r, loading: false, error: null });
    } catch (e) {
      setState({
        workspace: null,
        role: null,
        loading: false,
        error: e instanceof Error ? e.message : "Erro ao carregar workspace",
      });
    }
  }, [workspaceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const canEdit = state.role === "admin";
  const noAccess = !state.loading && !state.role;

  return { ...state, canEdit, noAccess, reload };
}