import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { PageShell } from "../../components/layout/PageShell/PageShell";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs/Breadcrumbs";
import { Button } from "../../components/ui/Button/Button";
import { ErrorState } from "../../components/ui/State/ErrorState";
import { LoadingState } from "../../components/ui/State/LoadingState";
import { EmptyState } from "../../components/ui/State/EmptyState";

import { useWorkspaceHeader } from "./hooks/useWorkspaceHeader";
import { useWorkspaceCategories } from "./hooks/useWorkspaceCategories";
import { useWorkspaceClasses } from "./hooks/useWorkspaceClasses";
import { useWorkspaceTxForMonth } from "./hooks/useWorkspaceTxForMonth";

import { ExcelDataSection } from "./sections/ExcelDataSection";
import { CategoriesSection } from "./sections/CategoriesSection";
import { ClassesSection } from "./sections/ClassesSection";


import styles from "./WorkspaceSettings.module.css";

function getCurrentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function WorkspaceSettingsPage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();

  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedMonth] = useState(getCurrentMonthValue());

  const header = useWorkspaceHeader(workspaceId);
  const cats = useWorkspaceCategories(workspaceId);
  const cls = useWorkspaceClasses(workspaceId);

  const txMonth = useWorkspaceTxForMonth({
    workspaceId,
    role: header.role,
    selectedMonth,
  });

  function setError(msg: string) {
    setPageError(msg);
  }

  async function reloadAll() {
    await Promise.all([cats.reloadCategories(), cls.reloadClasses(), txMonth.reloadTx()]);
  }

  if (!workspaceId) {
    return (
      <div className={styles.fallback}>
        <ErrorState title="Workspace inválido" description="Não foi possível identificar o workspace pela URL." />
      </div>
    );
  }

  return (
    <PageShell
      title="Configurações"
      subtitle={header.workspace?.name ?? "—"}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: header.workspace?.name ?? "Workspace", to: `/workspace/${workspaceId}` },
            { label: "Configurações" },
          ]}
        />
      }
      right={
        <div className={styles.headerRight}>
          <span className={styles.badge}>
            {header.loading ? "carregando…" : header.role ? `role: ${header.role}` : "sem acesso"}
          </span>
          <Button variant="secondary" onClick={() => navigate(`/workspace/${workspaceId}`)} disabled={header.loading}>
            Voltar
          </Button>
        </div>
      }
    >
      <div className={styles.stack}>
        {pageError ? (
          <ErrorState
            title="Ocorreu um erro"
            description={pageError}
            action={
              <Button variant="secondary" onClick={() => setPageError(null)}>
                OK
              </Button>
            }
          />
        ) : null}

        {header.loading && !pageError ? <LoadingState title="Carregando workspace e permissões…" /> : null}

        {header.noAccess && !header.loading && !pageError ? (
          <EmptyState
            title="Sem acesso"
            description="Você não tem acesso a este workspace."
            action={
              <Button variant="secondary" onClick={() => navigate("/")}>
                Voltar
              </Button>
            }
          />
        ) : null}

        {!header.noAccess ? (
          <>
            <ExcelDataSection
              workspaceId={workspaceId}
              role={header.role}
              canEdit={header.canEdit}
              onReloadAll={reloadAll}
              onError={setError}
            />

            <div className={styles.grid2}>
              <CategoriesSection
                workspaceId={workspaceId}
                canEdit={header.canEdit}
                categories={cats.categories}
                loading={cats.loadingCategories}
                onReload={cats.reloadCategories}
                onAfterMutate={txMonth.reloadTx}
                onError={setError}
              />
              <ClassesSection
                workspaceId={workspaceId}
                canEdit={header.canEdit}
                classes={cls.classes}
                loading={cls.loadingClasses}
                onReload={cls.reloadClasses}
                onAfterMutate={txMonth.reloadTx}
                onError={setError}
              />

            </div>

          </>
        ) : null}
      </div>
    </PageShell>
  );
}