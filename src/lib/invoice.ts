// src/lib/invoice.ts
// Pure helpers for invoice math — kept off the route handlers so the
// same logic powers both API totals and the HTML render preview.
// All amounts are tracked in CENTS (integers) to dodge floating-point
// drift; only convert to display strings at the edges.

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number; // in major units (EUR), 2 decimals — converted to cents internally
  vatRate: number;   // percent, e.g. 20 for 20% — SK default 20, CZ default 21
}

export interface InvoiceTotals {
  subtotalCents: number;
  vatTotalCents: number;
  totalCents: number;
  // Breakdown by VAT rate so the printed invoice can show the
  // standard "Základ DPH 20% / Suma DPH" rows side by side.
  byRate: { rate: number; baseCents: number; vatCents: number }[];
}

export function computeInvoiceTotals(items: InvoiceItem[]): InvoiceTotals {
  const buckets = new Map<number, { baseCents: number; vatCents: number }>();
  let subtotal = 0;
  let vat = 0;
  for (const it of items) {
    const lineCents = Math.round(it.quantity * it.unitPrice * 100);
    const lineVat = Math.round(lineCents * (it.vatRate / 100));
    subtotal += lineCents;
    vat += lineVat;
    const b = buckets.get(it.vatRate) ?? { baseCents: 0, vatCents: 0 };
    b.baseCents += lineCents;
    b.vatCents += lineVat;
    buckets.set(it.vatRate, b);
  }
  const byRate = Array.from(buckets.entries())
    .map(([rate, v]) => ({ rate, ...v }))
    .sort((a, b) => a.rate - b.rate);
  return {
    subtotalCents: subtotal,
    vatTotalCents: vat,
    totalCents: subtotal + vat,
    byRate,
  };
}

export function formatCurrency(cents: number, currency = "EUR", locale = "sk-SK"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function defaultVatRate(country: string): number {
  return country === "CZ" ? 21 : 20;
}
