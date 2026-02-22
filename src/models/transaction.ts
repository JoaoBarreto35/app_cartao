export type TransactionType = "single" | "installment" | "recurring";

export type Transaction = {
  id: string;
  workspace_id: string;

  description: string;
  amount: string;
  type: TransactionType;

  installments: number;

  start_date: string;
  end_date: string | null;

  category_id: string | null;
  class_id: string | null; // FK -> transaction_classes.id

  created_at: string;
};