"use client";
// src/app/agents/page.tsx
// Custom AI agents list/create UI. Pro/Enterprise feature with a
// per-tier cap (3 / 10). Basic users see an upgrade card. Each agent
// stores a freeform system prompt — user picks one in the chat
// composer to switch the assistant's tone/role for that session.

import { useEffect, useState } from "react";
import { Bot, Plus, Trash2, Pencil, Lock, Sparkles, Save, X } from "lucide-react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { SkeletonCard } from "@/components/ui/Skeleton";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

interface Agent {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export default function AgentsPage() {
  const [list, setList] = useState<Agent[] | null>(null);
  const [limit, setLimit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [tierLocked, setTierLocked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [color, setColor] = useState("#8b5cf6");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (res.status === 403) {
        const j = await res.json().catch(() => null);
        if (j?.code === "TIER_LOCKED") setTierLocked(true);
      } else if (res.ok) {
        const j = await res.json();
        setList(j.agents);
        setLimit(j.limit);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function resetForm() {
    setEditing(null);
    setName("");
    setDescription("");
    setSystemPrompt("");
    setColor("#8b5cf6");
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(a: Agent) {
    setEditing(a);
    setName(a.name);
    setDescription(a.description ?? "");
    setSystemPrompt(a.systemPrompt);
    setColor(a.color);
    setShowForm(true);
  }

  async function save() {
    if (!name.trim() || !systemPrompt.trim()) return;
    setSaving(true);
    try {
      const url = editing ? `/api/agents/${editing.id}` : "/api/agents";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, systemPrompt, color, icon: "Bot" }),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Naozaj zmazať tohto agenta?")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <AppLayout title="Vlastní AI agenti" subtitle="AI agenti —">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        {loading ? (
          <SkeletonCard lines={3} />
        ) : tierLocked ? (
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
              Vlastní AI agenti — Pro a Enterprise
            </h2>
            <p className="text-sm max-w-md mx-auto mb-6" style={{ color: D.muted }}>
              Vytvor si až 3 (Pro) alebo 10 (Enterprise) vlastných AI agentov so špecifickou rolou — predaj, copywriter, podpora, čokoľvek.
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
              <div>
                <p className="text-sm" style={{ color: D.muted }}>
                  {(list?.length ?? 0)} / {limit} agentov
                </p>
              </div>
              <button
                onClick={openCreate}
                disabled={(list?.length ?? 0) >= limit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
              >
                <Plus className="w-4 h-4" /> Nový agent
              </button>
            </div>

            {showForm && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: D.text }}>
                    {editing ? "Upraviť agenta" : "Nový agent"}
                  </h3>
                  <button onClick={() => { setShowForm(false); resetForm(); }} style={{ color: D.muted }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Názov (napr. 'Predajný asistent')"
                  maxLength={60}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Krátky popis (voliteľné)"
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <textarea
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="Systémový prompt — povedz agentovi, ako sa má správať, akým tónom písať, na čo sa zamerať..."
                  maxLength={4000}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs" style={{ color: D.muted }}>Farba:</label>
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <button
                  onClick={save}
                  disabled={saving || !name.trim() || !systemPrompt.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
                >
                  <Save className="w-4 h-4" /> {saving ? "Ukladám…" : "Uložiť"}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {(list ?? []).map(a => (
                <div
                  key={a.id}
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}22`, border: `1px solid ${a.color}40` }}
                  >
                    <Bot className="w-4 h-4" style={{ color: a.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold" style={{ color: D.text }}>{a.name}</h4>
                    {a.description && (
                      <p className="text-xs mt-0.5" style={{ color: D.muted }}>{a.description}</p>
                    )}
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: D.mutedDark }}>{a.systemPrompt}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg" style={{ color: D.muted }}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg" style={{ color: "#f43f5e" }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {(list?.length ?? 0) === 0 && !showForm && (
                <p className="text-center text-sm py-12" style={{ color: D.muted }}>
                  Zatiaľ žiadni agenti. Vytvor si prvého.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
