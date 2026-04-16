"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, Calendar, Mail, TrendingUp, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
};

const STATS = [
  { label: "Kontakty", value: "24", change: "+3", icon: Users, color: "#22d3ee", href: "/crm" },
  { label: "Schôdzky dnes", value: "3", change: "2 nové", icon: Calendar, color: "#8b5cf6", href: "/calendar" },
  { label: "Neprečítané", value: "5", change: "+2", icon: Mail, color: "#10b981", href: "/email" },
  { label: "AI Interakcie", value: "127", change: "tento týždeň", icon: MessageSquare, color: "#f59e0b", href: "/dashboard" },
];

const UPCOMING = [
  { id: "1", title: "Stretnutie - Peter Vittek", time: "14:00", type: "meeting" },
  { id: "2", title: "Telefonát - Mária Nováková", time: "16:30", type: "call" },
  { id: "3", title: "Deadline - Dokumentácia", time: "18:00", type: "task" },
];

const RECENT_CONTACTS = [
  { id: "1", name: "Peter Vittek", company: "Vittek Consulting", status: "Potenciálny" },
  { id: "2", name: "Mária Nováková", company: "Slovnaft", status: "Zákazník" },
  { id: "3", name: "Ján Kováč", company: "Kovac Trade", status: "Lead" },
];

export default function DashboardOverviewPage() {
  return (
    <AppLayout title="Dashboard" subtitle="Prehľad">
      <div className="p-6 space-y-6">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: `1px solid ${D.indigoBorder}` }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2" style={{ color: D.text }}>
              Vitaj späť v <span style={{ color: D.violet }}>Unifyo</span>
            </h2>
            <p className="text-sm" style={{ color: D.muted }}>
              Máte <span style={{ color: D.sky }}>3 nové udalosti</span> dnes a <span style={{ color: D.emerald }}>5 neprečítaných emailov</span>
            </p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20">
            <Sparkles className="w-full h-full" style={{ color: D.violet }} />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.color + "20" }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: D.indigoDim, color: D.muted }}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: D.text }}>{stat.value}</p>
                  <p className="text-sm" style={{ color: D.muted }}>{stat.label}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "16px" }}>
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-5"
            style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: D.text }}>Dnešné udalosti</h3>
              <Link href="/calendar" className="text-xs flex items-center gap-1" style={{ color: D.violet }}>
 Kalendár <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {UPCOMING.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: D.indigoDim }}>
                  <div className="w-12 text-center">
                    <p className="text-sm font-semibold" style={{ color: D.violet }}>{event.time}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: D.text }}>{event.title}</p>
                    <p className="text-xs" style={{ color: D.muted }}>{event.type === "meeting" ? "Stretnutie" : event.type === "call" ? "Hovor" : "Úloha"}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-xl p-5"
            style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: D.text }}>Posledné kontakty</h3>
              <Link href="/crm" className="text-xs flex items-center gap-1" style={{ color: D.sky }}>
                CRM <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {RECENT_CONTACTS.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: D.indigoDim }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: D.indigo, color: "white" }}>
                    {contact.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: D.text }}>{contact.name}</p>
                    <p className="text-xs" style={{ color: D.muted }}>{contact.company}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: D.emerald + "20", color: D.emerald }}>
                    {contact.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl p-5"
          style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
        >
          <h3 className="font-semibold mb-4" style={{ color: D.text }}>Rýchle akcie</h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/crm">
              <button className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: D.indigo, color: "white" }}>
                <Users className="w-4 h-4" />
                Pridať kontakt
              </button>
            </Link>
            <Link href="/calendar">
              <button className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: D.violet, color: "white" }}>
                <Calendar className="w-4 h-4" />
                Nová schôdzka
              </button>
            </Link>
            <Link href="/email">
              <button className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: D.emerald, color: "white" }}>
                <Mail className="w-4 h-4" />
                Napísať email
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: D.amber, color: "white" }}>
                <Sparkles className="w-4 h-4" />
                AI Asistent
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
