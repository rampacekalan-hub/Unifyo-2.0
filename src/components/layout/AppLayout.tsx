"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import NeuralBackground from "@/components/ui/NeuralBackground";
import FloatingAIWidget from "@/components/ui/FloatingAIWidget";
import Sidebar, { type SidebarUser } from "@/components/layout/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  user?: SidebarUser;
}

// Design tokens — aligned with DashboardClient + Sidebar
const D = {
  indigo: "#6366f1",
  sky: "#22d3ee",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
};

export default function AppLayout({ children, subtitle, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [fetchedUser, setFetchedUser] = useState<SidebarUser | null>(user ?? null);

  useEffect(() => {
    if (user) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();
        if (alive && data?.user) setFetchedUser(data.user);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const activeUser = user ?? fetchedUser;
  const displayTitle =
    activeUser?.name?.split(" ")[0] ||
    activeUser?.email?.split("@")[0] ||
    "User";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#05070f", color: D.text }}
    >
      <NeuralBackground />

      {/* Shared sidebar */}
      <Sidebar user={activeUser} />

      {/* Main content */}
      <main className="flex-1 flex flex-col z-10 overflow-hidden relative">
        <header
          className="h-16 flex items-center justify-between pl-16 md:pl-6 pr-4 md:pr-6 flex-shrink-0"
          style={{
            borderBottom: `1px solid ${D.indigoBorder}`,
            background: "rgba(5,7,15,0.55)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div>
            <p
              className="text-[0.6rem] font-medium tracking-widest uppercase"
              style={{ color: "#10b981" }}
            >
              ● Systémy online{" "}
              {pathname?.startsWith("/dashboard") ? "• AI Pripojený" : ""}
            </p>
            <h1 className="text-sm font-bold mt-0.5">
              {subtitle ? subtitle : "Vitaj späť,"}{" "}
              <span
                style={{
                  background: `linear-gradient(90deg,${D.violet},${D.sky})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {displayTitle}
              </span>
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>

        <FloatingAIWidget />
      </main>
    </div>
  );
}
