import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { Category } from "../../../models/category";
import type { Transaction } from "../../../models/transaction";
import type { TransactionClass } from "../../../models/transactionClass";
import type { CreateTransactionInput } from "../../../services/transactionService.compat";

import {
  createCategory,
  createClass,
  createTransaction,
  getWorkspaceById,
  listCategoriesByWorkspace,
  listClassesByWorkspace,
  // ⚠️ precisa existir no service (veja nota abaixo)
  listTransactionsByWorkspace,
} from "../../../services/transactionService.compat";

import { Button } from "../../../components/ui/Button/Button";
import { Card } from "../../../components/ui/Card/Card";
import { EmptyState } from "../../../components/ui/State/EmptyState";

import type { ImportPreview } from "../lib/importExport.types";
import { buildImportPreviewFromFile } from "../lib/importExport.xlsx";
import { chunk, normalizeName } from "../lib/importExport.utils";
import styles from "../WorkspaceSettings.module.css";

type Props = {
  workspaceId: string;
  role: "admin" | "viewer" | null;
  canEdit: boolean;

  onReloadAll: () => Promise<void>; // reload categories+classes+tx
  onError: (msg: string) => void;
};

export function ExcelDataSection({ workspaceId, role, canEdit, onReloadAll, onError }: Props) {
  const [exporting, setExporting] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleExportXlsx() {
    if (!workspaceId || !role) return;

    setExporting(true);
    try {
      const [w, cats, cls, allTx] = await Promise.all([
        getWorkspaceById(workspaceId),
        listCategoriesByWorkspace(workspaceId),
        listClassesByWorkspace(workspaceId),
        listTransactionsByWorkspace(workspaceId),
      ]);

      const catById = new Map<string, string>();
      cats.forEach((c) => catById.set(c.id, c.name));

      const classById = new Map<string, string>();
      cls.forEach((c) => classById.set(c.id, c.name));

      const wb = XLSX.utils.book_new();

      const wsWorkspace = XLSX.utils.json_to_sheet([
        {
          name: w?.name ?? "",
          credit_limit: w?.credit_limit ? Number(w.credit_limit) : "",
        },
      ]);
      XLSX.utils.book_append_sheet(wb, wsWorkspace, "workspace");

      const wsCategories = XLSX.utils.json_to_sheet(cats.map((c) => ({ name: c.name })));
      XLSX.utils.book_append_sheet(wb, wsCategories, "categories");

      const wsClasses = XLSX.utils.json_to_sheet(cls.map((c) => ({ name: c.name })));
      XLSX.utils.book_append_sheet(wb, wsClasses, "classes");

      const wsTransactions = XLSX.utils.json_to_sheet(
        (allTx as Transaction[]).map((t) => ({
          description: t.description,
          amount: Number(t.amount),
          type: t.type,
          installments: t.installments ?? 1,
          start_date: t.start_date,
          end_date: t.end_date ?? "",
          category: t.category_id ? catById.get(t.category_id) ?? "" : "",
          class: t.class_id ? classById.get(t.class_id) ?? "" : "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsTransactions, "transactions");

      const safeName = (w?.name ?? "workspace").replace(/[^\w\d-_ ]+/g, "").trim() || "workspace";
      const filename = `export-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao exportar");
    } finally {
      setExporting(false);
    }
  }

  async function onPickImportFile(file: File) {
    setImportPreview(null);
    try {
      const preview = await buildImportPreviewFromFile(file);
      setImportPreview(preview);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao ler arquivo");
    }
  }

  async function handleConfirmImport() {
    if (!canEdit) {
      onError("Somente admin pode importar.");
      return;
    }
    if (!importPreview) return;

    if (importPreview.errors.length > 0) {
      onError("Corrija os erros antes de importar.");
      return;
    }

    setImporting(true);
    try {
      const existingCats = await listCategoriesByWorkspace(workspaceId);
      const existingClasses = await listClassesByWorkspace(workspaceId);

      const catByName = new Map<string, Category>();
      existingCats.forEach((c) => catByName.set(normalizeName(c.name), c));

      const classByName = new Map<string, TransactionClass>();
      existingClasses.forEach((c) => classByName.set(normalizeName(c.name), c));

      for (const nm of importPreview.categories) {
        const key = normalizeName(nm);
        if (!catByName.has(key)) {
          const created = await createCategory(workspaceId, nm);
          catByName.set(key, created);
        }
      }

      for (const nm of importPreview.classes) {
        const key = normalizeName(nm);
        if (!classByName.has(key)) {
          const created = await createClass(workspaceId, nm);
          classByName.set(key, created);
        }
      }

      const payloads: CreateTransactionInput[] = importPreview.transactions.map((t) => {
        const category_id = t.category ? catByName.get(normalizeName(t.category))?.id ?? null : null;
        const class_id = t.class ? classByName.get(normalizeName(t.class))?.id ?? null : null;

        return {
          workspace_id: workspaceId,
          description: t.description.trim(),
          amount: t.amount,
          type: t.type,
          start_date: t.start_date,
          end_date: t.type === "recurring" ? t.end_date ?? null : null,
          ...(t.type === "installment" ? { installments: t.installments ?? 2 } : {}),
          category_id,
          class_id,
        };
      });

      const batches = chunk(payloads, 200);
      for (const batch of batches) {
        for (const item of batch) {
          await createTransaction(item);
        }
      }

      await onReloadAll();

      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("Importação concluída ✅");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card
      title="Dados (Excel)"
      subtitle="Exporta/importa categorias, classes e transações"
      right={
        <div className={styles.row}>
          <Button variant="secondary" onClick={handleExportXlsx} disabled={exporting || !role}>
            {exporting ? "Exportando…" : "Exportar .xlsx"}
          </Button>

          <label className={styles.fileLabel}>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept=".xlsx,.xls"
              disabled={!canEdit || importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickImportFile(file);
              }}
            />
            <span className={styles.fileFakeBtn}>{canEdit ? "Selecionar arquivo…" : "Import (admin)"}</span>
          </label>
        </div>
      }
    >
      {!canEdit ? <div className={styles.mutedSmall}>Somente admin pode importar.</div> : null}

      {importPreview ? (
        <div className={styles.preview}>
          <div className={styles.previewTitle}>Pré-visualização</div>

          <div className={styles.previewStats}>
            <div>
              • Categorias no arquivo: <b>{importPreview.categories.length}</b>
            </div>
            <div>
              • Classes no arquivo: <b>{importPreview.classes.length}</b>
            </div>
            <div>
              • Transações no arquivo: <b>{importPreview.transactions.length}</b>
            </div>
          </div>

          {importPreview.errors.length > 0 ? (
            <div className={styles.previewErrors}>
              <div className={styles.previewErrorsTitle}>Erros ({importPreview.errors.length})</div>
              <ul className={styles.previewErrorsList}>
                {importPreview.errors.slice(0, 12).map((er, i) => (
                  <li key={i}>{er}</li>
                ))}
              </ul>
              {importPreview.errors.length > 12 ? (
                <div className={styles.mutedSmall}>…e mais {importPreview.errors.length - 12} erros.</div>
              ) : null}
            </div>
          ) : (
            <div className={styles.row}>
              <Button onClick={handleConfirmImport} disabled={!canEdit || importing}>
                {importing ? "Importando…" : "Confirmar importação"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setImportPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={importing}
              >
                Cancelar
              </Button>
              <span className={styles.mutedSmall}>
                Dica: aba <b>transactions</b> usa <b>category</b> e <b>class</b> por nome.
              </span>
            </div>
          )}
        </div>
      ) : (
        <EmptyState title="Sem arquivo selecionado" description="Selecione um arquivo para ver o preview antes de importar." />
      )}
    </Card>
  );
}