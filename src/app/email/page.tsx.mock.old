"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Inbox, Send, FileText, Trash2, Star, Search, Plus, Reply, Forward, Archive } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  read: boolean;
  starred: boolean;
  folder: "inbox" | "sent" | "drafts" | "trash";
  attachments?: { name: string; size: string }[];
}

const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
};

const MOCK_EMAILS: Email[] = [
  { id: "1", from: "Peter Vittek <peter@vittek.sk>", to: "user@unifyo.sk", subject: "Žiadosť o hypotéku", preview: "Dobrý deň, posielam dokumenty na...", content: "Dobrý deň,\n\nposielam dokumenty na vybavenie hypotéky. Termín stretnutia je utorok o 14:00.\n\nS pozdravom,\nPeter Vittek", date: "10:30", read: false, starred: true, folder: "inbox" },
  { id: "2", from: "Mária Nováková <maria.n@gmail.com>", to: "user@unifyo.sk", subject: "Referencia - brat", preview: "Ahoj, posielam kontakt na môjho brata...", content: "Ahoj,\n\nposielam kontakt na môjho brata. Chce tiež riešiť financie.\n\nMária", date: "Včera", read: true, starred: false, folder: "inbox" },
  { id: "3", from: "user@unifyo.sk", to: "Ján Kováč <jan.kovac@seznam.cz>", subject: "Re: Nový lead", preview: "Ďakujem za záujem, volám vám zajtra...", content: "Ďakujem za záujem,\n\nvolám vám zajtra o 10:00 na detailné prebratie ponuky.\n\nS pozdravom", date: "Pondelok", read: true, starred: false, folder: "sent" },
];

const FOLDERS = [
  { id: "inbox", label: "Prijaté", icon: Inbox },
  { id: "sent", label: "Odoslané", icon: Send },
  { id: "drafts", label: "Koncepty", icon: FileText },
  { id: "trash", label: "Kôš", icon: Trash2 },
];

export default function EmailPage() {
  const [emails] = useState<Email[]>(MOCK_EMAILS);
  const [selectedFolder, setSelectedFolder] = useState<Email["folder"]>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmails = emails.filter(e => 
    e.folder === selectedFolder &&
    (e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
     e.from.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout title="Email">
      <div className="flex flex-col md:flex-row h-full p-4 md:p-6 gap-4 md:gap-6">
        {/* Folders — row on mobile, column on desktop */}
        <div className="flex md:flex-col md:w-[200px] gap-1 overflow-x-auto md:overflow-x-visible flex-shrink-0">
          <button
            className="hidden md:flex items-center gap-3 px-4 py-3 rounded-xl mb-3 text-sm font-medium flex-shrink-0"
            style={{ background: D.indigo, color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Nový email
          </button>
          {FOLDERS.map((folder) => {
            const Icon = folder.icon;
            const count = emails.filter(e => e.folder === folder.id && !e.read).length;
            return (
              <button
                key={folder.id}
                onClick={() => { setSelectedFolder(folder.id as Email["folder"]); setSelectedEmail(null); }}
                className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 rounded-xl text-sm transition-all flex-shrink-0"
                style={{
                  background: selectedFolder === folder.id ? "rgba(99,102,241,0.15)" : "transparent",
                  border: selectedFolder === folder.id ? `1px solid ${D.indigoBorder}` : "1px solid transparent",
                  color: selectedFolder === folder.id ? D.text : D.muted,
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-left">{folder.label}</span>
                {count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: D.rose, color: "white" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Email list — hidden on mobile when an email is selected */}
        <div
          className={`${selectedEmail ? "hidden md:flex" : "flex"} flex-1 flex-col md:max-w-[450px]`}
          style={{ borderRight: `1px solid ${D.indigoBorder}` }}
        >
          <div className="p-4" style={{ borderBottom: `1px solid ${D.indigoBorder}` }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: D.muted }} />
              <input
                type="text"
                placeholder="Hľadať emaily..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-sm"
                style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filteredEmails.map((email) => (
              <motion.div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className="p-4 cursor-pointer transition-all"
                style={{
                  background: selectedEmail?.id === email.id ? "rgba(99,102,241,0.1)" : email.read ? "transparent" : "rgba(99,102,241,0.05)",
                  borderBottom: `1px solid ${D.indigoBorder}`,
                }}
                whileHover={{ background: "rgba(99,102,241,0.08)" }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); /* toggle star */ }}
                    className="mt-0.5"
                  >
                    <Star className="w-4 h-4" style={{ color: email.starred ? "#f59e0b" : D.mutedDark, fill: email.starred ? "#f59e0b" : "none" }} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate text-sm" style={{ color: email.read ? D.text : "#fff", fontWeight: email.read ? 400 : 600 }}>
                        {email.from.split("<")[0].trim()}
                      </span>
                      <span className="text-xs whitespace-nowrap" style={{ color: D.muted }}>{email.date}</span>
                    </div>
                    <p className="text-sm font-medium truncate" style={{ color: D.text }}>{email.subject}</p>
                    <p className="text-xs truncate" style={{ color: D.muted }}>{email.preview}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Email detail */}
        <div
          className={`${selectedEmail ? "flex" : "hidden md:flex"} flex-1 flex-col rounded-2xl p-4 md:p-6`}
          style={{ background: "rgba(99,102,241,0.03)", border: `1px solid ${D.indigoBorder}` }}
        >
          {selectedEmail ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-2 rounded-lg"
                  style={{ background: D.indigoDim }}
                  aria-label="Späť"
                >
                  <span style={{ color: D.text }}>←</span>
                </button>
                <button className="p-2 rounded-lg" style={{ background: D.indigoDim }}>
                  <Reply className="w-4 h-4" style={{ color: D.text }} />
                </button>
                <button className="p-2 rounded-lg" style={{ background: D.indigoDim }}>
                  <Forward className="w-4 h-4" style={{ color: D.text }} />
                </button>
                <button className="p-2 rounded-lg" style={{ background: D.indigoDim }}>
                  <Archive className="w-4 h-4" style={{ color: D.text }} />
                </button>
                <button className="p-2 rounded-lg" style={{ background: D.indigoDim }}>
                  <Trash2 className="w-4 h-4" style={{ color: D.text }} />
                </button>
              </div>

              <h2 className="text-lg font-semibold mb-4" style={{ color: D.text }}>{selectedEmail.subject}</h2>
              
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: D.indigo, color: "white" }}>
                  {selectedEmail.from[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium" style={{ color: D.text }}>{selectedEmail.from.split("<")[0].trim()}</p>
                  <p className="text-sm" style={{ color: D.muted }}>{selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from}</p>
                </div>
                <span className="text-xs" style={{ color: D.muted }}>{selectedEmail.date}</span>
              </div>

              <div className="flex-1 prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap" style={{ color: D.text }}>{selectedEmail.content}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: D.mutedDark }} />
                <p className="text-sm" style={{ color: D.muted }}>Vyberte email pre zobrazenie</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
