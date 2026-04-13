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
          ? "bg-[#030712]/90 backdrop-blur-xl border-b border-white/5 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#2563eb] flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.3)] group-hover:shadow-[0_0_24px_rgba(124,58,237,0.5)] transition-shadow duration-300">
            <span className="text-white text-sm font-black">U</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            {config.name}<span className="text-[#a78bfa]">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {config.links.nav.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all">
            Prihlásiť sa
          </Link>
          <Link href="/register" className="text-sm text-white px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] font-medium">
            Začať teraz →
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
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
            className="md:hidden bg-[#030712]/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              {config.links.nav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 px-4 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/5 mt-2 flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center text-sm text-gray-300 py-2 border border-white/10 rounded-lg">
                  Prihlásiť sa
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="text-center text-sm text-white py-2 bg-[#7c3aed] rounded-lg font-medium">
                  Začať teraz →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
