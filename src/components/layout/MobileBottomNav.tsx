"use client";
// src/components/layout/MobileBottomNav.tsx
// Thumb-reachable bottom navigation for mobile (<md). Hidden on desktop.
// 5 main destinations — everything else stays in the hamburger drawer.
// Mounted in AppLayout so it overlays the main scroll area.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, BarChart3, Calendar, Settings as SettingsIcon } from "lucide-react";

const ITEMS = [
  { href: "/dashboard-overview", label: "Prehľad", icon: LayoutDashboard },
  { href: "/dashboard",          label: "AI",      icon: Bot },
  { href: "/crm",                label: "CRM",     icon: BarChart3 },
  { href: "/calendar",           label: "Kalendár",icon: Calendar },
  { href: "/settings",           label: "Účet",    icon: SettingsIcon },
];

export default function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
      style={{
        background: "rgba(10,12,24,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(99,102,241,0.22)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Hlavná mobilná navigácia"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
            style={{
              color: active ? "#eef2ff" : "#6b7280",
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl px-4 py-1"
              style={{
                background: active ? "rgba(99,102,241,0.18)" : "transparent",
                boxShadow: active ? "0 0 14px rgba(99,102,241,0.28)" : "none",
              }}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: active ? "#6366f1" : "#6b7280" }}
              />
            </div>
            <span className="text-[9px] font-semibold tracking-wide">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
