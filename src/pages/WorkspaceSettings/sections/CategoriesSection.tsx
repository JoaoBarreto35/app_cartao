import { useState } from "react";
import type { Category } from "../../../models/category";
import { createCategory, deleteCategory, updateCategory } from "../../../services/transactionService.compat";
import { Button } from "../../../components/ui/Button/Button";
import { Card } from "../../../components/ui/Card/Card";
import { Field } from "../../../components/ui/Field/Field";
import styles from "../WorkspaceSettings.module.css";

type Props = {
  workspaceId: string;
  canEdit: boolean;
  categories: Category[];
  loading: boolean;
  onReload: () => Promise<void>;
  onAfterMutate?: () => Promise<void>; // ex: recarregar tx
  onError: (msg: string) => void;
};

export function CategoriesSection({
  workspaceId,
  canEdit,
  categories,
  loading,
  onReload,
  onAfterMutate,
  onError,
}: Props) {
  const [newCatName, setNewCatName] = useState("");

  async function handleCreate() {
    if (!canEdit) return;
    const name = newCatName.trim();
    if (!name) return;

    try {
      await createCategory(workspaceId, name);
      setNewCatName("");
      await onReload();
      if (onAfterMutate) await onAfterMutate();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao criar categoria");
    }
  }

  async function handleRename(cat: Category, name: string) {
    if (!canEdit) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) return;

    try {
      await updateCategory(cat.id, trimmed);
      await onReload();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao renomear categoria");
    }
  }

  async function handleDelete(cat: Category) {
    if (!canEdit) return;
    const ok = window.confirm(`Excluir categoria "${cat.name}"?`);
    if (!ok) return;

    try {
      await deleteCategory(cat.id);
      await onReload();
      if (onAfterMutate) await onAfterMutate();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao excluir categoria (pode estar em uso)");
    }
  }

  return (
    <Card title="Categorias" subtitle={loading ? "carregando…" : `${categories.length} categoria(s)`}>
      {canEdit ? (
        <div className={styles.row}>
          <Field
            label="Nova categoria"
            as="input"
            inputProps={{
              placeholder: "Ex: Mercado",
              value: newCatName,
              onChange: (e) => setNewCatName(e.target.value),
            }}
          />
          <Button onClick={handleCreate} disabled={!newCatName.trim()}>
            Criar
          </Button>
        </div>
      ) : (
        <div className={styles.mutedSmall}>Você está em modo leitura.</div>
      )}

      <ul className={styles.simpleList}>
        {categories.map((c) => (
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

        {categories.length === 0 && !loading ? (
          <li className={styles.mutedSmall}>Nenhuma categoria ainda.</li>
        ) : null}
      </ul>
    </Card>
  );
}