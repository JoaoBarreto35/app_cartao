import { useCallback, useEffect, useState } from "react";
import type { WorkspaceRole } from "../../../services/transactionService.compat";
import { getMyWorkspaceRole, getWorkspaceById } from "../../../services/transactionService.compat";
import type { Workspace } from '../../../models/workspace';

type State = {
  workspace: Workspace | null;
  role: WorkspaceRole | null;
  loading: boolean;
  error: string | null;
};

export function useWorkspaceBootstrap(workspaceId: string | undefined) {
  const [state, setState] = useState<State>({
    workspace: null,
    role: null,
    loading: false,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (!workspaceId) return;

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      workspace: null,
      role: null,
    }));

    try {
      const [workspace, role] = await Promise.all([
        getWorkspaceById(workspaceId),
        getMyWorkspaceRole(workspaceId),
      ]);

      setState({
        workspace,
        role,
        loading: false,
        error: null,
      });
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
    if (!workspaceId) return;
    refetch();
  }, [workspaceId, refetch]);

  const noAccess = !state.loading && !state.role;

  return {
    ...state,
    noAccess,
    refetch,
  };
}