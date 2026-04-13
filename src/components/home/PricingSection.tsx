"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const YEARLY_DISCOUNT = 0.8; // 20% zľava

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);
  if (!config.features.showPricing) return null;

  return (
    <section id="pricing" className="py-28 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-[#7c3aed]/[0.04] blur-[130px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 flex flex-col items-center gap-5"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#7c3aed]/[0.07] text-[#7c3aed] border border-[#7c3aed]/[0.15]">
            Cenník
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] text-[#0a0a0a]">
            Transparentné ceny,{" "}
            <span style={{
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              žiadne prekvapenia
            </span>
          </h2>

          {/* Monthly / Yearly toggle */}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-sm transition-colors duration-200 ${!yearly ? "text-[#0a0a0a]" : "text-[#a1a1aa]"}`}>
              Mesačne
            </span>
            <button
              onClick={() => setYearly((v) => !v)}
              className="relative w-12 h-6 rounded-full bg-black/[0.06] border border-black/[0.1] transition-all duration-300 focus:outline-none"
              aria-label="Toggle billing period"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-5 h-5 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                style={{ left: yearly ? "26px" : "2px" }}
              />
            </button>
            <span className={`text-sm transition-colors duration-200 ${yearly ? "text-[#0a0a0a]" : "text-[#a1a1aa]"}`}>
              Ročne
            </span>
            <AnimatePresence>
              {yearly && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20"
                >
                  -20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {config.pricing.map((plan, i) => {
            const displayPrice = plan.price > 0
              ? yearly ? Math.round(plan.price * YEARLY_DISCOUNT) : plan.price
              : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col"
              >
                {/* Spinning conic-gradient border for highlighted plan */}
                {plan.highlighted && (
                  <div
                    className="absolute -inset-[1px] rounded-2xl -z-10"
                    style={{
                      background: "conic-gradient(from var(--angle), #6366f1, #8b5cf6, #a78bfa, #6366f1)",
                      animation: "spin-border 4s linear infinite",
                    }}
                  />
                )}

                <div className={`relative flex flex-col h-full rounded-2xl p-6 border transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-white border-transparent shadow-[0_8px_40px_rgba(124,58,237,0.12)]"
                    : "bg-white border-black/[0.07] hover:border-[#7c3aed]/[0.2] hover:shadow-[0_4px_20px_rgba(124,58,237,0.06)]"
                }`}>
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-4 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-5 mt-1">
                    <h3 className="text-base font-semibold text-white mb-1 tracking-tight">{plan.name}</h3>
                    <p className="text-sm text-[#475569]">{plan.description}</p>
                  </div>

                  {/* Price with animated transition */}
                  <div className="mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${plan.id}-${yearly}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-end gap-1"
                      >
                        <span className="text-4xl font-black tracking-tight text-[#0a0a0a]">
                          {displayPrice === 0 ? "Zadarmo" : `${plan.currency}${displayPrice}`}
                        </span>
                        {displayPrice > 0 && (
                          <span className="text-[#a1a1aa] text-sm mb-1.5">
                            /{yearly ? "mes. (ročne)" : plan.interval}
                          </span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 flex-1 mb-7">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          feature.included ? "bg-[rgba(99,102,241,0.15)]" : "bg-white/[0.04]"
                        }`}>
                          {feature.included
                            ? <Check className="w-2.5 h-2.5 text-[#6366f1]" />
                            : <X className="w-2.5 h-2.5 text-[#2d3748]" />
                          }
                        </div>
                        {feature.tooltip ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={`text-sm cursor-help underline decoration-dotted underline-offset-2 ${
                                feature.included ? "text-[#18181b]" : "text-[#d4d4d8]"
                              }`}>
                                {feature.text}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white border-black/[0.1] text-[#18181b] text-xs max-w-[200px] leading-relaxed shadow-lg">
                              {feature.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className={`text-sm ${feature.included ? "text-[#18181b]" : "text-[#d4d4d8]"}`}>
                            {feature.text}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={plan.id === "enterprise" ? `mailto:${config.links.contact.email}` : "/register"}>
                    <Button className={`w-full h-11 font-semibold transition-all duration-300 rounded-xl ${
                      plan.highlighted
                        ? "bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-0 shadow-[0_2px_12px_rgba(124,58,237,0.3)] hover:shadow-[0_4px_24px_rgba(124,58,237,0.45)]"
                        : "bg-[#f4f4f5] text-[#52525b] border-0 hover:bg-[#eeeeef] hover:text-[#0a0a0a]"
                    }`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spin-border {
          to { --angle: 360deg; }
        }
      `}</style>
    </section>
  );
}
