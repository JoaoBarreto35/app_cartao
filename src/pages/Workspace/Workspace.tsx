import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { calculateInvoiceForMonth, parseMonthInput } from "../../domain/invoiceCalculator";

import TransactionModal from "../../components/TransactionModal/TransactionModal";
import type { Transaction } from "../../models/transaction";


import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "../../services/transactionService.compat";

import { PageShell } from "../../components/layout/PageShell/PageShell";
import { Breadcrumbs } from "../../components/layout/Breadcrumbs/Breadcrumbs";
import { Field } from "../../components/ui/Field/Field";
import { Button } from "../../components/ui/Button/Button";
import { ErrorState } from "../../components/ui/State/ErrorState";
import { LoadingState } from "../../components/ui/State/LoadingState";
import { EmptyState } from "../../components/ui/State/EmptyState";

import { useWorkspaceBootstrap } from "./hooks/useWorkspaceBootstrap";
import { useWorkspaceMeta } from "./hooks/useWorkspaceMeta";
import { useTransactionsByMonth } from "./hooks/useTransactionsByMonth";

import { WorkspaceSummary } from "./components/WorkspaceSummary";
import { InvoiceColumns } from "./components/InvoiceColumns";

import styles from "./Workspace.module.css";

function getCurrentMonthValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

type InvoiceKind = "single" | "installment" | "recurring";

function getItemKind(item: any): InvoiceKind | null {
  const k = (item?.kind ?? item?.type ?? "").toString().toLowerCase();
  if (k === "single" || k === "installment" || k === "recurring") return k;
  return null;
}

function sumAmounts(items: any[]): number {
  return items.reduce((acc, it) => acc + (Number(it?.amount) || 0), 0);
}

