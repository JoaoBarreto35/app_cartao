import type { TransactionType } from "./transaction";

export type InvoiceItem = {
  transaction_id: string;
  description: string;
  type: TransactionType;

  // mês que está sendo exibido (ex: "2026-02")
  invoice_month: string;

  // valor já “do mês” (ex: parcela)
  amount: number;

  // só pra parcelado: 2/3
  installment_index?: number;
  installments_total?: number;
};