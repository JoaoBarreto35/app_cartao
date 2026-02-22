import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import { listWorkspaces } from "../../services/workspaceService";
import { listWorkspaceMembers, type WorkspaceMember } from "../../services/workspaceMemberService";

import { PageShell } from "../../components/layout/PageShell/PageShell";
import { Card } from "../../components/ui/Card/Card";
import { Field } from "../../components/ui/Field/Field";
import { Button } from "../../components/ui/Button/Button";
import { ErrorState } from "../../components/ui/State/ErrorState";
import { LoadingState } from "../../components/ui/State/LoadingState";
import { EmptyState } from "../../components/ui/State/EmptyState";

import styles from "./Home.module.css";

type Workspace = {
  id: string;
  name: string;
  created_at: string;
};

export default function HomePage() {
  const navigate = useNavigate();

  const [meLoading, setMeLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);

  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState<"admin" | "viewer" | null>(null);

  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId) ?? null,
    [workspaces, selectedWorkspaceId]
  );

  async function loadMe() {
    setMeLoading(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw new Error(error.message);

      setUserEmail(data.user?.email ?? null);
      setUserId(data.user?.id ?? null);
    } finally {
      setMeLoading(false);
    }
  }

  async function loadWorkspacesSafe(selectFirst: boolean) {
    setLoadingWorkspaces(true);
    setError(null);

    try {
      const ws = (await listWorkspaces()) as unknown as Workspace[];
      setWorkspaces(ws);

      if (selectFirst) {
        setSelectedWorkspaceId(ws[0]?.id ?? null);
      } else {
        setSelectedWorkspaceId((prev) => (prev && ws.some((w) => w.id === prev) ? prev : ws[0]?.id ?? null));
      }
    } catch (e) {
      setWorkspaces([]);
      setSelectedWorkspaceId(null);
      setError(e instanceof Error ? e.message : "Erro listando workspaces");
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  async function loadMembersSafe(workspaceId: string, currentUserId: string | null) {
    setMembersLoading(true);
    setError(null);

    try {
      const rows = await listWorkspaceMembers(workspaceId);
      setMembers(rows);

      if (currentUserId) {
        const mine = rows.find((m) => m.user_id === currentUserId);
        setMyRole(mine?.role ?? null);
      } else {
        setMyRole(null);
      }
    } catch (e) {
      setMembers([]);
      setMyRole(null);
      setError(e instanceof Error ? e.message : "Erro listando membros");
    } finally {
      setMembersLoading(false);
    }
  }

  async function createWorkspace() {
    const name = newWorkspaceName.trim();
    if (!name) return;

    setCreatingWorkspace(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc("create_workspace", { p_name: name });
      if (error) throw new Error(error.message);

      setNewWorkspaceName("");

      // recarrega lista sem perder seleção
      await loadWorkspacesSafe(false);

      // se RPC retornar o ID, seleciona e carrega membros
      if (typeof data === "string") {
        setSelectedWorkspaceId(data);
        await loadMembersSafe(data, userId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro criando workspace");
    } finally {
      setCreatingWorkspace(false);
    }
  }

  function openSelectedWorkspace() {
    if (!selectedWorkspaceId) return;
    navigate(`/workspace/${selectedWorkspaceId}`);
  }

  async function signOut() {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  // init
  useEffect(() => {
    (async () => {
      await loadMe();
      await loadWorkspacesSafe(true);
    })();

  }, []);

  // members when selection changes
  useEffect(() => {
    if (!selectedWorkspaceId) {
      setMembers([]);
      setMyRole(null);
      return;
    }
    loadMembersSafe(selectedWorkspaceId, userId);

  }, [selectedWorkspaceId, userId]);

  const headerRight = (
    <div className={styles.headerRight}>
      <Button variant="secondary" onClick={() => loadWorkspacesSafe(false)} disabled={loadingWorkspaces || creatingWorkspace}>
        Recarregar
      </Button>

      <Button onClick={openSelectedWorkspace} disabled={!selectedWorkspaceId || loadingWorkspaces}>
        Abrir
      </Button>

      <Button variant="ghost" onClick={signOut} disabled={meLoading}>
        Sair
      </Button>
    </div>
  );

  const subtitle = meLoading
    ? "Carregando usuário…"
    : userEmail
      ? `Logado como ${userEmail}`
      : "Sem sessão";

  return (
    <PageShell title="Home" subtitle={subtitle} right={headerRight}>
      <div className={styles.stack}>
        {error ? (
          <ErrorState
            title="Ocorreu um erro"
            description={error}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setError(null);
                  loadWorkspacesSafe(false);
                  if (selectedWorkspaceId) loadMembersSafe(selectedWorkspaceId, userId);
                }}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : null}

        <div className={styles.grid}>
          {/* Workspaces */}
          <Card
            title="Seus workspaces"
            subtitle={loadingWorkspaces ? "carregando…" : `${workspaces.length} workspace(s)`}
            right={
              <div className={styles.rolePillWrap}>
                {selectedWorkspace ? (
                  <span className={styles.rolePill}>
                    {myRole ? `role: ${myRole}` : "role: —"}
                  </span>
                ) : null}
              </div>
            }
          >
            <div className={styles.createRow}>
              <Field
                label="Novo workspace"
                as="input"
                inputProps={{
                  placeholder: "Ex: Casa, Família, Cartão principal…",
                  value: newWorkspaceName,
                  onChange: (e) => setNewWorkspaceName(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") createWorkspace();
                  },
                  disabled: creatingWorkspace,
                }}
              />
              <Button onClick={createWorkspace} disabled={!newWorkspaceName.trim() || creatingWorkspace}>
                {creatingWorkspace ? "Criando…" : "Criar"}
              </Button>
            </div>

            {loadingWorkspaces ? (
              <LoadingState title="Carregando workspaces…" />
            ) : workspaces.length === 0 ? (
              <EmptyState title="Nenhum workspace" description="Crie seu primeiro workspace para começar." />
            ) : (
              <ul className={styles.wsList}>
                {workspaces.map((w) => {
                  const active = w.id === selectedWorkspaceId;
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        className={[styles.wsItem, active ? styles.wsItemActive : ""].join(" ")}
                        onClick={() => setSelectedWorkspaceId(w.id)}
                      >
                        <div className={styles.wsTop}>
                          <span className={styles.wsName}>{w.name}</span>
                          {active ? <span className={styles.wsSelected}>selecionado</span> : null}
                        </div>
                        {/* sem debug: id fica “suave” */}
                        <div className={styles.wsId}>{w.id}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Members */}
          <Card
            title="Membros"
            subtitle={!selectedWorkspace ? "Selecione um workspace para ver os membros" : `${members.length} membro(s)`}
            right={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => selectedWorkspaceId && loadMembersSafe(selectedWorkspaceId, userId)}
                disabled={!selectedWorkspaceId || membersLoading}
              >
                {membersLoading ? "Atualizando…" : "Atualizar"}
              </Button>
            }
          >
            {!selectedWorkspace ? (
              <EmptyState title="Nada selecionado" description="Escolha um workspace ao lado para ver os membros." />
            ) : membersLoading ? (
              <LoadingState title="Carregando membros…" />
            ) : members.length === 0 ? (
              <EmptyState title="Sem membros" description="Nenhum membro retornou para este workspace." />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Usuário</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className={styles.mono}>
                          {m.user_id === userId ? <span className={styles.meTag}>você</span> : null}
                          {m.user_id}
                        </td>
                        <td>{m.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}