"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Calendar, Mail, Search, Plus, Phone, Briefcase, X, Trash2, Loader2, Check,
  Upload, Download, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { confirmWithUndo } from "@/lib/undoable";
import SwipeableRow from "@/components/ui/SwipeableRow";
import AppLayout from "@/components/layout/AppLayout";
import EmptyIllustration from "@/components/ui/EmptyIllustration";

interface CrmNote {
  id: string;
  body: string;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
  notes: CrmNote[];
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
};

export default function CRMPage() {
  return (
    <Suspense fallback={null}>
      <CRMPageInner />
    </Suspense>
  );
}

function CRMPageInner() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New contact form
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });

  // Bulk selection — Set of contact ids. When non-empty, action bar appears.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // CSV import modal state
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // Load contacts
  const loadContacts = useCallback(async (q: string = "") => {
    setLoading(true);
    try {
      const url = q ? `/api/crm/contacts?q=${encodeURIComponent(q)}` : "/api/crm/contacts";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch {
      toast.error("Nepodarilo sa načítať kontakty");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { loadContacts(searchQuery); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, loadContacts]);

  // URL param handlers — ?new=1 opens add modal, ?focus=<id> selects contact
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get("new") === "1") {
      setShowModal(true);
      router.replace("/crm");
    }
  }, [searchParams, router]);
  useEffect(() => {
    const focusId = searchParams?.get("focus");
    if (!focusId || contacts.length === 0) return;
    const c = contacts.find((x) => x.id === focusId);
    if (c) {
      setSelectedContact(c);
      router.replace("/crm");
    }
  }, [searchParams, contacts, router]);

  // Add contact
  async function handleAdd() {
    if (!form.name.trim()) {
      toast.error("Meno je povinné");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Kontakt uložený");
        setForm({ name: "", email: "", phone: "", company: "" });
        setShowModal(false);
        loadContacts(searchQuery);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Nepodarilo sa uložiť");
      }
    } finally {
      setSaving(false);
    }
  }

  // Bulk delete selected contacts. Uses the ids[] form of DELETE endpoint so
  // the server handles it in one transaction.
  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Naozaj zmazať ${ids.length} ${ids.length === 1 ? "kontakt" : ids.length < 5 ? "kontakty" : "kontaktov"}?`)) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.success(`Zmazaných ${data.deleted ?? ids.length}`);
        if (selectedContact && ids.includes(selectedContact.id)) setSelectedContact(null);
        clearSelection();
        loadContacts(searchQuery);
      } else {
        toast.error("Hromadné mazanie zlyhalo");
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  // Delete contact — optimistic UI + 5s undo window.
  async function handleDelete(id: string) {
    const snapshot = contacts;
    const wasSelected = selectedContact?.id === id;
    // Optimistic: hide immediately from the list.
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (wasSelected) setSelectedContact(null);

    confirmWithUndo({
      message: "Kontakt zmazaný",
      commit: async () => {
        const res = await fetch("/api/crm/contacts", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Delete failed");
      },
      onUndo: () => {
        // Restore previous list so order is preserved.
        setContacts(snapshot);
      },
    });
  }

  // Import CSV — read file client-side, POST text to /api/crm/import.
  async function handleImportFile(file: File) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      toast.error("Očakávaný CSV súbor");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Súbor je priveľký (max 5 MB)");
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/crm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Import zlyhal");
        return;
      }
      const imported = Number(data.imported ?? 0);
      const skipped = Number(data.skipped ?? 0);
      const errCount = Array.isArray(data.errors) ? data.errors.length : 0;
      const parts = [
        `Importovaných ${imported} ${imported === 1 ? "kontakt" : imported < 5 ? "kontakty" : "kontaktov"}`,
      ];
      if (skipped > 0) parts.push(`${skipped} preskočené — duplikáty`);
      if (errCount > 0) parts.push(`${errCount} chýb`);
      toast.success(parts.join(", "));
      setShowImport(false);
      loadContacts(searchQuery);
    } catch {
      toast.error("Import zlyhal");
    } finally {
      setImporting(false);
    }
  }

  function initials(name: string): string {
    return name.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
  }

  return (
    <AppLayout title="CRM">
      <div className="flex flex-col md:flex-row h-full p-4 md:p-6 gap-4 md:gap-6">
        {/* ── Contact list ── */}
        <div className="w-full md:max-w-[420px] flex flex-col flex-shrink-0">
          {/* Bulk action bar — shown when 1+ contact selected */}
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden mb-3"
              >
                <div
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18))",
                    border: "1px solid rgba(139,92,246,0.4)",
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: D.text }}>
                    {selected.size} {selected.size === 1 ? "vybraný" : selected.size < 5 ? "vybrané" : "vybraných"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={clearSelection}
                      disabled={bulkDeleting}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
                      style={{ background: "rgba(255,255,255,0.05)", color: D.muted }}
                    >
                      Zrušiť
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-50"
                      style={{
                        background: "rgba(239,68,68,0.18)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        color: "#fca5a5",
                      }}
                    >
                      {bulkDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Zmazať
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import / Export toolbar */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowImport(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
              title="Import kontaktov z CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV
            </button>
            <a
              href="/api/crm/export"
              download
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
              title="Stiahnuť všetky kontakty ako CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </a>
          </div>

          {/* Search + Add */}
          <div className="flex gap-2 md:gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: D.muted }} />
              <input
                type="text"
                placeholder="Hľadať kontakt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium flex-shrink-0"
              style={{ background: D.indigo, color: "white" }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Pridať</span>
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-auto space-y-2 max-h-[40vh] md:max-h-none">
            {loading && contacts.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: D.muted }} />
              </div>
            ) : contacts.length === 0 ? (
              searchQuery ? (
                <EmptyIllustration
                  variant="search"
                  title="Žiadne výsledky"
                  hint={`Nenašiel som nič pre "${searchQuery}". Skús iný výraz alebo uvoľni filter.`}
                />
              ) : (
                <EmptyIllustration
                  variant="contacts"
                  title="Žiadni klienti — poďme pridať prvého."
                  hint="Vyber rýchlu cestu:"
                  action={
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                      >
                        👤 Pridaj kontakt manuálne
                      </button>
                      <Link
                        href={`/dashboard?prompt=${encodeURIComponent("Pridaj kontakt Peter Novák, telefón 0950 312 387, záujem o hypotéku")}`}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
                      >
                        💬 Povedz to AI
                      </Link>
                      <Link
                        href="/settings#import"
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: "rgba(99,102,241,0.06)", border: `1px solid ${D.indigoBorder}`, color: D.muted }}
                      >
                        📋 Importuj z CSV
                      </Link>
                    </div>
                  }
                />
              )
            ) : contacts.map((contact) => {
              const isSelected = selected.has(contact.id);
              const isOpen = selectedContact?.id === contact.id;
              // Show checkbox permanently once any are selected — avoids mixed UX.
              const anySelected = selected.size > 0;
              return (
                <SwipeableRow
                  key={contact.id}
                  onAction={() => handleDelete(contact.id)}
                  className="rounded-xl"
                >
                <motion.div
                  onClick={(e) => {
                    // Shift/Ctrl/Cmd click always toggles selection instead of opening.
                    if (anySelected || e.shiftKey || e.metaKey || e.ctrlKey) {
                      toggleSelect(contact.id);
                    } else {
                      setSelectedContact(contact);
                    }
                  }}
                  className="group p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isSelected
                      ? "rgba(139,92,246,0.18)"
                      : isOpen
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(99,102,241,0.05)",
                    border: `1px solid ${isSelected
                      ? "rgba(139,92,246,0.45)"
                      : isOpen ? D.indigoBorder : "transparent"}`,
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox — visible on hover, or always when any row is selected */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id); }}
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-opacity ${anySelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                      style={{
                        background: isSelected ? D.violet : "transparent",
                        border: `1.5px solid ${isSelected ? D.violet : "rgba(148,163,184,0.4)"}`,
                      }}
                      aria-label={isSelected ? "Zrušiť výber" : "Označiť"}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </button>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)", color: D.indigo }}
                    >
                      {initials(contact.name) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: D.text }}>{contact.name}</div>
                      <p className="text-xs truncate" style={{ color: D.muted }}>
                        {contact.company || contact.email || contact.phone || "—"}
                      </p>
                    </div>
                  </div>
                </motion.div>
                </SwipeableRow>
              );
            })}
          </div>
        </div>

        {/* ── Detail ── */}
        <div
          className="flex-1 rounded-2xl p-4 md:p-6 min-h-[300px]"
          style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
        >
          {selectedContact ? (
            <div className="h-full flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.2)", color: D.indigo }}
                >
                  {initials(selectedContact.name) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-xl font-semibold break-words" style={{ color: D.text }}>
                    {selectedContact.name}
                  </h2>
                  <p className="text-sm truncate" style={{ color: D.muted }}>
                    {selectedContact.company || "Bez firmy"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: D.mutedDark }}>
                    Pridaný {new Date(selectedContact.createdAt).toLocaleDateString("sk-SK")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(selectedContact.id)}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: D.muted }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = D.muted)}
                  title="Zmazať"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: D.muted }}>
                    <Phone className="w-4 h-4" />
                    <span className="text-xs uppercase">Telefón</span>
                  </div>
                  <p className="font-medium truncate" style={{ color: D.text }}>
                    {selectedContact.phone || "—"}
                  </p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: D.muted }}>
                    <Mail className="w-4 h-4" />
                    <span className="text-xs uppercase">Email</span>
                  </div>
                  <p className="font-medium truncate" style={{ color: D.text }}>
                    {selectedContact.email || "—"}
                  </p>
                </div>
              </div>

              <div
                className="p-4 rounded-xl mb-6 flex-1 min-h-[120px]"
                style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: D.muted }}>
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs uppercase">Poznámky</span>
                </div>
                {selectedContact.notes && selectedContact.notes.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedContact.notes.map(n => (
                      <li key={n.id} className="text-sm" style={{ color: D.text }}>
                        <p>{n.body}</p>
                        <span className="text-[10px]" style={{ color: D.mutedDark }}>
                          {new Date(n.createdAt).toLocaleString("sk-SK")}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{ color: D.mutedDark }}>Zatiaľ žiadne poznámky.</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {selectedContact.phone && (
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  >
                    <Phone className="w-4 h-4" /> Zavolať
                  </a>
                )}
                {selectedContact.email && (
                  <a
                    href={`mailto:${selectedContact.email}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  >
                    <Mail className="w-4 h-4" /> Napísať
                  </a>
                )}
                <Link
                  href="/calendar"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                >
                  <Calendar className="w-4 h-4" /> Schôdzka
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              {contacts.length === 0 ? (
                <EmptyIllustration
                  variant="contacts"
                  title="Zatiaľ tu nič nie je"
                  hint="Pridaj prvý kontakt a začneme!"
                />
              ) : (
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: D.mutedDark }} />
                  <p className="text-sm" style={{ color: D.muted }}>Vyber kontakt zo zoznamu</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !saving && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#0a0d1a", border: `1px solid ${D.indigoBorder}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: D.text }}>Nový kontakt</h2>
                <button onClick={() => setShowModal(false)} disabled={saving} className="p-1">
                  <X className="w-5 h-5" style={{ color: D.muted }} />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: "name" as const, label: "Meno *", placeholder: "Peter Novák" },
                  { key: "company" as const, label: "Firma", placeholder: "Novák s.r.o." },
                  { key: "email" as const, label: "Email", placeholder: "peter@novak.sk" },
                  { key: "phone" as const, label: "Telefón", placeholder: "+421 900 000 000" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>{label}</label>
                    <input
                      type={key === "email" ? "email" : key === "phone" ? "tel" : "text"}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Uložiť
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Import CSV modal ── */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !importing && setShowImport(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#0a0d1a", border: `1px solid ${D.indigoBorder}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: D.text }}>Import CSV</h2>
                <button onClick={() => setShowImport(false)} disabled={importing} className="p-1">
                  <X className="w-5 h-5" style={{ color: D.muted }} />
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: D.muted }}>
                Podporované stĺpce: Meno, Firma, Email, Telefón, Poznámka. Prvý riadok musí byť hlavička.
                Duplikáty (rovnaký email alebo telefón) budú preskočené.
              </p>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImportFile(file);
                }}
                className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl cursor-pointer transition-colors"
                style={{
                  background: dragOver ? "rgba(99,102,241,0.15)" : D.indigoDim,
                  border: `1.5px dashed ${dragOver ? D.indigo : D.indigoBorder}`,
                }}
              >
                {importing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: D.indigo }} />
                    <span className="text-sm" style={{ color: D.text }}>Importujem…</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-8 h-8" style={{ color: D.indigo }} />
                    <span className="text-sm font-medium" style={{ color: D.text }}>
                      Klikni alebo pretiahni CSV súbor
                    </span>
                    <span className="text-[10px]" style={{ color: D.mutedDark }}>
                      max 5 MB · max 5000 riadkov
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
