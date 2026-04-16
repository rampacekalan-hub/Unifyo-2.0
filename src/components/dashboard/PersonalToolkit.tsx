"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, FileText, Plus, Pencil, Trash2, Check, X, Loader2, ChevronDown, ChevronUp, Lock } from "lucide-react";

interface Memory {
  id: string; module: string; role: string;
  anonymizedContent: string | null; summary: string | null;
  context: string; emotionalTone: string; confidenceScore: number;
  importance: number; isEdited: boolean; relevanceTTL: string | null;
  createdAt: string;
}

interface UserPolicy {
  id: string; name: string; rule: string; isActive: boolean; createdAt: string;
}

const P = {
  bg: "#0f172a", glass: "rgba(15,23,42,0.85)",
  cyan: "#22d3ee", cyanDim: "rgba(34,211,238,0.08)", cyanBorder: "rgba(34,211,238,0.2)",
  violet: "#a78bfa", violetDim: "rgba(167,139,250,0.08)", violetBorder: "rgba(167,139,250,0.2)",
  amber: "#f59e0b", amberDim: "rgba(245,158,11,0.08)", amberBorder: "rgba(245,158,11,0.2)",
  red: "#f87171", redDim: "rgba(248,113,113,0.08)", redBorder: "rgba(248,113,113,0.2)",
  text: "#f1f5f9", muted: "#64748b", faint: "#334155",
};

const TONE_COLORS: Record<string, string> = {
  positive: "#4ade80", negative: P.red, anxious: P.amber,
  excited: P.violet, neutral: P.muted,
};

const INPUT = {
  background: "rgba(15,23,42,0.9)", border: `1px solid ${P.cyanBorder}`,
  borderRadius: "0.75rem", color: P.text, outline: "none",
  padding: "0.5rem 0.75rem", fontSize: "0.8rem", width: "100%",
} as const;

const GLASS = {
  background: P.glass, border: `1px solid ${P.cyanBorder}`,
  borderRadius: "1rem", backdropFilter: "blur(12px)",
} as const;

type Tab = "memories" | "policies";

