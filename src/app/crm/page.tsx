"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Calendar, Mail, Search, Plus, Phone, Briefcase, X, Trash2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New contact form
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });

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

  // Delete contact
  async function handleDelete(id: string) {
    if (!confirm("Naozaj zmazať tento kontakt?")) return;
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Kontakt zmazaný");
        if (selectedContact?.id === id) setSelectedContact(null);
        loadContacts(searchQuery);
      }
    } catch {
      toast.error("Nepodarilo sa zmazať");
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
              <div className="text-center py-10">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: D.mutedDark }} />
                <p className="text-sm" style={{ color: D.muted }}>
                  {searchQuery ? "Žiadne výsledky" : "Zatiaľ žiadne kontakty"}
                </p>
                <p className="text-xs mt-2" style={{ color: D.mutedDark }}>
                  Pridaj manuálne alebo cez AI chat.
                </p>
              </div>
            ) : contacts.map((contact) => (
              <motion.div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  background: selectedContact?.id === contact.id ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.05)",
                  border: `1px solid ${selectedContact?.id === contact.id ? D.indigoBorder : "transparent"}`,
                }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
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
            ))}
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
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: D.mutedDark }} />
                <p className="text-sm" style={{ color: D.muted }}>
                  {contacts.length === 0
                    ? "Zatiaľ nemáš žiadne kontakty"
                    : "Vyber kontakt zo zoznamu"}
                </p>
              </div>
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
    </AppLayout>
  );
}
