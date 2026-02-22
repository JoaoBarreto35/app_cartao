import * as XLSX from "xlsx";
import type { ImportPreview, ImportRowTx } from "./importExport.types";
import { isISODate, normalizeName } from "./importExport.utils";

function readSheetJson(wb: XLSX.WorkBook, sheetName: string) {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
}

export function buildImportPreviewFromWorkbook(wb: XLSX.WorkBook): ImportPreview {
  const errors: string[] = [];

  const ws = readSheetJson(wb, "workspace");
  const categoriesSheet = readSheetJson(wb, "categories");
  const classesSheet = readSheetJson(wb, "classes");
  const txSheet = readSheetJson(wb, "transactions");

  const preview: ImportPreview = {
    workspace: undefined,
    categories: [],
    classes: [],
    transactions: [],
    errors,
  };

  if (ws.length > 0) {
    const row = ws[0] ?? {};
    const name = String((row as any).name ?? "").trim();
    const creditLimitRaw = (row as any).credit_limit ?? "";
    const credit_limit = creditLimitRaw === "" ? null : Number(String(creditLimitRaw).replace(",", "."));

    preview.workspace = {
      name: name || undefined,
      credit_limit: Number.isFinite(credit_limit as any) ? (credit_limit as any) : null,
    };
  }

  preview.categories = categoriesSheet.map((r) => String((r as any).name ?? "").trim()).filter(Boolean);
  preview.classes = classesSheet.map((r) => String((r as any).name ?? "").trim()).filter(Boolean);

  const normalizedType = (s: string) => String(s).trim().toLowerCase();

  txSheet.forEach((r, idx) => {
    const line = idx + 2; // header na linha 1

    const description = String((r as any).description ?? "").trim();
    const amountRaw = (r as any).amount ?? "";
    const amount = Number(String(amountRaw).replace(",", "."));

    const type = normalizedType((r as any).type ?? "") as ImportRowTx["type"];
    const installmentsRaw = (r as any).installments ?? "";
    const installments = installmentsRaw === "" ? undefined : Number(String(installmentsRaw).replace(",", "."));

    const start_date = String((r as any).start_date ?? "").trim();
    const endRaw = String((r as any).end_date ?? "").trim();
    const end_date = endRaw ? endRaw : null;

    const category = String((r as any).category ?? "").trim() || null;
    const cls = String((r as any).class ?? "").trim() || null;

    if (!description) errors.push(`transactions linha ${line}: description vazio`);
    if (!Number.isFinite(amount) || amount <= 0) errors.push(`transactions linha ${line}: amount inválido`);
    if (!["single", "installment", "recurring"].includes(type))
      errors.push(`transactions linha ${line}: type inválido (${String((r as any).type)})`);
    if (!isISODate(start_date)) errors.push(`transactions linha ${line}: start_date inválido (${start_date})`);
    if (end_date && !isISODate(end_date)) errors.push(`transactions linha ${line}: end_date inválido (${end_date})`);
    if (type === "installment") {
      const inst = installments ?? 0;
      if (!Number.isInteger(inst) || inst < 2) errors.push(`transactions linha ${line}: installments deve ser >= 2`);
    }

    preview.transactions.push({
      description,
      amount: Number.isFinite(amount) ? amount : 0,
      type: ["single", "installment", "recurring"].includes(type) ? type : "single",
      installments: installments ? Number(installments) : undefined,
      start_date,
      end_date,
      category,
      class: cls,
    });
  });

  // dedup mantendo primeira ocorrência original
  const catOriginalMap = new Map<string, string>();
  categoriesSheet.forEach((r) => {
    const nm = String((r as any).name ?? "").trim();
    const key = normalizeName(nm);
    if (nm && !catOriginalMap.has(key)) catOriginalMap.set(key, nm);
  });
  preview.categories = Array.from(catOriginalMap.values());

  const classOriginalMap = new Map<string, string>();
  classesSheet.forEach((r) => {
    const nm = String((r as any).name ?? "").trim();
    const key = normalizeName(nm);
    if (nm && !classOriginalMap.has(key)) classOriginalMap.set(key, nm);
  });
  preview.classes = Array.from(classOriginalMap.values());

  return preview;
}

export async function buildImportPreviewFromFile(file: File): Promise<ImportPreview> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return buildImportPreviewFromWorkbook(wb);
}