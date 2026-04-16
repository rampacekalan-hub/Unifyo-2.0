"use client";
// src/components/layout/Sidebar.tsx
// SINGLE SOURCE OF TRUTH sidebar — used across AppLayout + DashboardClient
// Changes here reflect on every page automatically.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot, Calendar, Mail, Phone, BarChart3, Zap,
  Lock, LogOut, ShieldAlert,
} from "lucide-react";

export interface SidebarUser {
  id?: string;
  email?: string;
  name?: string | null;
  role?: string;
  membershipTier?: string;
}

interface SidebarProps {
  user?: SidebarUser | null;
  /** Optional runtime-toggleable flags for disabling modules per admin panel */
  liveToggles?: Record<string, boolean> | null;
}

// ── Design tokens (align w/ DashboardClient) ──────────────────────
const D = {
  indigo: "#6366f1",
  indigoDim: "rgba(99,102,241,0.10)",
  indigoBorder: "rgba(99,102,241,0.20)",
  indigoGlow: "rgba(99,102,241,0.28)",
  text: "#eef2ff",
  muted: "#6b7280",
  mutedDark: "#374151",
};

const GLASS: React.CSSProperties = {
  background: "rgba(10,12,24,0.65)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  borderRight: `1px solid ${D.indigoBorder}`,
};

// ── Unified module list ───────────────────────────────────────────
// Order mirrors DashboardClient sidebar. `enabled:false` = greyed out + lock.
interface ModuleDef {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  enabled?: boolean;
  pro?: boolean;
}

const MODULES: ModuleDef[] = [
  { id: "dashboard", label: "AI Chat",    href: "/dashboard", icon: Bot },
  { id: "crm",       label: "CRM",        href: "/crm",       icon: BarChart3, pro: true },
  { id: "calendar",  label: "Kalendár",   href: "/calendar",  icon: Calendar },
  { id: "email",     label: "Email",      href: "/email",     icon: Mail },
  { id: "calls",     label: "Hovory",     href: "/calls",     icon: Phone,    enabled: false },
  { id: "analytics", label: "Analytika",  href: "/analytics", icon: BarChart3, enabled: false },
  { id: "automation",label: "Automation", href: "/automation",icon: Zap,       enabled: false },
];

export default function Sidebar({ user, liveToggles }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const isSuperAdmin = user?.role === "SUPERADMIN" || user?.role === "ADMIN";

  return (
    <aside
      className="w-16 md:w-60 flex-shrink-0 flex flex-col h-full z-10"
      style={GLASS}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center px-4 md:px-5 gap-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${D.indigoBorder}` }}
      >
        <div
          className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
            boxShadow: `0 0 16px ${D.indigoGlow}`,
          }}
        >
          <span className="text-white text-[11px] font-black">U</span>
        </div>
        <span className="font-bold text-sm hidden md:block" style={{ color: D.text }}>
          Unifyo
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const liveEnabled =
            liveToggles && mod.id in liveToggles ? liveToggles[mod.id] : undefined;
          const isDisabled =
            mod.enabled === false || liveEnabled === false;
          const isActive =
            !isDisabled &&
            (pathname.startsWith(mod.href) ||
              (mod.id === "dashboard" && pathname === "/dashboard"));

          return (
            <Link
              key={mod.id}
              href={isDisabled ? "#" : mod.href}
              onClick={(e) => {
                if (isDisabled) e.preventDefault();
              }}
              title={isDisabled ? "Čoskoro dostupné" : mod.label}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1.5 transition-all duration-200"
              style={{
                background: isActive ? D.indigoDim : "transparent",
                border: isActive ? `1px solid ${D.indigoBorder}` : "1px solid transparent",
                boxShadow: isActive ? `0 0 14px ${D.indigoGlow}` : "none",
                opacity: isDisabled ? 0.35 : 1,
                cursor: isDisabled ? "not-allowed" : "pointer",
              }}
            >
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: isActive ? D.indigo : D.muted }}
              />
              <span
                className="text-xs font-medium hidden md:block flex-1 text-left"
                style={{ color: isActive ? D.text : D.muted }}
              >
                {mod.label}
              </span>
              {isDisabled && (
                <Lock className="w-3 h-3 ml-auto hidden md:block" style={{ color: D.mutedDark }} />
              )}
              {mod.pro && !isDisabled && (
                <span
                  className="text-[0.6rem] px-1.5 py-0.5 rounded-full ml-auto hidden md:block"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  pro
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        className="p-4 flex-shrink-0"
        style={{ borderTop: `1px solid ${D.indigoBorder}` }}
      >
        {/* SYSTEM CONTROL — only for admins */}
        {isSuperAdmin && (
          <Link
            href="/admin"
            className="w-full flex items-center gap-2 px-2 py-2.5 rounded-xl mb-2 transition-all duration-200 relative overflow-hidden"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(245,158,11,0.45)",
              color: "#f59e0b",
              boxShadow: "0 0 10px rgba(239,68,68,0.15)",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{ opacity: [0.08, 0.22, 0.08] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(239,68,68,0.30) 0%, transparent 70%)",
              }}
            />
            <ShieldAlert
              className="w-4 h-4 flex-shrink-0 relative z-10"
              style={{ filter: "drop-shadow(0 0 5px #ef4444)" }}
            />
            <span
              className="text-xs font-bold hidden md:block relative z-10 tracking-widest uppercase"
              style={{ color: "#f59e0b", letterSpacing: "0.08em" }}
            >
              System Control
            </span>
          </Link>
        )}

        {/* Logout */}
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all duration-200"
            style={{ color: D.muted }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = D.text;
              (e.currentTarget as HTMLButtonElement).style.background = D.indigoDim;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = D.muted;
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs hidden md:block">Odhlásiť</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
