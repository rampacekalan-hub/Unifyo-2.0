"use client";
// src/app/dashboard-overview/page.tsx
// Live overview — pulls real data from CRM + Calendar + Conversations APIs.
// No more mock data.

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users, Calendar as CalendarIcon, Mail, MessageSquare, ArrowRight, Sparkles,
  Plus, TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
};

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
}
interface Task {
  id: string;
  title: string;
  date: string;
  time: string | null;
  done: boolean;
}
interface Convo {
  id: string;
  title: string;
  updatedAt: string;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DashboardOverviewPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [cRes, tRes, vRes] = await Promise.all([
          fetch("/api/crm/contacts"),
          fetch("/api/calendar/tasks"),
          fetch("/api/conversations"),
        ]);
        if (!alive) return;
        if (cRes.ok) setContacts(await cRes.json());
        if (tRes.ok) setTasks(await tRes.json());
        if (vRes.ok) setConvos(await vRes.json());
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const today = todayISO();
  const weekEnd = daysFromNow(7);

  const tasksToday = useMemo(
    () => tasks.filter((t) => t.date === today && !t.done),
    [tasks, today],
  );
  const tasksWeek = useMemo(
    () => tasks.filter((t) => t.date >= today && t.date <= weekEnd && !t.done).length,
    [tasks, today, weekEnd],
  );
  const tasksDone = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const contactsThisWeek = useMemo(
    () => contacts.filter((c) => c.createdAt >= daysFromNow(-7)).length,
    [contacts],
  );
  const recentContacts = useMemo(
    () => [...contacts]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5),
    [contacts],
  );
  const upcomingSoon = useMemo(
    () => tasks
      .filter((t) => t.date >= today && !t.done)
      .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 5),
    [tasks, today],
  );

  const STATS = [
    {
      label: "Kontakty", value: contacts.length,
      change: contactsThisWeek > 0 ? `+${contactsThisWeek} tento týždeň` : "žiadne nové",
      icon: Users, color: D.sky, href: "/crm",
    },
    {
      label: "Úlohy dnes", value: tasksToday.length,
      change: tasksToday.length === 0 ? "všetko hotové" : `${tasksToday.length} otvorených`,
      icon: CalendarIcon, color: D.violet, href: "/calendar",
    },
    {
      label: "Tento týždeň", value: tasksWeek,
      change: "plán úloh",
      icon: TrendingUp, color: D.emerald, href: "/calendar",
    },
    {
      label: "Rozhovory", value: convos.length,
      change: tasksDone > 0 ? `${tasksDone} úloh splnených` : "AI chat",
      icon: MessageSquare, color: D.amber, href: "/dashboard",
    },
  ];

  return (
    <AppLayout title="Prehľad" subtitle="Prehľad —">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))",
            border: `1px solid ${D.indigoBorder}`,
          }}
        >
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: D.text }}>
              Prehľad tvojho dňa
            </h2>
            <p className="text-sm" style={{ color: D.muted }}>
              {tasksToday.length > 0 ? (
                <>Máš <span style={{ color: D.sky }}>{tasksToday.length} {tasksToday.length === 1 ? "úlohu" : tasksToday.length < 5 ? "úlohy" : "úloh"}</span> naplánovaných na dnes</>
              ) : (
                <>Dnes nemáš žiadne naplánované úlohy — dobrý deň na plánovanie</>
              )}
              {contactsThisWeek > 0 && (
                <> a <span style={{ color: D.emerald }}>{contactsThisWeek} {contactsThisWeek === 1 ? "nový kontakt" : "nových kontaktov"}</span> tento týždeň</>
              )}
              .
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24 opacity-20 pointer-events-none">
            <Sparkles className="w-full h-full" style={{ color: D.violet }} />
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STATS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} href={s.href}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 md:p-5 rounded-xl cursor-pointer h-full"
                  style={{
                    background: "rgba(99,102,241,0.05)",
                    border: `1px solid ${D.indigoBorder}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center"
                      style={{ background: s.color + "22" }}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: D.text }}>
                    {loading ? <span className="inline-block w-8 h-6 rounded animate-pulse" style={{ background: "rgba(99,102,241,0.15)" }} /> : s.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: D.muted }}>{s.label}</p>
                  <p className="text-[0.65rem] mt-1 truncate" style={{ color: s.color }}>{s.change}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* Two-column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-5"
            style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm md:text-base" style={{ color: D.text }}>
                Nadchádzajúce úlohy
              </h3>
              <Link href="/calendar" className="text-xs flex items-center gap-1" style={{ color: D.violet }}>
                Kalendár <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <SkeletonList />
            ) : upcomingSoon.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="Žiadne úlohy"
                hint="Pridaj prvú v Kalendári alebo cez AI chat."
                cta={{ label: "Pridať úlohu", href: "/calendar" }}
              />
            ) : (
              <div className="space-y-2">
                {upcomingSoon.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: D.indigoDim }}
                  >
                    <div className="w-14 text-center flex-shrink-0">
                      <p className="text-[0.6rem] uppercase tracking-wide" style={{ color: D.muted }}>
                        {t.date === today ? "Dnes" : new Date(t.date).toLocaleDateString("sk-SK", { day: "numeric", month: "short" })}
                      </p>
                      {t.time && (
                        <p className="text-sm font-semibold" style={{ color: D.violet }}>{t.time}</p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: D.text }}>{t.title}</p>
                    </div>
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: D.muted }} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent contacts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-5"
            style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm md:text-base" style={{ color: D.text }}>
                Posledné kontakty
              </h3>
              <Link href="/crm" className="text-xs flex items-center gap-1" style={{ color: D.sky }}>
                CRM <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <SkeletonList />
            ) : recentContacts.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Žiadne kontakty"
                hint={'Pridaj prvého cez CRM alebo povedz AI: „Pridaj kontakt…".'}
                cta={{ label: "Pridať kontakt", href: "/crm" }}
              />
            ) : (
              <div className="space-y-2">
                {recentContacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: D.indigoDim }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                    >
                      {c.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: D.text }}>{c.name}</p>
                      <p className="text-xs truncate" style={{ color: D.muted }}>
                        {c.company ?? c.email ?? c.phone ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
        >
          <h3 className="font-semibold mb-4 text-sm md:text-base" style={{ color: D.text }}>
            Rýchle akcie
          </h3>
          <div className="flex flex-wrap gap-2 md:gap-3">
            <QuickAction href="/crm" icon={Users} label="Pridať kontakt" color={D.sky} />
            <QuickAction href="/calendar" icon={CalendarIcon} label="Nová úloha" color={D.violet} />
            <QuickAction href="/email" icon={Mail} label="Napísať email" color={D.emerald} />
            <QuickAction href="/dashboard" icon={Sparkles} label="AI Asistent" color={D.amber} />
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-12 rounded-lg animate-pulse"
          style={{ background: "rgba(99,102,241,0.08)" }}
        />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon, title, hint, cta,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  hint: string;
  cta: { label: string; href: string };
}) {
  return (
    <div className="text-center py-6">
      <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: D.mutedDark }} />
      <p className="text-sm font-medium" style={{ color: D.text }}>{title}</p>
      <p className="text-xs mb-3" style={{ color: D.muted }}>{hint}</p>
      <Link
        href={cta.href}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
          border: `1px solid ${D.indigoBorder}`,
          color: D.text,
        }}
      >
        <Plus className="w-3 h-3" />
        {cta.label}
      </Link>
    </div>
  );
}

function QuickAction({
  href, icon: Icon, label, color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium active:scale-95 transition-transform"
      style={{
        background: color,
        color: "white",
        boxShadow: `0 0 14px ${color}55`,
      }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