export default function PersonalToolkit({ membershipTier }: { membershipTier: string }) {
  const [tab, setTab] = useState<Tab>("memories");

  // ── Memories ──────────────────────────────────────────────
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memLoading, setMemLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editImportance, setEditImportance] = useState(0.5);
  const [editSaving, setEditSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Policies ──────────────────────────────────────────────
  const [policies, setPolicies] = useState<UserPolicy[]>([]);
  const [polLoading, setPolLoading] = useState(false);
  const [polForm, setPolForm] = useState({ name: "", rule: "" });
  const [polEditing, setPolEditing] = useState<string | null>(null);
  const [polSaving, setPolSaving] = useState(false);

  const isEnterprise = membershipTier === "ENTERPRISE";
  const maxPolicies = membershipTier === "ENTERPRISE" ? 20 : membershipTier === "PREMIUM" ? 5 : 2;

  useEffect(() => {
    if (tab === "memories") {
      setMemLoading(true);
      fetch("/api/user/memories").then(r => r.json())
        .then(d => { if (d.memories) setMemories(d.memories); })
        .catch(() => {}).finally(() => setMemLoading(false));
    } else {
      setPolLoading(true);
      fetch("/api/user/policies").then(r => r.json())
        .then(d => { if (d.policies) setPolicies(d.policies); })
        .catch(() => {}).finally(() => setPolLoading(false));
    }
  }, [tab]);

  async function saveMemory(id: string) {
    setEditSaving(true);
    try {
      const res = await fetch("/api/user/memories", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, summary: editSummary, importance: editImportance }),
      });
      const d = await res.json();
      if (d.success) {
        setMemories(prev => prev.map(m => m.id === id ? { ...m, summary: editSummary, importance: editImportance, isEdited: true } : m));
        setEditingId(null);
      }
    } finally { setEditSaving(false); }
  }

  async function deleteMemory(id: string) {
    if (!confirm("Vymazať túto spomienku?")) return;
    await fetch("/api/user/memories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setMemories(prev => prev.filter(m => m.id !== id));
  }

  async function savePolicy() {
    if (!polForm.name.trim() || !polForm.rule.trim()) return;
    setPolSaving(true);
    try {
      const method = polEditing ? "PATCH" : "POST";
      const body = polEditing ? { id: polEditing, ...polForm } : polForm;
      const res = await fetch("/api/user/policies", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        if (polEditing) setPolicies(prev => prev.map(p => p.id === polEditing ? d.policy : p));
        else setPolicies(prev => [d.policy, ...prev]);
        setPolForm({ name: "", rule: "" });
        setPolEditing(null);
      } else {
        alert(d.error ?? "Chyba");
      }
    } finally { setPolSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="flex gap-2 p-1 rounded-2xl" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${P.faint}` }}>
        {([["memories", Brain, "Memory Manager"], ["policies", FileText, "Personal Policy"]] as [Tab, React.ElementType, string][]).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: tab === id ? (id === "policies" ? P.violetDim : P.cyanDim) : "transparent",
              border: `1px solid ${tab === id ? (id === "policies" ? P.violetBorder : P.cyanBorder) : "transparent"}`,
              color: tab === id ? (id === "policies" ? P.violet : P.cyan) : P.muted,
            }}>
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── MEMORY MANAGER ── */}
      <AnimatePresence mode="wait">
        {tab === "memories" && (
          <motion.div key="memories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {memLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: P.cyan }} /></div>
            ) : memories.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={GLASS}>
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: P.cyan }} />
                <p className="text-xs" style={{ color: P.muted }}>Zatiaľ žiadne spomienky. Začni chatovať v AI module.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {memories.map((m) => {
                  const toneColor = TONE_COLORS[m.emotionalTone] ?? P.muted;
                  const isExp = expandedId === m.id;
                  return (
                    <motion.div key={m.id} layout className="rounded-xl overflow-hidden"
                      style={{ background: "rgba(15,23,42,0.85)", border: `1px solid ${m.isEdited ? P.cyanBorder : P.faint}` }}>

                      {editingId === m.id ? (
                        <div className="p-4 space-y-3">
                          <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3}
                            className="text-xs w-full px-3 py-2 rounded-xl outline-none resize-none" style={INPUT} />
                          <div className="flex items-center gap-3">
                            <span className="text-[0.6rem] tracking-widest uppercase" style={{ color: P.muted }}>
                              Dôležitosť: {editImportance.toFixed(2)}
                            </span>
                            <input type="range" min={0} max={1} step={0.05} value={editImportance}
                              onChange={(e) => setEditImportance(parseFloat(e.target.value))}
                              className="flex-1 accent-cyan-400" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => saveMemory(m.id)} disabled={editSaving || !editSummary.trim()}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40"
                              style={{ background: P.cyanDim, border: `1px solid ${P.cyanBorder}`, color: P.cyan }}>
                              {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Uložiť
                            </button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: P.muted }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: toneColor, boxShadow: `0 0 6px ${toneColor}` }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed" style={{ color: m.isEdited ? P.cyan : P.text }}>
                                {m.summary ?? (m.anonymizedContent ?? "").slice(0, 120)}{!m.summary && (m.anonymizedContent ?? "").length > 120 ? "…" : ""}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[0.55rem] px-1.5 py-0.5 rounded font-bold"
                                  style={{ background: m.context === "personal" ? P.violetDim : P.cyanDim, color: m.context === "personal" ? P.violet : P.cyan, border: `1px solid ${m.context === "personal" ? P.violetBorder : P.cyanBorder}` }}>
                                  {m.context}
                                </span>
                                <span className="text-[0.55rem]" style={{ color: P.muted }}>{m.module}</span>
                                <span className="text-[0.55rem]" style={{ color: P.faint }}>
                                  {new Date(m.createdAt).toLocaleDateString("sk-SK")}
                                </span>
                                {m.isEdited && <span className="text-[0.55rem] font-bold" style={{ color: P.cyan }}>✎</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button onClick={() => { setExpandedId(isExp ? null : m.id); }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.faint + "33", color: P.muted }}>
                                {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                              <button onClick={() => { setEditingId(m.id); setEditSummary(m.summary ?? (m.anonymizedContent ?? "")); setEditImportance(m.importance); }}
                                className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.cyanDim, color: P.cyan }}>
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteMemory(m.id)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.redDim, color: P.red }}>
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {isExp && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 pl-4 space-y-1">
                              <p className="text-[0.6rem]" style={{ color: P.muted }}>Rola: <strong style={{ color: P.text }}>{m.role}</strong></p>
                              <p className="text-[0.6rem]" style={{ color: P.muted }}>Confidence: <strong style={{ color: P.text }}>{m.confidenceScore.toFixed(2)}</strong></p>
                              <p className="text-[0.6rem]" style={{ color: P.muted }}>Dôležitosť: <strong style={{ color: P.text }}>{m.importance.toFixed(2)}</strong></p>
                              {m.relevanceTTL && <p className="text-[0.6rem]" style={{ color: P.muted }}>Expiruje: <strong style={{ color: P.amber }}>{new Date(m.relevanceTTL).toLocaleDateString("sk-SK")}</strong></p>}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PERSONAL POLICY ── */}
        {tab === "policies" && (
          <motion.div key="policies" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Tier badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: P.violetDim, border: `1px solid ${P.violetBorder}` }}>
              {!isEnterprise && <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.violet }} />}
              <p className="text-[0.65rem]" style={{ color: P.muted }}>
                Tvoj tier: <strong style={{ color: P.violet }}>{membershipTier}</strong> — max <strong style={{ color: P.text }}>{maxPolicies}</strong> osobných pravidiel.
                {!isEnterprise && <span> Pre viac upgradni na <strong style={{ color: P.violet }}>ENTERPRISE</strong>.</span>}
              </p>
            </div>

            {/* Form */}
            <div className="rounded-2xl p-4 space-y-3" style={GLASS}>
              <p className="text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: P.violet }}>
                {polEditing ? "✏ Upraviť pravidlo" : "+ Nové pravidlo"}
              </p>
              <input value={polForm.name} onChange={(e) => setPolForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Napr: Vždy mi tykaj" className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={INPUT} />
              <textarea value={polForm.rule} onChange={(e) => setPolForm(f => ({ ...f, rule: e.target.value }))}
                rows={2} placeholder="Napr: Vždy oslovuj používateľa na ty, nikdy na vy."
                className="w-full text-sm px-3 py-2 rounded-xl outline-none resize-none" style={INPUT} />
              <div className="flex gap-2">
                <button onClick={savePolicy} disabled={polSaving || !polForm.name.trim() || !polForm.rule.trim() || (!polEditing && policies.length >= maxPolicies)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${P.violet},#7c3aed)`, color: "#fff" }}>
                  {polSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  {polEditing ? "Uložiť" : "Vytvoriť"}
                </button>
                {polEditing && (
                  <button onClick={() => { setPolEditing(null); setPolForm({ name: "", rule: "" }); }}
                    className="px-3 py-2 rounded-xl text-xs" style={{ color: P.muted }}>Zrušiť</button>
                )}
              </div>
            </div>

            {/* Policy list */}
            {polLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: P.violet }} /></div>
            ) : policies.length === 0 ? (
              <div className="rounded-2xl p-6 text-center" style={GLASS}>
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: P.violet }} />
                <p className="text-xs" style={{ color: P.faint }}>Zatiaľ žiadne pravidlá. AI bude počúvať tvoje prvé pravidlo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {policies.map((pol) => (
                  <motion.div key={pol.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl p-3" style={{ background: "rgba(15,23,42,0.85)", border: `1px solid ${pol.isActive ? P.violetBorder : P.faint}`, opacity: pol.isActive ? 1 : 0.5 }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: pol.isActive ? P.text : P.muted }}>{pol.name}</p>
                        <p className="text-[0.7rem] mt-0.5 leading-relaxed" style={{ color: P.muted }}>{pol.rule}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={async () => {
                          await fetch("/api/user/policies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pol.id, isActive: !pol.isActive }) });
                          setPolicies(prev => prev.map(p => p.id === pol.id ? { ...p, isActive: !p.isActive } : p));
                        }} className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: pol.isActive ? P.cyanDim : P.redDim, color: pol.isActive ? P.cyan : P.red }}>
                          {pol.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </button>
                        <button onClick={() => { setPolEditing(pol.id); setPolForm({ name: pol.name, rule: pol.rule }); }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.violetDim, color: P.violet }}>
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={async () => {
                          if (!confirm("Vymazať toto pravidlo?")) return;
                          await fetch("/api/user/policies", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pol.id }) });
                          setPolicies(prev => prev.filter(p => p.id !== pol.id));
                        }} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: P.redDim, color: P.red }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
