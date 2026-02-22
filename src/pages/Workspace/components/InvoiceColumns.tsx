import type { Transaction } from "../../../models/transaction";
import { InvoiceColumnCard } from "./InvoiceColumnCard";

import styles from "../Workspace.module.css";

type Props = {
  loading: boolean;

  singleItems: any[];
  installmentItems: any[];
  recurringItems: any[];

  singleTotal: number;
  installmentTotal: number;
  recurringTotal: number;

  canEdit: boolean;
  onCreate: () => void;

  transactions: Transaction[];
  categoryNameById: Map<string, string>;
  classNameById: Map<string, string>;
  onOpenTransaction: (tx: Transaction | null) => void;
};

export function InvoiceColumns(props: Props) {
  const {
    loading,
    singleItems,
    installmentItems,
    recurringItems,
    singleTotal,
    installmentTotal,
    recurringTotal,
    canEdit,
    onCreate,
    transactions,
    categoryNameById,
    classNameById,
    onOpenTransaction,
  } = props;

  return (
    <div className={styles.columnsGrid}>
      <InvoiceColumnCard
        title="Avulsas"
        loading={loading}
        items={singleItems}
        total={singleTotal}
        canEdit={canEdit}
        onCreate={onCreate}
        transactions={transactions}
        categoryNameById={categoryNameById}
        classNameById={classNameById}
        onOpenTransaction={onOpenTransaction}
      />

      <InvoiceColumnCard
        title="Parceladas"
        loading={loading}
        items={installmentItems}
        total={installmentTotal}
        canEdit={canEdit}
        onCreate={onCreate}
        transactions={transactions}
        categoryNameById={categoryNameById}
        classNameById={classNameById}
        onOpenTransaction={onOpenTransaction}
      />

      <InvoiceColumnCard
        title="Recorrentes"
        loading={loading}
        items={recurringItems}
        total={recurringTotal}
        canEdit={canEdit}
        onCreate={onCreate}
        transactions={transactions}
        categoryNameById={categoryNameById}
        classNameById={classNameById}
        onOpenTransaction={onOpenTransaction}
      />
    </div>
  );
}