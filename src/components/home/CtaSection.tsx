"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl p-12 overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/20 via-[#2563eb]/10 to-[#4c1d95]/20 rounded-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.05)_1px,transparent_1px)] bg-[size:32px_32px] rounded-3xl" />
          <div className="absolute inset-px rounded-3xl border border-[#7c3aed]/20" />

          {/* Content */}
          <div className="relative z-10">
            <p className="text-[#a78bfa] text-sm font-semibold uppercase tracking-widest mb-4">
              Začni ešte dnes
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
              Tvoj biznis na{" "}
              <span style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                autopilote
              </span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
              Vyber plán, zaplať a začni ihneď. Plány od 8,99 €/mes. Zrušenie kedykoľvek.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold transition-all active:scale-95 shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:shadow-[0_0_50px_rgba(124,58,237,0.6)]"
              >
                Začať teraz
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/[0.04] hover:bg-white/10 text-white font-medium border border-white/10 transition-all"
              >
                Porozprávať sa s nami
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
