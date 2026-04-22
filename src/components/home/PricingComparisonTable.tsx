"use client";
// src/components/home/PricingComparisonTable.tsx
// Feature × plan matrix — goes below PricingSection on /cennik. Users
// who already know they'll subscribe skim the cards; users still
// deciding scan this table. Both need to agree on plan ids.
//
// Rows are grouped by module so the reader can mentally anchor:
// "OK, for CRM what do I get where?". Values are either a bool (✓/—)
// or a short string ("100/deň", "Neobmedzene").

import { Check, Minus } from "lucide-react";

interface Row {
  label: string;
  values: [string | boolean, string | boolean, string | boolean];
  hint?: string;
}
interface Group {
  title: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    title: "AI asistent",
    rows: [
      { label: "AI chat po slovensky",         values: [true, true, true] },
      { label: "Denný limit AI správ",          values: ["100", "1 000", "Neobmedzene"] },
      { label: "Pamäť kontextu",                values: [true, true, true] },
      { label: "Rozšírená pamäť (dlhodobá)",    values: [false, true, true] },
      { label: "AI prepis hovoru (Whisper)",    values: ["5 / mes.", "Neobmedzene", "Neobmedzene"] },
      { label: "Vlastní AI agenti",             values: [false, "3", "Neobmedzene"],
        hint: "Čoskoro" },
    ],
  },
  {
    title: "CRM, Pipeline, Kalendár",
    rows: [
      { label: "Kontakty, poznámky, história",  values: [true, true, true] },
      { label: "Pipeline (deal stages)",        values: [true, true, true] },
      { label: "Kalendár + drag-n-drop",        values: [true, true, true] },
      { label: "CSV import / export",           values: [true, true, true] },
      { label: "Zdieľanie cez verejný link",    values: [true, true, true] },
    ],
  },
  {
    title: "E-mail & integrácie",
    rows: [
      { label: "Prepojenie Gmail",              values: [true, true, true] },
      { label: "Prepojenie Google Kalendár",    values: [true, true, true] },
      { label: "Outlook + Teams",               values: [false, false, true],
        hint: "Čoskoro" },
      { label: "Automatizácie (ranný súhrn…)",  values: [false, true, true] },
    ],
  },
  {
    title: "Účet & bezpečnosť",
    rows: [
      { label: "2FA + správa zariadení",        values: [true, true, true] },
      { label: "GDPR export & zmazanie účtu",   values: [true, true, true] },
      { label: "Referral bonusy",               values: [false, true, true] },
      { label: "Audit trail",                   values: [false, false, true] },
    ],
  },
  {
    title: "Podpora",
    rows: [
      { label: "E-mailová podpora",             values: [true, true, true] },
      { label: "Prioritná podpora (24h)",       values: [false, true, true] },
      { label: "SLA & dedikovaná podpora",      values: [false, false, true] },
      { label: "Custom integrácie",             values: [false, false, true] },
    ],
  },
];

const PLAN_LABELS: [string, string, string] = ["Basic", "Pro", "Enterprise"];
const PLAN_PRICES: [string, string, string] = ["€0", "€19/mes.", "€49/mes."];

export default function PricingComparisonTable() {
  return (
    <section
      className="py-16 px-6"
      style={{ background: "var(--app-surface-2)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span
            className="text-[11px] font-semibold tracking-[0.18em] uppercase"
            style={{ color: "var(--app-text-muted)" }}
          >
            Porovnanie plánov
          </span>
          <h2
            className="font-black tracking-[-0.02em] mt-2"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.6rem)", color: "var(--app-text)" }}
          >
            Každá funkcia,{" "}
            <span style={{
              background: "var(--brand-gradient)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              bok po boku
            </span>
          </h2>
        </div>

        {/* Sticky header row with plan labels + prices */}
        <div
          className="overflow-x-auto rounded-2xl"
          style={{
            background: "var(--app-surface)",
            border: "1px solid var(--app-border)",
            borderRadius: "var(--r-lg)",
          }}
        >
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th
                  className="text-left py-4 px-5 sticky left-0 z-10"
                  style={{
                    minWidth: 240,
                    background: "var(--app-surface)",
                    borderBottom: "1px solid var(--app-border)",
                    color: "var(--app-text-subtle)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Funkcia
                </th>
                {PLAN_LABELS.map((label, i) => {
                  const isPro = i === 1;
                  return (
                    <th
                      key={label}
                      className="py-4 px-5 text-center"
                      style={{
                        minWidth: 140,
                        borderBottom: "1px solid var(--app-border)",
                        color: "var(--app-text)",
                        fontWeight: 700,
                      }}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-sm">
                          {label}
                          {isPro && (
                            <span
                              className="ml-2 align-middle text-[9px] font-bold px-1.5 py-0.5 rounded"
                              style={{
                                background: "var(--brand-primary-soft)",
                                color: "var(--brand-primary)",
                                border: "1px solid color-mix(in oklab, var(--brand-primary) 40%, transparent)",
                              }}
                            >
                              TOP
                            </span>
                          )}
                        </span>
                        <span
                          className="text-[0.65rem] font-medium"
                          style={{ color: "var(--app-text-muted)" }}
                        >
                          {PLAN_PRICES[i]}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {GROUPS.map((group) => (
                <>
                  <tr key={group.title}>
                    <td
                      colSpan={4}
                      className="pt-6 pb-2 px-5 text-[0.7rem] font-bold uppercase tracking-widest"
                      style={{
                        color: "var(--brand-primary)",
                        background: "var(--app-surface-2)",
                      }}
                    >
                      {group.title}
                    </td>
                  </tr>
                  {group.rows.map((r, rIdx) => (
                    <tr
                      key={`${group.title}-${rIdx}`}
                      style={{ borderBottom: "1px solid var(--app-border)" }}
                    >
                      <td
                        className="py-3 px-5"
                        style={{ color: "var(--app-text)" }}
                      >
                        {r.label}
                        {r.hint && (
                          <span
                            className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{
                              background: "var(--brand-warning-soft)",
                              color: "var(--brand-warning)",
                            }}
                          >
                            {r.hint}
                          </span>
                        )}
                      </td>
                      {r.values.map((v, i) => (
                        <td
                          key={i}
                          className="py-3 px-5 text-center"
                          style={{
                            color: typeof v === "boolean"
                              ? (v ? "var(--brand-success)" : "var(--app-text-subtle)")
                              : "var(--app-text)",
                            fontWeight: typeof v === "string" ? 600 : 400,
                            fontSize: typeof v === "string" ? "0.8rem" : undefined,
                            background: i === 1 ? "var(--brand-primary-soft)" : undefined,
                          }}
                        >
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="w-4 h-4 mx-auto" strokeWidth={2.5} />
                            ) : (
                              <Minus className="w-3 h-3 mx-auto opacity-60" />
                            )
                          ) : (
                            v
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "var(--app-text-subtle)" }}>
          Zmena plánu kedykoľvek · Fakturácia v EUR · Bez skrytých poplatkov ·
          Daň podľa krajiny (SK DPH 23 %)
        </p>
      </div>
    </section>
  );
}
