import { useMemo } from "react";
import type { Workspace } from "../../../models/workspace";
import { Card } from "../../../components/ui/Card/Card";
import { Button } from "../../../components/ui/Button/Button";
import styles from "../Workspace.module.css";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type Props = {
  workspace: Workspace | null;
  monthLabel: string;
  totals: {
    singleTotal: number;
    installmentTotal: number;
    recurringTotal: number;
    monthTotal: number;
  };
  onGoSettings: () => void;
  loading?: boolean;
};

export function WorkspaceSummary({ workspace, monthLabel, totals, onGoSettings, loading }: Props) {
  const limitInfo = useMemo(() => {
    const rawLimit = workspace?.credit_limit ?? null;
    const limit = rawLimit == null ? null : Number(rawLimit);
    const used = totals.monthTotal;

    if (!limit || !Number.isFinite(limit) || limit <= 0) {
      return {
        hasLimit: false as const,
        limit: null,
        used,
        remaining: null,
        usedPct: null,
        progress: 0,
        isOver: false,
      };
    }

    const remaining = limit - used;
    const usedPct = (used / limit) * 100;
    const progress = Math.max(0, Math.min(1, used / limit));
    const isOver = used > limit;

    return {
      hasLimit: true as const,
      limit,
      used,
      remaining,
      usedPct,
      progress,
      isOver,
    };
  }, [workspace?.credit_limit, totals.monthTotal]);

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
                  {brl.format(limitInfo.remaining ?? 0)}
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
                  {Math.round((limitInfo.usedPct ?? 0) * 10) / 10}% usado
                </span>
                {limitInfo.isOver ? <span className={styles.smallMuted}>— acima do limite</span> : null}
              </div>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={onGoSettings} disabled={loading}>
            Ir para Configurações
          </Button>
        )}
      </Card>
    </div>
  );
}