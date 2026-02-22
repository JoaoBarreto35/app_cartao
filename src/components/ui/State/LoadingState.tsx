import styles from "./State.module.css";

export function LoadingState({ title = "Carregando..." }: { title?: string }) {
  return (
    <div className={styles.box} aria-busy="true">
      <p className={styles.title}>{title}</p>
      <p className={styles.desc}>Só um instante.</p>
    </div>
  );
}