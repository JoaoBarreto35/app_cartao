import { useState } from "react";
import type { TransactionClass } from "../../../models/transactionClass";
import { createClass, deleteClass, updateClass } from "../../../services/transactionService.compat";
import { Button } from "../../../components/ui/Button/Button";
import { Card } from "../../../components/ui/Card/Card";
import { Field } from "../../../components/ui/Field/Field";
import styles from "../WorkspaceSettings.module.css";

type Props = {
  workspaceId: string;
  canEdit: boolean;
  classes: TransactionClass[];
  loading: boolean;
  onReload: () => Promise<void>;
  onAfterMutate?: () => Promise<void>;
  onError: (msg: string) => void;
};

export function ClassesSection({
  workspaceId,
  canEdit,
  classes,
  loading,
  onReload,
  onAfterMutate,
  onError,
}: Props) {
  const [newClassName, setNewClassName] = useState("");

  async function handleCreate() {
    if (!canEdit) return;
    const name = newClassName.trim();
    if (!name) return;

    try {
      await createClass(workspaceId, name);
      setNewClassName("");
      await onReload();
      if (onAfterMutate) await onAfterMutate();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao criar classe");
    }
  }

  async function handleRename(c: TransactionClass, name: string) {
    if (!canEdit) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === c.name) return;

    try {
      await updateClass(c.id, trimmed);
      await onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao renomear classe");
    }
  }

  async function handleDelete(c: TransactionClass) {
    if (!canEdit) return;
    const ok = window.confirm(`Excluir classe "${c.name}"?`);
    if (!ok) return;

    try {
      await deleteClass(c.id);
      await onReload();
      if (onAfterMutate) await onAfterMutate();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao excluir classe (pode estar em uso)");
    }
  }

  return (
    <Card title="Classes" subtitle={loading ? "carregando…" : `${classes.length} classe(s)`}>
      {canEdit ? (
        <div className={styles.row}>
          <Field
            label="Nova classe"
            as="input"
            inputProps={{
              placeholder: "Ex: Essencial",
              value: newClassName,
              onChange: (e) => setNewClassName(e.target.value),
            }}
          />
          <Button onClick={handleCreate} disabled={!newClassName.trim()}>
            Criar
          </Button>
        </div>
      ) : (
        <div className={styles.mutedSmall}>Você está em modo leitura.</div>
      )}

      <ul className={styles.simpleList}>
        {classes.map((c) => (
          <li key={c.id} className={styles.simpleRow}>
            <input
              className={styles.inlineInput}
              defaultValue={c.name}
              disabled={!canEdit}
              onBlur={(e) => handleRename(c, e.target.value)}
            />
            {canEdit ? (
              <Button variant="danger" size="sm" onClick={() => handleDelete(c)}>
                Excluir
              </Button>
            ) : null}
          </li>
        ))}

        {classes.length === 0 && !loading ? <li className={styles.mutedSmall}>Nenhuma classe ainda.</li> : null}
      </ul>
    </Card>
  );
}