import React from "react";
import styles from "./State.module.css";

export function ErrorState({
  title = "Deu ruim",
  description = "Ocorreu um erro. Tente novamente.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>{title}</p>
      <p className={styles.desc}>{description}</p>
      {action ? <div className={styles.actions}>{action}</div> : null}
    </div>
  );
}