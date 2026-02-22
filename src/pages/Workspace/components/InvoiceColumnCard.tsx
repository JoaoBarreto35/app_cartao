import type { Transaction } from "../../../models/transaction";
import { Card } from "../../../components/ui/Card/Card";
import { Button } from "../../../components/ui/Button/Button";
import { LoadingState } from "../../../components/ui/State/LoadingState";
import { EmptyState } from "../../../components/ui/State/EmptyState";

import styles from "../Workspace.module.css";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Props = {
  title: string;
  loading: boolean;
  items: any[];
  total: number;

  canEdit: boolean;
  onCreate: () => void;

  transactions: Transaction[];
  categoryNameById: Map<string, string>;
  classNameById: Map<string, string>;
  onOpenTransaction: (tx: Transaction | null) => void;
};

function getTxId(item: any): string | null {
  const id = item?.transactionId ?? item?.transaction_id ?? null;
  return typeof id === "string" ? id : null;
}

function getInstallmentLabel(item: any): string {
  const kind = String(item?.kind ?? item?.type ?? "").toLowerCase();

  if (kind === "installment") {
    const idx = item?.installmentIndex ?? item?.installment_index;
    const total = item?.installments;
    if (Number.isFinite(Number(idx)) && Number.isFinite(Number(total))) {
      return `${idx} / ${total}`;
    }
  }

  if (kind === "recurring") {
    const openEnded = Boolean(item?.isOpenEnded ?? item?.is_open_ended);
    return openEnded ? "em aberto" : "recorrente";
  }

  if (kind === "single") return "única";
  return "";
}

export function InvoiceColumnCard(props: Props) {
  const {
    title,
    loading,
    items,
    total,
    canEdit,
    onCreate,
    transactions,
    categoryNameById,
    classNameById,
    onOpenTransaction,
  } = props;

  return (
    <Card
      title={title}
      subtitle={loading ? "Carregando…" : `${items.length} item(ns)`}
      right={<div className={styles.colTotal}>{brl.format(total)}</div>}
    >
      {loading ? (
        <LoadingState title="Carregando itens…" />
      ) : items.length === 0 ? (
        <EmptyState
          title={`Sem ${title.toLowerCase()}`}
          description={canEdit ? "Crie uma transação pra aparecer aqui." : "Nada pra mostrar."}
          action={canEdit ? <Button onClick={onCreate}>Nova transação</Button> : undefined}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((item: any) => {
            const txId = getTxId(item);
            const tx = txId ? transactions.find((t) => t.id === txId) ?? null : null;

            const catName = tx?.category_id ? categoryNameById.get(tx.category_id) ?? null : null;
            const clsName = tx?.class_id ? classNameById.get(tx.class_id) ?? null : null;

            const key = `${txId ?? "x"}-${item.kind ?? item.type}-${item.year ?? ""}-${item.month ?? item.invoice_month ?? ""}-${item.installmentIndex ?? item.installment_index ?? "x"}`;

            return (
              <li key={key}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => onOpenTransaction(tx)}
                  title={canEdit ? "Clique para ver/editar" : "Clique para ver"}
                >
                  <div className={styles.itemLeft}>
                    <div className={styles.itemTitle}>{item.description}</div>

                    <div className={styles.itemInstallments}>{getInstallmentLabel(item)}</div>

                    <div className={styles.itemMeta}>
                      {catName ? ` • ${catName}` : ""}
                      {clsName ? ` • ${clsName}` : ""}
                    </div>
                  </div>

                  <div className={styles.itemAmount}>{brl.format(item.amount)}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}