"use client";
// src/components/layout/Sidebar.tsx
// SINGLE SOURCE OF TRUTH sidebar — used across AppLayout + DashboardClient
// Desktop (>=768px): permanent narrow/wide sidebar. Mobile (<768px): hamburger drawer.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Calendar, Mail, Phone, BarChart3, Zap, Kanban,
  Lock, LogOut, ShieldAlert, Menu, X, Settings as SettingsIcon, LayoutDashboard,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { usePrefs } from "@/lib/prefsContext";
import type { AppId } from "@/lib/userPrefs";

export interface SidebarUser {
  id?: string;
  email?: string;
  name?: string | null;
  role?: string;
  membershipTier?: string;
  // Null until the user finishes the onboarding wizard — AppLayout
  // reads this to redirect first-timers to /onboarding.
  onboardingCompletedAt?: string | null;
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
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
};

const GLASS: React.CSSProperties = {
  background: "var(--app-surface)",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  borderRight: `1px solid var(--app-border)`,
};

// ── Unified module list ───────────────────────────────────────────
// `appId` ties the module to a slot in `UserPrefs.enabledApps` — when
// set, the user can hide the module from Settings / onboarding.
// `always:true` modules (Prehľad, Analytika, Nastavenia) ignore the
// preference and stay visible regardless.
interface ModuleDef {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  enabled?: boolean;
  pro?: boolean;
  appId?: AppId;
  always?: boolean;
}

const MODULES: ModuleDef[] = [
  { id: "overview",  label: "Prehľad",    href: "/dashboard-overview", icon: LayoutDashboard, always: true },
  { id: "dashboard", label: "AI Chat",    href: "/dashboard", icon: Bot,      appId: "dashboard" },
  { id: "crm",       label: "CRM",        href: "/crm",       icon: BarChart3, appId: "crm" },
  { id: "pipeline",  label: "Pipeline",   href: "/pipeline",  icon: Kanban,    appId: "pipeline" },
  { id: "calendar",  label: "Kalendár",   href: "/calendar",  icon: Calendar,  appId: "calendar" },
  { id: "email",     label: "Email",      href: "/email",     icon: Mail,      appId: "email" },
  { id: "calls",     label: "Hovory",     href: "/calls",     icon: Phone,     appId: "calls" },
  { id: "analytics", label: "Analytika",  href: "/analytics", icon: BarChart3, always: true },
  { id: "automation",label: "Automatizácie", href: "/automation",icon: Zap,       appId: "automation" },
  { id: "settings",  label: "Nastavenia", href: "/settings",  icon: SettingsIcon, always: true },
];

export default function Sidebar({ user, liveToggles }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { prefs } = usePrefs();

  // Filter modules by user prefs — `always:true` overrides to prevent
  // the user from losing their escape hatch (Prehľad / Nastavenia).
  // If they're on the active route for a "hidden" module, we still
  // show it so the breadcrumb doesn't disappear mid-session.
  const enabled = new Set<AppId>(prefs.enabledApps);
  const visibleModules = MODULES.filter((m) => {
    if (m.always) return true;
    if (!m.appId) return true;
    if (enabled.has(m.appId)) return true;
    if (pathname.startsWith(m.href)) return true; // keep current route visible
    return false;
  });

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    // Wipe client-side caches so the next login on this browser starts
    // clean. (UserPrefsProvider also detects user-switch, but clearing
    // explicitly on logout prevents even a millisecond of stale state.)
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("unifyo.") && k !== "unifyo.cookie-consent.v1" && k !== "unifyo.onboarding.v1") {
          keys.push(k);
        }
        if (k.startsWith("waitlist:")) keys.push(k);
        if (k === "onboarding_dismissed") keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
    router.push("/login");
    router.refresh();
  }
  const isSuperAdmin = user?.role === "SUPERADMIN" || user?.role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);

  // Inner nav content — rendered both in desktop aside and mobile drawer
  const navContent = (isMobile: boolean) => (
    <>
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
        <span
          className={`font-bold text-sm ${isMobile ? "block" : "hidden md:block"}`}
          style={{ color: D.text }}
        >
          Unifyo
        </span>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg"
            aria-label="Zavrieť menu"
          >
            <X className="w-5 h-5" style={{ color: D.muted }} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const liveEnabled =
            liveToggles && mod.id in liveToggles ? liveToggles[mod.id] : undefined;
          const isDisabled = mod.enabled === false || liveEnabled === false;
          const isActive =
            !isDisabled &&
            (pathname.startsWith(mod.href) ||
              (mod.id === "dashboard" && pathname === "/dashboard"));

          return (
            <Link
              key={mod.id}
              href={isDisabled ? "#" : mod.href}
              onClick={(e) => {
                if (isDisabled) { e.preventDefault(); return; }
                if (isMobile) setMobileOpen(false);
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
                className={`text-xs font-medium flex-1 text-left ${isMobile ? "block" : "hidden md:block"}`}
                style={{ color: isActive ? D.text : D.muted }}
              >
                {mod.label}
              </span>
              {isDisabled && (
                <Lock
                  className={`w-3 h-3 ml-auto ${isMobile ? "block" : "hidden md:block"}`}
                  style={{ color: D.mutedDark }}
                />
              )}
              {mod.pro && !isDisabled && (
                <span
                  className={`text-[0.6rem] px-1.5 py-0.5 rounded-full ml-auto ${isMobile ? "block" : "hidden md:block"}`}
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
              className={`text-xs font-bold relative z-10 tracking-widest uppercase ${isMobile ? "block" : "hidden md:block"}`}
              style={{ color: "#f59e0b", letterSpacing: "0.08em" }}
            >
              System Control
            </span>
          </Link>
        )}

        {user && (
          <Link
            href="/settings"
            onClick={() => { if (isMobile) setMobileOpen(false); }}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-2xl mb-2 transition-all duration-200"
            style={{
              background: "rgba(99,102,241,0.06)",
              border: `1px solid ${D.indigoBorder}`,
            }}
          >
            <Avatar name={user.name} email={user.email} size={28} />
            <div className={`flex-1 min-w-0 ${isMobile ? "block" : "hidden md:block"}`}>
              <div
                className="text-[11px] font-semibold truncate"
                style={{ color: D.text }}
              >
                {user.name || user.email || "Účet"}
              </div>
              {user.email && user.name && (
                <div className="text-[10px] truncate" style={{ color: D.muted }}>
                  {user.email}
                </div>
              )}
            </div>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
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
          <span className={`text-xs ${isMobile ? "block" : "hidden md:block"}`}>Odhlásiť</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar (hidden <md) */}
      <aside
        className="hidden md:flex w-60 flex-shrink-0 flex-col h-full z-10"
        style={GLASS}
      >
        {navContent(false)}
      </aside>

      {/* Mobile hamburger button (visible <md) — floats top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2.5 rounded-xl"
        style={{
          background: "var(--app-surface)",
          border: `1px solid ${D.indigoBorder}`,
          backdropFilter: "blur(12px)",
        }}
        aria-label="Otvoriť menu"
      >
        <Menu className="w-5 h-5" style={{ color: D.text }} />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="md:hidden fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col"
              style={GLASS}
            >
              {navContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
