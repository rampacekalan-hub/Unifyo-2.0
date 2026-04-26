"use client";
// src/app/invoices/page.tsx
// Enterprise SK/CZ invoice list + create form. PDF export = print
// view (browser → "Save as PDF") so we don't ship a 6MB PDF lib.

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Lock, Sparkles, Printer, Trash2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/invoice";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalCents: number;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string;
  country: string;
}

interface FormItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: D.muted,
  ISSUED: D.amber,
  PAID: D.emerald,
  CANCELLED: D.rose,
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Koncept",
  ISSUED: "Vystavená",
  PAID: "Zaplatená",
  CANCELLED: "Zrušená",
};

export default function InvoicesPage() {
  const [list, setList] = useState<InvoiceRow[] | null>(null);
  const [tierLocked, setTierLocked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [country, setCountry] = useState<"SK" | "CZ">("SK");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [issuerAddress, setIssuerAddress] = useState("");
  const [issuerIco, setIssuerIco] = useState("");
  const [issuerDic, setIssuerDic] = useState("");
  const [issuerIban, setIssuerIban] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerIco, setCustomerIco] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<FormItem[]>([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 20 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/invoices");
    if (res.status === 403) {
      const j = await res.json().catch(() => null);
      if (j?.code === "TIER_LOCKED") setTierLocked(true);
    } else if (res.ok) {
      setList(await res.json());
    }
  }
  useEffect(() => { load(); }, []);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatRate: country === "CZ" ? 21 : 20 }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function updateItem(i: number, patch: Partial<FormItem>) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function submit() {
    setError(null);
    if (!invoiceNumber.trim() || !issuerName.trim() || !customerName.trim() || !dueDate) {
      setError("Vyplň povinné polia");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber, country, issuerName, issuerAddress,
          issuerIco, issuerDic, issuerIban,
          customerName, customerAddress, customerIco,
          dueDate, items, status: "ISSUED",
          currency: country === "CZ" ? "CZK" : "EUR",
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setInvoiceNumber(""); setItems([{ description: "", quantity: 1, unitPrice: 0, vatRate: country === "CZ" ? 21 : 20 }]);
        await load();
      } else {
        const j = await res.json().catch(() => null);
        setError(j?.error ?? "Chyba pri ukladaní");
      }
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Zmazať koncept faktúry?")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <AppLayout title="Faktúry" subtitle="Faktúry —">
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
        {tierLocked ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.04))",
              border: `1px solid ${D.border}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
            >
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: D.text }}>
              SK/CZ faktúry — Enterprise
            </h2>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: D.muted }}>
              Vystavuj SK/CZ-kompliantné faktúry s IČO, DIČ, IČ DPH, variabilným symbolom a printable PDF výstupom.
            </p>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
            >
              <Sparkles className="w-4 h-4" /> Pozrieť plány
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: D.muted }}>
                {list?.length ?? 0} faktúr
              </p>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
              >
                <Plus className="w-4 h-4" /> Nová faktúra
              </button>
            </div>

            {showForm && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value as "SK" | "CZ")}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                  >
                    <option value="SK">Slovensko (EUR · DPH 20%)</option>
                    <option value="CZ">Česko (CZK · DPH 21%)</option>
                  </select>
                  <input
                    placeholder="Číslo faktúry (napr. 2026001)"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                  />
                </div>

                <h4 className="text-xs font-semibold uppercase pt-2" style={{ color: D.muted }}>Dodávateľ</h4>
                <input placeholder="Názov firmy / meno" value={issuerName} onChange={e => setIssuerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                <input placeholder="Adresa" value={issuerAddress} onChange={e => setIssuerAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="IČO" value={issuerIco} onChange={e => setIssuerIco(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                  <input placeholder="DIČ" value={issuerDic} onChange={e => setIssuerDic(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                  <input placeholder="IBAN" value={issuerIban} onChange={e => setIssuerIban(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                </div>

                <h4 className="text-xs font-semibold uppercase pt-2" style={{ color: D.muted }}>Odberateľ</h4>
                <input placeholder="Názov firmy / meno" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                <input placeholder="Adresa" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                <input placeholder="IČO odberateľa (voliteľné)" value={customerIco} onChange={e => setCustomerIco(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />

                <h4 className="text-xs font-semibold uppercase pt-2" style={{ color: D.muted }}>Položky</h4>
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input placeholder="Popis" value={it.description}
                      onChange={e => updateItem(i, { description: e.target.value })}
                      className="col-span-5 px-3 py-2 rounded-lg text-sm"
                      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                    <input type="number" placeholder="Qty" value={it.quantity}
                      onChange={e => updateItem(i, { quantity: parseFloat(e.target.value) || 0 })}
                      className="col-span-2 px-3 py-2 rounded-lg text-sm"
                      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                    <input type="number" step="0.01" placeholder="Cena" value={it.unitPrice}
                      onChange={e => updateItem(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="col-span-2 px-3 py-2 rounded-lg text-sm"
                      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                    <input type="number" step="0.1" placeholder="DPH %" value={it.vatRate}
                      onChange={e => updateItem(i, { vatRate: parseFloat(e.target.value) || 0 })}
                      className="col-span-2 px-3 py-2 rounded-lg text-sm"
                      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }} />
                    <button onClick={() => removeItem(i)} className="col-span-1 text-rose-500">
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
                <button onClick={addItem} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: D.muted, border: `1px solid ${D.border}` }}>
                  + Položka
                </button>

                {error && <p className="text-xs" style={{ color: D.rose }}>{error}</p>}

                <div className="flex items-center gap-2 pt-2">
                  <button onClick={submit} disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}>
                    {saving ? "Ukladám…" : "Vystaviť faktúru"}
                  </button>
                  <button onClick={() => setShowForm(false)} className="text-xs px-3 py-2 rounded-lg" style={{ color: D.muted }}>
                    Zrušiť
                  </button>
                </div>
              </div>
            )}

            {list === null ? (
              <SkeletonCard lines={2} />
            ) : list.length === 0 ? (
              <div className="rounded-2xl p-10 text-center"
                style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}>
                <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: D.muted }} />
                <p className="text-sm" style={{ color: D.muted }}>Zatiaľ žiadne faktúry.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {list.map(inv => (
                  <div key={inv.id} className="rounded-2xl p-4 flex items-center gap-3"
                    style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold" style={{ color: D.text }}>
                          #{inv.invoiceNumber} · {inv.customerName}
                        </h4>
                        <span className="text-[0.6rem] px-1.5 py-0.5 rounded font-semibold uppercase"
                          style={{ background: `${STATUS_COLOR[inv.status]}22`, color: STATUS_COLOR[inv.status] }}>
                          {STATUS_LABEL[inv.status] ?? inv.status}
                        </span>
                        <span className="text-[0.6rem]" style={{ color: D.mutedDark }}>{inv.country}</span>
                      </div>
                      <p className="text-[0.7rem] mt-0.5" style={{ color: D.muted }}>
                        {formatCurrency(inv.totalCents, inv.currency)} · splatné {new Date(inv.dueDate).toLocaleDateString("sk-SK")}
                      </p>
                    </div>
                    <Link href={`/invoices/${inv.id}`} target="_blank"
                      className="p-1.5 rounded-lg" style={{ color: D.indigo }}>
                      <Printer className="w-4 h-4" />
                    </Link>
                    {inv.status === "DRAFT" && (
                      <button onClick={() => remove(inv.id)} className="p-1.5 rounded-lg" style={{ color: D.rose }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
