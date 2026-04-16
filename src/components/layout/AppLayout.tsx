"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut, Users, Calendar, Mail, BarChart3, LayoutDashboard, MessageSquare,
  Phone, Settings, Zap
} from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import FloatingAIWidget from "@/components/ui/FloatingAIWidget";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  user?: { name?: string; email?: string; role?: string };
}

// MODULES - exact same as DashboardClient
const MODULES = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", color: "#6366f1" },
  { id: "ai-chat", label: "AI Chat", icon: MessageSquare, href: "/dashboard", color: "#8b5cf6" },
  { id: "crm", label: "CRM", icon: Users, href: "/crm", color: "#22d3ee", pro: true },
  { id: "calendar", label: "Kalendár", icon: Calendar, href: "/calendar", color: "#a78bfa" },
  { id: "email", label: "Email", icon: Mail, href: "/email", color: "#10b981" },
  { id: "calls", label: "Hovory", icon: Phone, href: "/calls", color: "#94a3b8", disabled: true },
  { id: "analytics", label: "Analytika", icon: BarChart3, href: "/analytics", color: "#94a3b8", disabled: true },
  { id: "automation", label: "Automation Builder", icon: Zap, href: "/automation", color: "#94a3b8", disabled: true },
];

// Design tokens - EXACT same as DashboardClient
const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  indigoGlow: "rgba(99,102,241,0.28)",
};

const GLASS = {
  background: "rgba(8,10,22,0.65)",
  backdropFilter: "blur(20px)",
};

export default function AppLayout({ children, title, subtitle, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("User");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();
        if (data.user) {
          const name = data.user.name?.split(" ")[0] || data.user.email?.split("@")[0] || "User";
          setDisplayName(name);
        }
      } catch {}
    };
    fetchUser();
  }, []);

  const displayTitle = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || displayName;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#05070f", color: "#eef2ff" }}>
      <NeuralBackground className="!z-0" />

      {/* Sidebar - EXACT same style as DashboardClient */}
      <aside className="w-16 md:w-60 flex-shrink-0 flex flex-col h-full z-10" style={{ ...GLASS, borderRight: `1px solid ${D.indigoBorder}` }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 md:px-5 gap-3 flex-shrink-0" style={{ borderBottom: `1px solid ${D.indigoBorder}` }}>
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: `0 0 16px ${D.indigoGlow}` }}>
            <span className="text-white text-[11px] font-black">U</span>
          </div>
          <span className="font-bold text-lg hidden md:block" style={{ color: D.text }}>Unifyo</span>
        </div>

        {/* Navigation - EXACT same as DashboardClient */}
        <nav className="flex-1 py-4 px-2 md:px-3 overflow-y-auto">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = pathname?.startsWith(mod.href) || (mod.id === "ai-chat" && pathname === "/dashboard");
            const isDisabled = (mod as { disabled?: boolean }).disabled;
            
            if (isDisabled) {
              return (
                <div key={mod.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 cursor-not-allowed opacity-60" style={{ color: D.mutedDark }}>
                  <Icon className="w-5 h-5" style={{ color: D.mutedDark }} />
                  <span className="text-sm font-medium hidden md:block">{mod.label}</span>
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium hidden md:block" style={{ background: "#64748b20", color: "#64748b" }}>🔒</span>
                </div>
              );
            }
            
            return (
              <Link key={mod.id} href={mod.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all"
                style={{
                  background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                  border: isActive ? `1px solid ${D.indigoBorder}` : "1px solid transparent",
                  color: isActive ? D.text : D.muted,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: isActive ? mod.color : D.muted }} />
                <span className="text-sm font-medium hidden md:block">{mod.label}</span>
                {(mod as { pro?: boolean }).pro && (
                  <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium hidden md:block" style={{ background: "#f59e0b20", color: "#f59e0b" }}>pro</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section - EXACT same as DashboardClient */}
        <div className="p-2 md:p-3 flex-shrink-0" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-sm" style={{ color: D.muted }}>
            <Settings className="w-5 h-5" />
            <span className="hidden md:block">Nastavenia</span>
          </Link>
          <Link href="/logout" className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm" style={{ color: D.muted }}>
            <LogOut className="w-5 h-5" />
            <span className="hidden md:block">Odhlásiť sa</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col z-10 overflow-hidden relative">
        {/* Topbar - EXACT same style as DashboardClient */}
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderBottom: `1px solid ${D.indigoBorder}`, background: "rgba(5,7,15,0.55)", backdropFilter: "blur(24px)" }}>
          <div>
            <p className="text-[0.6rem] font-medium tracking-widest uppercase" style={{ color: "#10b981" }}>
              ● Systémy online {pathname?.startsWith("/dashboard") ? "• AI Pripojený" : ""}
            </p>
            <h1 className="text-sm font-bold mt-0.5">
              {subtitle ? subtitle : "Vitaj späť,"}{" "}
              <span style={{ background: `linear-gradient(90deg,${D.violet},${D.sky})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {displayTitle}
              </span>
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>

        {/* Floating AI Widget - on every page */}
        <FloatingAIWidget />
      </main>
    </div>
  );
}
