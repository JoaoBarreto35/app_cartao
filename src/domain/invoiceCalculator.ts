// src/domain/invoiceCalculator.ts

import type { Transaction, Invoice, InvoiceItem, InvoiceMonth } from "./types";
/**
 * Parse "YYYY-MM-DD" -> { year, month }
 * (sem Date pra evitar timezone)
 */
export function parseDateToMonth(date: string): InvoiceMonth {
  const [y, m] = date.split("-").map(Number);
  if (!y || !m) throw new Error(`Invalid date: ${date}`);
  return { year: y, month: m };
}

/**
 * Parse "YYYY-MM" (do input type="month") -> { year, month }
 */
export function parseMonthInput(value: string): InvoiceMonth {
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) throw new Error(`Invalid month input: ${value}`);
  return { year: y, month: m };
}

/** Converte mês/ano para um índice contínuo, pra comparar e somar meses */
export function monthKey(m: InvoiceMonth): number {
  return m.year * 12 + (m.month - 1);
}

export function compareMonth(a: InvoiceMonth, b: InvoiceMonth): number {
  return monthKey(a) - monthKey(b);
}

export function addMonths(base: InvoiceMonth, offset: number): InvoiceMonth {
  const idx = monthKey(base) + offset;
  const year = Math.floor(idx / 12);
  const month = (idx % 12) + 1;
  return { year, month };
}

/** Dinheiro: number -> cents (inteiro) */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Dinheiro: cents -> number */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Regra P1: parcela em centavos truncada (perde o resto)
 * totalCents=1000, n=3 => 333 (R$ 3,33)
 */
export function installmentCentsTruncated(totalCents: number, n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`Invalid installments: ${n}`);
  return Math.floor(totalCents / n);
}

/**
 * Retorna X (1..N) da parcela correspondente ao mês target, ou null se fora do range.
 * Mês 1 = mês do start_date
 */
export function getInstallmentIndexForMonth(
  start: InvoiceMonth,
  target: InvoiceMonth,
  installments: number
): number | null {
  const diff = compareMonth(target, start); // meses depois do start
  const idx = diff + 1;
  if (idx < 1 || idx > installments) return null;
  return idx;
}

// ... (mantém tudo que já fizemos acima)

export function calculateInvoiceForMonth(
  transactions: Transaction[],
  year: number,
  month: number
): Invoice {
  if (!Number.isInteger(year) || year < 1900) throw new Error("Invalid year");
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Invalid month");

  const target: InvoiceMonth = { year, month };
  const items: InvoiceItem[] = [];

  for (const t of transactions) {
    const startMonth = parseDateToMonth(t.start_date);

    if (t.type === "single") {
      if (compareMonth(startMonth, target) === 0) {
        items.push({
          transactionId: t.id,
          description: t.description,
          kind: "single",
          year,
          month,
          amount: Number(t.amount),
        });
      }
      continue;
    }

    if (t.type === "installment") {
      const n = t.installments ?? 0;
      if (!n || n <= 0) continue;

      const installmentIndex = getInstallmentIndexForMonth(startMonth, target, n);
      if (installmentIndex == null) continue;

      const cents = installmentCentsTruncated(toCents( Number(t.amount)), n);

      items.push({
        transactionId: t.id,
        description: t.description,
        kind: "installment",
        year,
        month,
        amount: fromCents(cents),
        installmentIndex,
        installments: n,
      });
      continue;
    }

    if (t.type === "recurring") {
      const endMonth = t.end_date ? parseDateToMonth(t.end_date) : null;

      const shouldAppear =
        compareMonth(target, startMonth) >= 0 &&
        (endMonth ? compareMonth(target, endMonth) <= 0 : true);

      if (!shouldAppear) continue;

      items.push({
        transactionId: t.id,
        description: t.description,
        kind: "recurring",
        year,
        month,
        amount: Number(t.amount),
        isOpenEnded: t.end_date == null,
      });
      continue;
    }
  }

  // O2: ordenar por amount desc (maior primeiro)
  items.sort((a, b) => b.amount - a.amount);

  const totalCents = items.reduce((acc, it) => acc + toCents(it.amount), 0);

  return {
    month: target,
    items,
    total: fromCents(totalCents),
  };
}