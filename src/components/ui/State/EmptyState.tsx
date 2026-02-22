import React from "react";
import styles from "./State.module.css";

export function EmptyState({
  title = "Nada por aqui",
  description = "Não encontramos itens para mostrar.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.box}>
      <p className={styles.title}>{title}</p>
      <p className={styles.desc}>{description}</p>
      {action ? <div className={styles.actions}>{action}</div> : null}
    </div>
  );
}