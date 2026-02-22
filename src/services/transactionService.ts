import { supabase } from "../lib/supabaseClient";
import type { Transaction, TransactionType } from "../models/transaction";

/* =========================
   Helpers
========================= */

function toNumericString(n: number): string {
  return n.toFixed(2);
}

/* =========================
   Transactions CRUD
========================= */

export type CreateTransactionInput = {
  workspace_id: string;
  description: string;
  amount: number;
  type: TransactionType;
  installments?: number;
  start_date: string;
  end_date?: string | null;

  category_id?: string | null;
  class_id?: string | null;
};

export type UpdateTransactionInput = {
  description: string;
  amount: number;
  type: TransactionType;
  installments?: number;
  start_date: string;
  end_date?: string | null;

  category_id?: string | null;
  class_id?: string | null;
};

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  const payload = {
    workspace_id: input.workspace_id,
    description: input.description.trim(),
    amount: toNumericString(input.amount),
    type: input.type,
    installments: input.type === "installment" ? (input.installments ?? 2) : 1,
    start_date: input.start_date,
    end_date: input.end_date ?? null,
    category_id: input.category_id ?? null,
    class_id: input.class_id ?? null,
  };

  const { data, error } = await supabase.from("transactions").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  return data as Transaction;
}

export async function updateTransaction(
  transactionId: string,
  input: UpdateTransactionInput
): Promise<Transaction> {
  const payload = {
    description: input.description.trim(),
    amount: toNumericString(input.amount),
    type: input.type,
    installments: input.type === "installment" ? (input.installments ?? 2) : 1,
    start_date: input.start_date,
    end_date: input.type === "recurring" ? (input.end_date ?? null) : null,
    category_id: input.category_id ?? null,
    class_id: input.class_id ?? null,
  };

  const { data, error } = await supabase
    .from("transactions")
    .update(payload)
    .eq("id", transactionId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Transaction;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
  if (error) throw new Error(error.message);
}

/* =========================
   Month range + query por mês
========================= */

export type MonthRange = {
  startInclusive: string;
  endExclusive: string;
};

export function getMonthRange(month: string): MonthRange {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);

  const startInclusive = `${yStr}-${mStr}-01`;
  const next = addMonths(y, m, 1);
  const endExclusive = `${String(next.y).padStart(4, "0")}-${String(next.m).padStart(2, "0")}-01`;

  return { startInclusive, endExclusive };
}

function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return { y: ny, m: nm };
}

function shiftMonthStart(month: string, deltaMonths: number): string {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const shifted = addMonths(y, m, deltaMonths);
  return `${String(shifted.y).padStart(4, "0")}-${String(shifted.m).padStart(2, "0")}-01`;
}

export async function listTransactionsForMonth(
  workspaceId: string,
  range: MonthRange,
  opts?: { installmentLookbackMonths?: number }
): Promise<Transaction[]> {
  const lookback = opts?.installmentLookbackMonths ?? 36;

  const monthKey = range.startInclusive.slice(0, 7);
  const installmentLowerBound = shiftMonthStart(monthKey, -lookback);

  const orFilter = [
    `and(type.eq.recurring,start_date.lt.${range.endExclusive},or(end_date.is.null,end_date.gte.${range.startInclusive}))`,
    `and(type.eq.single,start_date.gte.${range.startInclusive},start_date.lt.${range.endExclusive})`,
    `and(type.eq.installment,start_date.lt.${range.endExclusive},start_date.gte.${installmentLowerBound})`,
  ].join(",");

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .or(orFilter)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}

export async function listTransactionsByWorkspace(workspaceId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Transaction[];
}


type Row = Pick<
  Transaction,
  | "id"
  | "workspace_id"
  | "description"
  | "amount"
  | "type"
  | "installments"
  | "start_date"
  | "end_date"
  | "category_id"
  | "class_id"
>;

export async function listTransactionsForRange(params: {
  rangeStart: string; // "YYYY-MM-DD"
  rangeEnd: string;   // "YYYY-MM-DD"
  workspaceId?: string | null; // opcional p/ futuro (filtro)
}): Promise<Row[]> {
  let q = supabase
    .from("transactions")
    .select(
      "id,workspace_id,description,amount,type,installments,start_date,end_date,category_id,class_id"
    )
    // começou até o fim do range
    .lte("start_date", params.rangeEnd)
    // e (sem end_date) OU (end_date >= início do range)
    .or(`end_date.is.null,end_date.gte.${params.rangeStart}`);

  if (params.workspaceId) q = q.eq("workspace_id", params.workspaceId);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []) as Row[];
}