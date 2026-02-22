
import { Card } from "../../../components/ui/Card/Card";
import { Button } from "../../../components/ui/Button/Button";
import { EmptyState } from "../../../components/ui/State/EmptyState";

import styles from "../Workspace.module.css";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export type TotalsByKind = {
  singleTotal: number;
  installmentTotal: number;
  recurringTotal: number;
  monthTotal: number;
};

export type LimitInfo =
  | {
    hasLimit: false;
    limit: null;
    used: number;
    remaining: null;
    usedPct: null;
    progress: number;
    isOver: false;
  }
  | {
    hasLimit: true;
    limit: number;
    used: number;
    remaining: number;
    usedPct: number;
    progress: number;
    isOver: boolean;
  };

type Props = {
  monthLabel: string;
  totals: TotalsByKind;
  limitInfo: LimitInfo;
  onGoSettings: () => void;
};

export function WorkspaceSummary({ monthLabel, totals, limitInfo, onGoSettings }: Props) {
  return (
    <div className={styles.summaryGrid}>
      <Card
        title={`Total do mês (${monthLabel})`}
        subtitle="Somatório de avulsas + parceladas + recorrentes"
        right={<div className={styles.totalBig}>{brl.format(totals.monthTotal)}</div>}
      >
        <div className={styles.summarySplit}>
          <div className={styles.summaryLine}>
            <span className={styles.kpiLabel}>Avulsas</span>
            <span className={styles.kpiValue}>{brl.format(totals.singleTotal)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span className={styles.kpiLabel}>Parceladas</span>
            <span className={styles.kpiValue}>{brl.format(totals.installmentTotal)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span className={styles.kpiLabel}>Recorrentes</span>
            <span className={styles.kpiValue}>{brl.format(totals.recurringTotal)}</span>
          </div>
        </div>
      </Card>

      <Card
        title="Limite"
        subtitle={limitInfo.hasLimit ? "Uso do limite do cartão neste mês" : "Defina um limite no workspace (opcional)"}
      >
        {limitInfo.hasLimit ? (
          <div className={styles.limitBox}>
            <div className={styles.limitTop}>
              <div className={styles.limitStat}>
                <span className={styles.kpiLabel}>Limite</span>
                <span className={styles.kpiValue}>{brl.format(limitInfo.limit)}</span>
              </div>
              <div className={styles.limitStat}>
                <span className={styles.kpiLabel}>Usado</span>
                <span className={styles.kpiValue}>{brl.format(limitInfo.used)}</span>
              </div>
              <div className={styles.limitStat}>
                <span className={styles.kpiLabel}>Sobrando</span>
                <span className={[styles.kpiValue, limitInfo.isOver ? styles.dangerText : ""].join(" ")}>
                  {brl.format(limitInfo.remaining)}
                </span>
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTrack} aria-label="Uso do limite">
                <div
                  className={[styles.progressFill, limitInfo.isOver ? styles.progressOver : ""].join(" ")}
                  style={{ width: `${Math.min(100, Math.max(0, limitInfo.progress * 100))}%` }}
                />
              </div>

              <div className={styles.progressMeta}>
                <span className={[styles.pct, limitInfo.isOver ? styles.dangerText : ""].join(" ")}>
                  {Math.round(limitInfo.usedPct * 10) / 10}% usado
                </span>
                {limitInfo.isOver ? <span className={styles.smallMuted}>— acima do limite</span> : null}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Sem limite configurado"
            description="Se você definir o limite do cartão no workspace, eu mostro a barra e o quanto sobra."
            action={
              <Button variant="secondary" onClick={onGoSettings}>
                Ir para Configurações
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}