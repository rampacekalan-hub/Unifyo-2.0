"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] transition-shadow duration-300">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#0a0a0a]">
            {config.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {config.links.nav.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-[#52525b] hover:text-[#0a0a0a] rounded-lg hover:bg-black/[0.04] transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-[#52525b] hover:text-[#0a0a0a] hover:bg-black/[0.04]">
              Prihlásiť sa
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-0 shadow-[0_2px_12px_rgba(124,58,237,0.35)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.5)] transition-all duration-200"
            >
              Začať zadarmo
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-[#52525b] hover:text-[#0a0a0a] transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-black/[0.06] overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              {config.links.nav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 text-[#52525b] hover:text-[#0a0a0a] rounded-lg hover:bg-black/[0.04] transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-black/[0.06] mt-2">
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-0">
                    Začať zadarmo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
