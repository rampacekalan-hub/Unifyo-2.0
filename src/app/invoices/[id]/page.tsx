// src/app/invoices/[id]/page.tsx
// Server-rendered print view for one invoice. Static A4-friendly
// layout with print CSS so users can hit Cmd+P → "Save as PDF".
// No nav chrome, no sidebar — looks like a real invoice on print.

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { computeInvoiceTotals, formatCurrency, type InvoiceItem } from "@/lib/invoice";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Manual auth — this is a non-AppLayout page so we can't rely on
  // requireAuth's NextRequest signature. Cookie-based session.
  const session = await getSession();
  if (!session) redirect("/login");

  const inv = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
  });
  if (!inv) notFound();

  const items = (inv.items as unknown as InvoiceItem[]) ?? [];
  const totals = computeInvoiceTotals(items);
  const locale = inv.country === "CZ" ? "cs-CZ" : "sk-SK";
  const dateFmt = (d: Date) => new Intl.DateTimeFormat(locale).format(d);

  const isCZ = inv.country === "CZ";
  const L = {
    title: isCZ ? "Faktura" : "Faktúra",
    issuer: isCZ ? "Dodavatel" : "Dodávateľ",
    customer: isCZ ? "Odběratel" : "Odberateľ",
    ico: "IČO",
    dic: "DIČ",
    icDph: isCZ ? "DIČ DPH" : "IČ DPH",
    iban: "IBAN",
    issueDate: isCZ ? "Datum vystavení" : "Dátum vystavenia",
    dueDate: isCZ ? "Datum splatnosti" : "Dátum splatnosti",
    taxableDate: isCZ ? "Datum zdanitelného plnění" : "Dátum dodania",
    description: "Popis",
    qty: isCZ ? "Množství" : "Množstvo",
    unitPrice: isCZ ? "Cena bez DPH" : "Cena bez DPH",
    vatRate: isCZ ? "DPH %" : "DPH %",
    lineTotal: isCZ ? "Celkem" : "Spolu",
    subtotal: isCZ ? "Mezisoučet" : "Medzisúčet",
    vat: "DPH",
    total: isCZ ? "Celkem k úhradě" : "Spolu na úhradu",
    vs: isCZ ? "Variabilní symbol" : "Variabilný symbol",
    notes: isCZ ? "Poznámky" : "Poznámky",
  };

  return (
    <html>
      <head>
        <title>{L.title} {inv.invoiceNumber}</title>
        <style>{`
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; color: #111; background: #f3f4f6; }
          .sheet { background: white; max-width: 210mm; margin: 20px auto; padding: 24mm 18mm; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          h1 { font-size: 28px; margin: 0 0 4px; letter-spacing: -0.02em; }
          .num { color: #6b7280; font-size: 14px; }
          .row { display: flex; gap: 24px; margin-top: 28px; }
          .col { flex: 1; }
          .lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; font-weight: 600; margin-bottom: 4px; }
          .v { font-size: 13px; line-height: 1.4; white-space: pre-line; }
          table { width: 100%; border-collapse: collapse; margin-top: 32px; font-size: 13px; }
          th { text-align: left; padding: 8px 6px; border-bottom: 2px solid #111; font-size: 11px; text-transform: uppercase; }
          td { padding: 10px 6px; border-bottom: 1px solid #e5e7eb; }
          td.r, th.r { text-align: right; }
          .totals { margin-top: 16px; margin-left: auto; width: 50%; font-size: 13px; }
          .totals tr td { border: none; padding: 4px 6px; }
          .totals .grand td { font-size: 16px; font-weight: 700; border-top: 2px solid #111; padding-top: 10px; }
          .meta { display: flex; gap: 32px; margin-top: 24px; font-size: 12px; }
          .meta div span { display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
          .notes { margin-top: 32px; font-size: 12px; color: #374151; padding-top: 16px; border-top: 1px solid #e5e7eb; white-space: pre-line; }
          .pay { margin-top: 24px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 12px; }
          @media print {
            body { background: white; }
            .sheet { box-shadow: none; margin: 0; padding: 18mm 14mm; }
            .noprint { display: none !important; }
          }
        `}</style>
      </head>
      <body>
        <div className="sheet">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1>{L.title}</h1>
              <p className="num">#{inv.invoiceNumber}</p>
            </div>
            <PrintButton />
          </div>

          <div className="row">
            <div className="col">
              <div className="lbl">{L.issuer}</div>
              <div className="v">
                <strong>{inv.issuerName}</strong>{"\n"}
                {inv.issuerAddress}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                {inv.issuerIco && <div>{L.ico}: {inv.issuerIco}</div>}
                {inv.issuerDic && <div>{L.dic}: {inv.issuerDic}</div>}
                {inv.issuerIcDph && <div>{L.icDph}: {inv.issuerIcDph}</div>}
                {inv.issuerEmail && <div>{inv.issuerEmail}</div>}
              </div>
            </div>
            <div className="col">
              <div className="lbl">{L.customer}</div>
              <div className="v">
                <strong>{inv.customerName}</strong>{"\n"}
                {inv.customerAddress}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                {inv.customerIco && <div>{L.ico}: {inv.customerIco}</div>}
                {inv.customerDic && <div>{L.dic}: {inv.customerDic}</div>}
                {inv.customerIcDph && <div>{L.icDph}: {inv.customerIcDph}</div>}
              </div>
            </div>
          </div>

          <div className="meta">
            <div><span>{L.issueDate}</span>{dateFmt(new Date(inv.issueDate))}</div>
            <div><span>{L.dueDate}</span>{dateFmt(new Date(inv.dueDate))}</div>
            {inv.taxableDate && <div><span>{L.taxableDate}</span>{dateFmt(new Date(inv.taxableDate))}</div>}
            {inv.variableSymbol && <div><span>{L.vs}</span>{inv.variableSymbol}</div>}
          </div>

          <table>
            <thead>
              <tr>
                <th>{L.description}</th>
                <th className="r">{L.qty}</th>
                <th className="r">{L.unitPrice}</th>
                <th className="r">{L.vatRate}</th>
                <th className="r">{L.lineTotal}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const lineCents = Math.round(it.quantity * it.unitPrice * 100);
                return (
                  <tr key={i}>
                    <td>{it.description}</td>
                    <td className="r">{it.quantity}</td>
                    <td className="r">{formatCurrency(Math.round(it.unitPrice * 100), inv.currency, locale)}</td>
                    <td className="r">{it.vatRate}%</td>
                    <td className="r">{formatCurrency(lineCents, inv.currency, locale)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <table className="totals">
            <tbody>
              <tr><td>{L.subtotal}</td><td className="r">{formatCurrency(totals.subtotalCents, inv.currency, locale)}</td></tr>
              {totals.byRate.map(r => (
                <tr key={r.rate}><td>{L.vat} {r.rate}%</td><td className="r">{formatCurrency(r.vatCents, inv.currency, locale)}</td></tr>
              ))}
              <tr className="grand"><td>{L.total}</td><td className="r">{formatCurrency(totals.totalCents, inv.currency, locale)}</td></tr>
            </tbody>
          </table>

          {inv.issuerIban && (
            <div className="pay">
              <strong>{L.iban}:</strong> {inv.issuerIban}
              {inv.variableSymbol && <span> · <strong>{L.vs}:</strong> {inv.variableSymbol}</span>}
            </div>
          )}

          {inv.notes && (
            <div className="notes">{inv.notes}</div>
          )}
        </div>
      </body>
    </html>
  );
}
