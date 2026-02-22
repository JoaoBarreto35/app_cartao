import { useEffect, useMemo, useState } from "react";
import type { Transaction, TransactionType } from "../../models/transaction";
import type { Category } from "../../models/category";
import type { TransactionClass } from "../../models/transactionClass";
import type { CreateTransactionInput, UpdateTransactionInput } from "../../services/transactionService.compat";

import { Button } from "../ui/Button/Button";
import { Field } from "../ui/Field/Field";
import { ErrorState } from "../ui/State/ErrorState";

import styles from "./TransactionModal.module.css";

type Mode = "create" | "view" | "edit";

type Props = {
  open: boolean;
  mode: Mode;

  workspaceId: string;
  categories: Category[];
  classes: TransactionClass[];

  initialTransaction?: Transaction | null;

  onClose: () => void;

  onCreate?: (input: CreateTransactionInput) => Promise<void>;
  onUpdate?: (transactionId: string, input: UpdateTransactionInput) => Promise<void>;
  onDelete?: (transactionId: string) => Promise<void>;
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAmountStringToNumber(s: string): number {
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function TransactionModal({
  open,
  mode,
  workspaceId,
  categories,
  classes,
  initialTransaction,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const readOnly = mode === "view";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<TransactionType>("single");
  const [installments, setInstallments] = useState<number>(2);
  const [startDate, setStartDate] = useState<string>(todayISO());
  const [endDate, setEndDate] = useState<string>("");

  // FKs opcionais
  const [categoryId, setCategoryId] = useState<string>(""); // "" => null
  const [classId, setClassId] = useState<string>(""); // "" => null

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showInstallments = type === "installment";
  const showEndDate = type === "recurring";

  useEffect(() => {
    if (!open) return;

    setError(null);
    setSaving(false);

    if (isCreate) {
      setDescription("");
      setAmount(0);
      setType("single");
      setInstallments(2);
      setStartDate(todayISO());
      setEndDate("");
      setCategoryId("");
      setClassId("");
      return;
    }

    const t = initialTransaction;
    if (!t) return;

    setDescription(t.description ?? "");
    setAmount(parseAmountStringToNumber(t.amount));
    setType(t.type);
    setInstallments(t.installments ?? 1);
    setStartDate(t.start_date ?? todayISO());
    setEndDate(t.end_date ?? "");
    setCategoryId(t.category_id ?? "");
    setClassId(t.class_id ?? "");
  }, [open, isCreate, initialTransaction]);

  const canSave = useMemo(() => {
    if (readOnly) return false;
    if (!description.trim()) return false;
    if (!Number.isFinite(amount) || amount <= 0) return false;
    if (!startDate) return false;
    if (showInstallments && (!Number.isInteger(installments) || installments <= 1)) return false;
    return true;
  }, [readOnly, description, amount, startDate, showInstallments, installments]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, saving, onClose]);

  if (!open) return null;

  const title = isCreate ? "Nova transação" : isEdit ? "Editar transação" : "Ver transação";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setError(null);

    const normalizedCategoryId = categoryId ? categoryId : null;
    const normalizedClassId = classId ? classId : null;

    try {
      if (isCreate) {
        if (!onCreate) throw new Error("Ação de criação não configurada.");

        const payload: CreateTransactionInput = {
          workspace_id: workspaceId,
          description: description.trim(),
          amount,
          type,
          start_date: startDate,
          ...(type === "installment" ? { installments } : {}),
          ...(type === "recurring" ? { end_date: endDate ? endDate : null } : { end_date: null }),
          category_id: normalizedCategoryId,
          class_id: normalizedClassId,
        };

        await onCreate(payload);
        onClose();
        return;
      }

      if (!initialTransaction?.id) throw new Error("Transação inválida.");
      if (!onUpdate) throw new Error("Ação de update não configurada.");

      const payload: UpdateTransactionInput = {
        description: description.trim(),
        amount,
        type,
        start_date: startDate,
        ...(type === "installment" ? { installments } : {}),
        ...(type === "recurring" ? { end_date: endDate ? endDate : null } : { end_date: null }),
        category_id: normalizedCategoryId,
        class_id: normalizedClassId,
      };

      await onUpdate(initialTransaction.id, payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!initialTransaction?.id) return;
    if (!onDelete) return;

    const ok = window.confirm("Excluir esta transação? Essa ação não pode ser desfeita.");
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      await onDelete(initialTransaction.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <form className={styles.modal} onSubmit={handleSubmit}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>
              {readOnly
                ? "Visualização somente leitura."
                : "Preencha os campos e salve. Campos opcionais ajudam a organizar."}
            </p>
          </div>

          <Button variant="ghost" type="button" onClick={onClose} disabled={saving} aria-label="Fechar">
            ✕
          </Button>
        </header>

        {error ? (
          <div className={styles.alert}>
            <ErrorState title="Não foi possível concluir" description={error} />
          </div>
        ) : null}

        <div className={styles.body}>
          <Field
            label="Descrição"
            as="input"
            inputProps={{
              value: description,
              onChange: (e) => setDescription(e.target.value),
              disabled: saving || readOnly,
              placeholder: "Ex: Mercado, Netflix, Gasolina…",
              autoFocus: true,
            }}
          />

          <div className={styles.grid2}>
            <Field
              label="Valor (R$)"
              as="input"
              inputProps={{
                type: "number",
                inputMode: "decimal",
                step: "0.01",
                value: Number.isFinite(amount) ? String(amount) : "0",
                onChange: (e) => setAmount(Number(e.target.value)),
                disabled: saving || readOnly,
                placeholder: "0,00",
              }}
            />

            <Field
              label="Tipo"
              as="select"
              selectProps={{
                value: type,
                onChange: (e) => setType(e.target.value as TransactionType),
                disabled: saving || readOnly,
              }}
            >
              <option value="single">Única</option>
              <option value="installment">Parcelada</option>
              <option value="recurring">Recorrente</option>
            </Field>
          </div>

          <div className={styles.grid2}>
            <Field
              label="Categoria"
              hint="Opcional"
              as="select"
              selectProps={{
                value: categoryId,
                onChange: (e) => setCategoryId(e.target.value),
                disabled: saving || readOnly,
              }}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Field>

            <Field
              label="Classe"
              hint="Opcional"
              as="select"
              selectProps={{
                value: classId,
                onChange: (e) => setClassId(e.target.value),
                disabled: saving || readOnly,
              }}
            >
              <option value="">Sem classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Field>
          </div>

          <div className={styles.grid2}>
            <Field
              label="Data inicial"
              as="input"
              inputProps={{
                type: "date",
                value: startDate,
                onChange: (e) => setStartDate(e.target.value),
                disabled: saving || readOnly,
              }}
            />

            {showInstallments ? (
              <Field
                label="Parcelas"
                as="input"
                inputProps={{
                  type: "number",
                  min: 2,
                  step: 1,
                  value: String(installments),
                  onChange: (e) => setInstallments(Number(e.target.value)),
                  disabled: saving || readOnly,
                }}
              />
            ) : (
              <div />
            )}
          </div>

          {showEndDate ? (
            <Field
              label="Data final"
              hint="Opcional"
              as="input"
              inputProps={{
                type: "date",
                value: endDate,
                onChange: (e) => setEndDate(e.target.value),
                disabled: saving || readOnly,
              }}
            />
          ) : null}
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            {isEdit && onDelete ? (
              <Button variant="danger" type="button" onClick={handleDelete} disabled={saving}>
                Excluir
              </Button>
            ) : null}
          </div>

          <div className={styles.footerRight}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
              {readOnly ? "Fechar" : "Cancelar"}
            </Button>

            {!readOnly ? (
              <Button type="submit" disabled={!canSave || saving} isLoading={saving}>
                Salvar
              </Button>
            ) : null}
          </div>
        </footer>
      </form>
    </div>
  );
}