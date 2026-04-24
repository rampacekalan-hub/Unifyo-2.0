"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Phone, Mail, Plus, X, Pencil, Trash2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface Note { id: string; content: string; createdAt: string; }
interface Contact {
  id: string; name: string; company?: string | null;
  email?: string | null; phone?: string | null;
  notes?: Note[];
}

const D = { indigo: "#6366f1", indigoBorder: "rgba(99,102,241,0.20)", indigoDim: "rgba(99,102,241,0.10)", muted: "#6b7280", text: "var(--app-text)" };

const EMPTY = { name: "", company: "", email: "", phone: "" };

function ContactForm({ contact, onClose, onSave }: { contact: Partial<Contact> | null; onClose: () => void; onSave: (d: typeof EMPTY) => Promise<void>; }) {
  const [form, setForm] = useState({ ...EMPTY, ...contact });
  const [saving, setSaving] = useState(false);
  const ic = "w-full bg-transparent rounded-xl px-3 py-2 text-sm outline-none border border-white/10 focus:border-indigo-500/50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl p-6" style={{ background: "rgba(10,12,28,0.97)", border: `1px solid ${D.indigoBorder}`, backdropFilter: "blur(32px)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm" style={{ color: D.text }}>{contact?.id ? "Upraviť kontakt" : "Nový kontakt"}</h3>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form as typeof EMPTY); setSaving(false); }} className="space-y-3">
          {[["Meno *", "name", "text", true], ["Firma", "company", "text", false], ["Email", "email", "email", false], ["Telefón", "phone", "tel", false]].map(([label, key, type, req]) => (
            <div key={key as string}>
              <label className="text-[0.65rem] uppercase tracking-widest mb-1 block" style={{ color: D.muted }}>{label as string}</label>
              <input type={type as string} required={!!req} value={(form as unknown as Record<string, string>)[key as string] ?? ""}
                onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))}
                className={ic} style={{ color: D.text }} />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg,${D.indigo},#4f46e5)`, boxShadow: `0 0 16px rgba(99,102,241,0.3)` }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (contact?.id ? "Uložiť" : "Pridať kontakt")}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: D.muted }}>Zrušiť</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ContactSheet({ contact, onClose, onEdit, onDelete }: { contact: Contact; onClose: () => void; onEdit: () => void; onDelete: () => void; }) {
  const [notes, setNotes] = useState<Note[]>(contact.notes ?? []);
  const [noteText, setNoteText] = useState("");
  const [sending, setSending] = useState(false);

  async function addNote() {
    if (!noteText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/crm/notes", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, content: noteText.trim() }) });
      if (res.ok) {
        const n = await res.json() as Note;
        setNotes(prev => [n, ...prev]);
        setNoteText("");
        toast.success("Poznámka uložená");
      } else {
        toast.error("Uloženie poznámky zlyhalo");
      }
    } catch { toast.error("Problém s pripojením"); }
    setSending(false);
  }

  async function deleteNote(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
    const res = await fetch("/api/crm/notes", { method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, contactId: contact.id }) });
    if (!res.ok) {
      toast.error("Odstránenie poznámky zlyhalo");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="w-full max-w-sm h-full flex flex-col overflow-hidden"
        style={{ background: "rgba(8,10,22,0.97)", borderLeft: `1px solid ${D.indigoBorder}`, backdropFilter: "blur(40px)" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: `1px solid ${D.indigoBorder}` }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${D.indigo},#8b5cf6)`, boxShadow: `0 0 20px rgba(99,102,241,0.3)` }}>
                <span className="text-white text-lg font-black">{contact.name.charAt(0)}</span>
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: D.text }}>{contact.name}</p>
                {contact.company && <p className="text-xs" style={{ color: D.muted }}>{contact.company}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"><Pencil className="w-3.5 h-3.5" style={{ color: D.muted }} /></button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" style={{ color: "#f87171" }} /></button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-1"><X className="w-4 h-4" style={{ color: D.muted }} /></button>
            </div>
          </div>
          <div className="space-y-1.5">
            {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-xs group">
              <Mail className="w-3 h-3 flex-shrink-0" style={{ color: D.indigo }} />
              <span className="group-hover:underline truncate" style={{ color: D.muted }}>{contact.email}</span>
            </a>}
            {contact.phone && <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-xs group">
              <Phone className="w-3 h-3 flex-shrink-0" style={{ color: D.indigo }} />
              <span className="group-hover:underline" style={{ color: D.muted }}>{contact.phone}</span>
            </a>}
          </div>
        </div>

        {/* Notes */}
        <div className="flex-1 flex flex-col overflow-hidden px-5 py-4">
          <p className="text-[0.62rem] font-bold tracking-widest uppercase mb-3" style={{ color: D.muted }}>História / Poznámky</p>
          <div className="flex-1 overflow-y-auto space-y-2 mb-4" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
            <AnimatePresence initial={false}>
              {notes.map(n => (
                <motion.div key={n.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="group rounded-xl p-3 relative"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs leading-relaxed pr-6" style={{ color: D.text }}>{n.content}</p>
                  <p className="text-[0.6rem] mt-1.5" style={{ color: D.muted }}>{new Date(n.createdAt).toLocaleDateString("sk-SK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  <button onClick={() => deleteNote(n.id)} className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
                    <X className="w-3 h-3" style={{ color: D.muted }} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {notes.length === 0 && <p className="text-xs text-center py-6" style={{ color: D.muted }}>Žiadne poznámky</p>}
          </div>

          {/* Add note */}
          <div className="flex gap-2 flex-shrink-0">
            <input value={noteText} onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(); } }}
              placeholder="Pridať poznámku…"
              className="flex-1 bg-transparent rounded-xl px-3 py-2 text-sm outline-none border border-white/10 focus:border-indigo-500/50 transition-all"
              style={{ color: D.text, caretColor: D.indigo }} />
            <button onClick={addNote} disabled={sending || !noteText.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
              style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: D.indigo }} /> : <Send className="w-3.5 h-3.5" style={{ color: D.indigo }} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-2xl animate-pulse"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: "rgba(99,102,241,0.12)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded-full w-32" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-2.5 rounded-full w-20" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

export default function CrmModule() {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Contact> | null | false>(false);
  const [detail, setDetail] = useState<Contact | null>(null);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const search = q ?? query;
      const res = await fetch(`/api/crm/contacts${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      } else {
        toast.error("Chyba pri načítaní kontaktov");
      }
    } catch {
      toast.error("Problém s pripojením k databáze");
    } finally { setLoading(false); }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  async function handleSave(data: typeof EMPTY) {
    const editing = form && (form as Contact).id;
    try {
      let res: Response;
      if (editing) {
        res = await fetch("/api/crm/contacts", { method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: (form as Contact).id, ...data }) });
      } else {
        res = await fetch("/api/crm/contacts", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data) });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Uloženie zlyhalo");
        return;
      }
      // Optimistic: add/update immediately, then re-fetch
      const saved = await res.json() as Contact;
      if (editing) {
        setContacts(prev => prev.map(c => c.id === saved.id ? { ...c, ...saved } : c));
        toast.success("Kontakt aktualizovaný");
      } else {
        setContacts(prev => [saved, ...prev]);
        toast.success("Vedomosť úspešne integrovaná", { description: `${saved.name} pridaný do CRM` });
      }
      setForm(false);
    } catch {
      toast.error("Problém s pripojením — skúste znova");
    }
  }

  async function deleteContact(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id));
    setDetail(null);
    const res = await fetch("/api/crm/contacts", { method: "DELETE",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) {
      toast.success("Kontakt odstránený");
    } else {
      toast.error("Odstránenie zlyhalo");
      load();
    }
  }

  const filtered = useMemo(() => {
    if (!query) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
  }, [contacts, query]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5" style={{ minHeight: 0 }}>

      {/* Header */}
      <div className="flex items-center gap-3 max-w-xl mb-5">
        <div className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${D.indigoBorder}`, backdropFilter: "blur(16px)" }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: D.muted }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Hľadať kontakt, firmu, email…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
            style={{ color: D.text, caretColor: D.indigo }} />
          {query && <button onClick={() => setQuery("")} className="opacity-40 hover:opacity-80"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <button onClick={() => setForm({})}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${D.indigo},#4f46e5)`, boxShadow: `0 0 14px rgba(99,102,241,0.3)` }}>
          <Plus className="w-3.5 h-3.5" /> Pridať
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex-1 space-y-2 overflow-hidden">
          {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => (
              <motion.div key={c.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.16, delay: i * 0.03 }}
                className="flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer group transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => (e.currentTarget.style.background = D.indigoDim)}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                onClick={() => setDetail(c)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}>
                  <span className="text-sm font-bold" style={{ color: D.indigo }}>{c.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: D.text }}>{c.name}</p>
                  {c.company && <p className="text-xs truncate" style={{ color: D.muted }}>{c.company}</p>}
                </div>
                <div className="hidden sm:flex items-center gap-3 opacity-60">
                  {c.email && <Mail className="w-3.5 h-3.5" style={{ color: D.muted }} />}
                  {c.phone && <Phone className="w-3.5 h-3.5" style={{ color: D.muted }} />}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <User className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: D.muted }} />
              <p className="text-sm mb-3" style={{ color: D.muted }}>{query ? `Žiadne výsledky pre „${query}"` : "Zatiaľ žiadne kontakty"}</p>
              {!query && <button onClick={() => setForm({})} className="text-xs px-4 py-2 rounded-xl font-semibold"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: "#a5b4fc" }}>
                + Pridať prvý kontakt
              </button>}
            </div>
          )}
        </div>
      )}

      {/* Form dialog */}
      <AnimatePresence>
        {form !== false && <ContactForm contact={form} onClose={() => setForm(false)} onSave={handleSave} />}
      </AnimatePresence>

      {/* Detail sheet */}
      <AnimatePresence>
        {detail && (
          <ContactSheet
            contact={detail}
            onClose={() => setDetail(null)}
            onEdit={() => { setForm(detail); setDetail(null); }}
            onDelete={() => deleteContact(detail.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