export default function WorkspacePage() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit">("create");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const bootstrap = useWorkspaceBootstrap(workspaceId);
  const meta = useWorkspaceMeta(workspaceId);

  const canEdit = bootstrap.role === "admin";

  const tx = useTransactionsByMonth({
    workspaceId,
    role: bootstrap.role,
    month: selectedMonth,
    installmentLookbackMonths: 36,
  });

  const loadingHeader = bootstrap.loading || meta.loading;
  const noAccess = bootstrap.noAccess;

  const invoice = useMemo(() => {
    const { year, month } = parseMonthInput(selectedMonth);
    return calculateInvoiceForMonth(tx.transactions, year, month);
  }, [tx.transactions, selectedMonth]);

  const itemsByKind = useMemo(() => {
    const all = (invoice.items as any[]) ?? [];
    const single = all.filter((it) => getItemKind(it) === "single");
    const installment = all.filter((it) => getItemKind(it) === "installment");
    const recurring = all.filter((it) => getItemKind(it) === "recurring");
    return { single, installment, recurring };
  }, [invoice.items]);

  const totalsByKind = useMemo(() => {
    const singleTotal = sumAmounts(itemsByKind.single);
    const installmentTotal = sumAmounts(itemsByKind.installment);
    const recurringTotal = sumAmounts(itemsByKind.recurring);
    const monthTotal = singleTotal + installmentTotal + recurringTotal;
    return { singleTotal, installmentTotal, recurringTotal, monthTotal };
  }, [itemsByKind]);

  const limitInfo = useMemo(() => {
    const rawLimit = bootstrap.workspace?.credit_limit ?? null;
    const limit = rawLimit == null ? null : Number(rawLimit);
    const total = totalsByKind.monthTotal;

    if (!limit || !Number.isFinite(limit) || limit <= 0) {
      return {
        hasLimit: false as const,
        limit: null,
        used: total,
        remaining: null,
        usedPct: null,
        progress: 0,
        isOver: false as const,
      };
    }

    const remaining = limit - total;
    const usedPct = (total / limit) * 100;
    const progress = Math.max(0, Math.min(1, total / limit));
    const isOver = total > limit;

    return {
      hasLimit: true as const,
      limit,
      used: total,
      remaining,
      usedPct,
      progress,
      isOver,
    };
  }, [bootstrap.workspace?.credit_limit, totalsByKind.monthTotal]);

  async function handleCreate(input: CreateTransactionInput) {
    if (!workspaceId) return;

    if (!canEdit) return;

    await createTransaction(input);
    tx.invalidateMonth(selectedMonth);
    await tx.refetch();
  }

  async function handleUpdate(transactionId: string, input: UpdateTransactionInput) {
    if (!canEdit) return;

    await updateTransaction(transactionId, input);
    if (workspaceId) tx.invalidateMonth(selectedMonth);
    await tx.refetch();
  }

  async function handleDelete(transactionId: string) {
    if (!canEdit) return;

    await deleteTransaction(transactionId);
    if (workspaceId) tx.invalidateMonth(selectedMonth);
    await tx.refetch();
  }

  function openForCreate() {
    setModalMode("create");
    setSelectedTransaction(null);
    setModalOpen(true);
  }

  function openForTx(t: Transaction | null) {
    setSelectedTransaction(t);
    setModalMode(canEdit ? "edit" : "view");
    setModalOpen(true);
  }

  if (!workspaceId) {
    return (
      <div className={styles.fallback}>
        <ErrorState title="Workspace inválido" description="Não foi possível identificar o workspace pela URL." />
      </div>
    );
  }

  const headerRight = (
    <div className={styles.headerRight}>
      <Field
        label="Mês"
        as="input"
        inputProps={{
          type: "month",
          value: selectedMonth,
          onChange: (e) => setSelectedMonth(e.target.value),
          disabled: noAccess || bootstrap.loading,
        }}
      />

      <Button
        variant="secondary"
        onClick={() => navigate(`/workspace/${workspaceId}/settings`)}
        disabled={noAccess || loadingHeader || tx.loading}
      >
        Configurações
      </Button>

      {canEdit ? (
        <Button onClick={openForCreate} disabled={noAccess || loadingHeader || tx.loading}>
          Nova transação
        </Button>
      ) : (
        <Button variant="ghost" disabled title="Somente admin pode criar transações.">
          Nova transação
        </Button>
      )}
    </div>
  );

  const anyError = bootstrap.error || meta.error || tx.error;

  return (
    <PageShell
      title={bootstrap.workspace?.name ?? "Workspace"}
      subtitle={bootstrap.workspace ? `ID: ${bootstrap.workspace.id}` : undefined}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: bootstrap.loading ? "Carregando…" : bootstrap.workspace?.name ?? "Workspace" },
          ]}
        />
      }
      right={headerRight}
    >
      <div className={styles.stack}>
        <div className={styles.metaRow}>
          <span className={styles.badge}>
            {bootstrap.loading ? "verificando permissões…" : bootstrap.role ? `role: ${bootstrap.role}` : "sem acesso"}
          </span>
          <span className={styles.mutedSmall}>Mês selecionado: {selectedMonth}</span>
        </div>

        {anyError ? (
          <ErrorState
            title="Ocorreu um erro"
            description={anyError}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  bootstrap.refetch();
                  meta.refetch();
                  tx.refetch();
                }}
              >
                Tentar novamente
              </Button>
            }
          />
        ) : loadingHeader ? (
          <LoadingState title="Carregando workspace, permissões, categorias e classes…" />
        ) : noAccess ? (
          <EmptyState
            title="Sem acesso"
            description="Você não tem acesso a este workspace."
            action={
              <Button variant="secondary" onClick={() => navigate("/")}>
                Voltar para Home
              </Button>
            }
          />
        ) : null}

        {!noAccess && (
          <>
            <WorkspaceSummary
              monthLabel={monthLabel(invoice.month.year, invoice.month.month)}
              totals={totalsByKind}
              limitInfo={limitInfo}
              onGoSettings={() => navigate(`/workspace/${workspaceId}/settings`)}
            />

            <InvoiceColumns
              loading={tx.loading}
              singleItems={itemsByKind.single}
              installmentItems={itemsByKind.installment}
              recurringItems={itemsByKind.recurring}
              singleTotal={totalsByKind.singleTotal}
              installmentTotal={totalsByKind.installmentTotal}
              recurringTotal={totalsByKind.recurringTotal}
              canEdit={canEdit}
              onCreate={openForCreate}
              transactions={tx.transactions}
              categoryNameById={meta.categoryNameById}
              classNameById={meta.classNameById}
              onOpenTransaction={openForTx}
            />
          </>
        )}

        <TransactionModal
          open={modalOpen}
          mode={modalMode}
          workspaceId={workspaceId}
          categories={meta.categories}
          classes={meta.classes}
          initialTransaction={selectedTransaction}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </PageShell>
  );
}