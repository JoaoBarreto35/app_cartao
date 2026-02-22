export type ImportRowTx = {
  description: string;
  amount: number;
  type: "single" | "installment" | "recurring";
  installments?: number;
  start_date: string;
  end_date?: string | null;
  category?: string | null; // nome
  class?: string | null; // nome
};

export type ImportPreview = {
  workspace?: { name?: string; credit_limit?: number | null };
  categories: string[];
  classes: string[];
  transactions: ImportRowTx[];
  errors: string[];
};