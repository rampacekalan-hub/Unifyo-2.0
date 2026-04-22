"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={scrolled ? {
        background: "var(--app-surface-2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(139,92,246,0.1)",
      } : {}}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              boxShadow: "0 0 16px rgba(124,58,237,0.3)",
            }}>
            <span className="text-white text-[11px] font-black tracking-tight">U</span>
          </div>
          <span className="font-bold text-[1.05rem] tracking-tight" style={{ color: "#eef2ff" }}>
            {config.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {config.links.nav.slice(0, 2).map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("#")[0]));
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm rounded-lg transition-all duration-200 relative"
                style={{ color: isActive ? "#eef2ff" : "#94a3b8" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#eef2ff")}
                onMouseLeave={e => (e.currentTarget.style.color = isActive ? "#eef2ff" : "#94a3b8")}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-px rounded-full" style={{ background: "#8b5cf6" }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm px-4 py-2 rounded-lg transition-all duration-200" style={{ color: "#94a3b8" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#eef2ff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}>
            Prihlásiť sa
          </Link>
          <Link href="/register"
            className="text-sm text-white px-5 py-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 2px 16px rgba(124,58,237,0.25)",
            }}>
            Začať zadarmo
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-3 -mr-2 text-gray-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{
              background: "var(--app-surface-2)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(139,92,246,0.1)",
            }}
          >
            <div className="px-5 py-4 flex flex-col gap-1">
              {config.links.nav.slice(0, 2).map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("#")[0]));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="py-3 px-4 text-sm rounded-xl transition-all duration-200"
                    style={{
                      color: isActive ? "#eef2ff" : "#94a3b8",
                      background: isActive ? "rgba(139,92,246,0.08)" : "transparent",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-3 border-t mt-2 flex flex-col gap-2" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="text-center text-sm py-3 rounded-xl transition-all duration-200"
                  style={{ color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Prihlásiť sa
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="text-center text-sm text-white font-semibold py-3 rounded-xl"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                  Začať zadarmo →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
