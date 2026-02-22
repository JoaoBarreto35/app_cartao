// src/domain/types.ts
export type { Transaction, TransactionType } from "../models/transaction";

export interface InvoiceMonth {
  year: number;   // 2026
  month: number;  // 1..12
}

export type InvoiceItemKind = "single" | "installment" | "recurring";

export interface InvoiceItem {
  transactionId: string;
  description: string;
  kind: InvoiceItemKind;

  year: number;
  month: number;

  amount: number;

  // installment
  installmentIndex?: number; // X
  installments?: number;     // Y

  // recurring
  isOpenEnded?: boolean;
}

export interface Invoice {
  month: InvoiceMonth;
  items: InvoiceItem[];
  total: number;
}