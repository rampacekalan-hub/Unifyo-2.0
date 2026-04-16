"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Calendar, Mail, Search, Plus, Phone, MapPin, Briefcase, Filter } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: "lead" | "prospect" | "customer" | "inactive";
  lastContact: string;
  notes: string;
}

const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  indigoGlow: "rgba(99,102,241,0.28)",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
};

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Peter Vittek", email: "peter@vittek.sk", phone: "+421 901 234 567", company: "Vittek Consulting", status: "prospect", lastContact: "2024-01-15", notes: "Záujem o hypotéku, stretnutie zajtra 14:00" },
  { id: "2", name: "Mária Nováková", email: "maria.n@gmail.com", phone: "+421 902 345 678", company: "Slovnaft", status: "customer", lastContact: "2024-01-10", notes: "Spokojná klientka, referencia na brata" },
  { id: "3", name: "Ján Kováč", email: "jan.kovac@seznam.cz", phone: "+420 603 123 456", company: "Kovac Trade", status: "lead", lastContact: "2024-01-20", notes: "Nový lead z webu, treba zavolať" },
  { id: "4", name: "Anna Horváthová", email: "anna.h@zoznam.sk", phone: "+421 903 456 789", company: "Technika s.r.o.", status: "inactive", lastContact: "2023-12-01", notes: "Neaktívna 2 mesiace, reaktivačný email" },
];

export default function CRMPage() {
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Contact["status"]) => {
    switch (status) {
      case "lead": return "#f59e0b";
      case "prospect": return "#6366f1";
      case "customer": return "#10b981";
      case "inactive": return "#64748b";
    }
  };

  const getStatusLabel = (status: Contact["status"]) => {
    switch (status) {
      case "lead": return "Lead";
      case "prospect": return "Potenciálny";
      case "customer": return "Zákazník";
      case "inactive": return "Neaktívny";
    }
  };

  return (
    <AppLayout title="Správa kontaktov">
      <div className="flex h-full p-6 gap-6">
        {/* Contact list */}
        <div className="flex-1 flex flex-col" style={{ maxWidth: "500px" }}>
          {/* Search and Add */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: D.muted }} />
              <input
                type="text"
                placeholder="Hľadať kontakt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
              />
            </div>
            <button className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium" style={{ background: D.indigo, color: "white" }}>
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Pridať</span>
            </button>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-auto space-y-2">
            {filteredContacts.map((contact) => (
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: getStatusColor(contact.status) + "30", color: getStatusColor(contact.status) }}>
                    {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate" style={{ color: D.text }}>{contact.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: getStatusColor(contact.status) + "30", color: getStatusColor(contact.status) }}>
                        {getStatusLabel(contact.status)}
                      </span>
                    </div>
                    <p className="text-sm truncate" style={{ color: D.muted }}>{contact.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact detail */}
        <div className="flex-1 rounded-2xl p-6" style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}>
          {selectedContact ? (
            <div className="h-full flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: getStatusColor(selectedContact.status) + "30", color: getStatusColor(selectedContact.status) }}>
                  {selectedContact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold" style={{ color: D.text }}>{selectedContact.name}</h2>
                  <p className="text-sm" style={{ color: D.muted }}>{selectedContact.company}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs" style={{ background: getStatusColor(selectedContact.status) + "30", color: getStatusColor(selectedContact.status) }}>
                    {getStatusLabel(selectedContact.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: D.muted }}>
                    <Phone className="w-4 h-4" />
                    <span className="text-xs uppercase">Telefón</span>
                  </div>
                  <p className="font-medium" style={{ color: D.text }}>{selectedContact.phone}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: D.muted }}>
                    <Mail className="w-4 h-4" />
                    <span className="text-xs uppercase">Email</span>
                  </div>
                  <p className="font-medium truncate" style={{ color: D.text }}>{selectedContact.email}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl mb-6 flex-1" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: D.muted }}>
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs uppercase">Poznámky</span>
                </div>
                <p style={{ color: D.text }}>{selectedContact.notes}</p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}>
                  <Phone className="w-4 h-4" />
                  Zavolať
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}>
                  <Mail className="w-4 h-4" />
                  Napísať
                </button>
                <Link href="/calendar" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white" }}>
                  <Calendar className="w-4 h-4" />
                  Schôdzka
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: D.mutedDark }} />
                <p className="text-sm" style={{ color: D.muted }}>Vyberte kontakt pre zobrazenie detailov</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
