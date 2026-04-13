"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const YEARLY_DISCOUNT = 0.8;

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);
  if (!config.features.showPricing) return null;

  return (
    <section id="pricing" className="py-28 px-6 relative">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14 flex flex-col items-center gap-4"
        >
          <span className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: "#6b7280" }}>
            Cenník
          </span>
          <h2 className="font-black tracking-[-0.03em] leading-[1.08]"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3.2rem)", color: "#eef2ff" }}>
            Transparentné ceny,{" "}
            <span style={{
              background: "linear-gradient(90deg, #a78bfa, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              žiadne prekvapenia
            </span>
          </h2>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Žiadne skryté poplatky · Fakturácia v EUR · Zrušenie kedykoľvek
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm transition-colors duration-200"
              style={{ color: !yearly ? "#eef2ff" : "#4b5563" }}>
              Mesačne
            </span>
            <button
              onClick={() => setYearly(v => !v)}
              className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              style={{
                background: yearly ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
              aria-label="Prepnúť fakturačné obdobie"
            >
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 600, damping: 34 }}
                className="absolute top-0.5 w-5 h-5 rounded-full"
                style={{
                  left: yearly ? "22px" : "2px",
                  background: yearly
                    ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
                    : "rgba(255,255,255,0.3)",
                }}
              />
            </button>
            <span className="text-sm transition-colors duration-200"
              style={{ color: yearly ? "#eef2ff" : "#4b5563" }}>
              Ročne
            </span>
            <AnimatePresence>
              {yearly && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.2 }}
                  className="text-[0.68rem] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    color: "#34d399",
                  }}
                >
                  −20%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {config.pricing.map((plan, i) => {
            const displayPrice = plan.price > 0
              ? (yearly ? Math.round(plan.price * YEARLY_DISCOUNT * 10) / 10 : plan.price)
              : 0;
            const isHighlighted = plan.highlighted;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.09, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="relative flex flex-col"
              >
                {/* Highlighted top accent line */}
                {isHighlighted && (
                  <div className="absolute -top-px left-6 right-6 h-px rounded-full"
                    style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, #67e8f9, transparent)" }}
                  />
                )}

                <div
                  className="relative flex flex-col h-full rounded-2xl p-6 transition-all duration-300"
                  style={isHighlighted ? {
                    background: "linear-gradient(160deg, rgba(139,92,246,0.1) 0%, rgba(12,15,26,0.95) 60%, rgba(6,182,212,0.05) 100%)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    boxShadow: "0 0 0 1px rgba(139,92,246,0.1), 0 8px 40px rgba(124,58,237,0.12)",
                  } : {
                    background: "rgba(12,15,26,0.6)",
                    border: "1px solid rgba(139,92,246,0.1)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[0.68rem] font-bold px-3 py-1 rounded-full"
                        style={{
                          background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                          color: "#fff",
                          boxShadow: "0 2px 12px rgba(124,58,237,0.35)",
                        }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan name + desc */}
                  <div className="mb-5 mt-1">
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase mb-2"
                      style={{ color: isHighlighted ? "#a78bfa" : "#4b5563" }}>
                      {plan.name}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "#4b5563" }}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6 pb-6" style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${plan.id}-${yearly}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        className="flex items-end gap-1.5"
                      >
                        <span className="font-black tracking-tight leading-none" style={{ fontSize: "2.6rem", color: "#eef2ff" }}>
                          {displayPrice === 0 ? "Free" : `${plan.currency}${displayPrice}`}
                        </span>
                        {displayPrice > 0 && (
                          <span className="text-xs mb-1.5 pb-0.5" style={{ color: "#4b5563" }}>
                            /{yearly ? "mes" : plan.interval}
                            {yearly && <span style={{ color: "#34d399" }}> · ročne</span>}
                          </span>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-2.5 flex-1 mb-7">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{
                            background: feature.included ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
                            border: feature.included ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(255,255,255,0.05)",
                          }}>
                          {feature.included
                            ? <Check className="w-2.5 h-2.5" style={{ color: "#a78bfa" }} />
                            : <Minus className="w-2.5 h-2.5" style={{ color: "#374151" }} />
                          }
                        </div>
                        {feature.tooltip ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-xs leading-relaxed cursor-help underline decoration-dotted underline-offset-2"
                                style={{ color: feature.included ? "#9ca3af" : "#374151" }}>
                                {feature.text}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              className="text-xs max-w-[200px] leading-relaxed"
                              style={{
                                background: "#0c0f1a",
                                border: "1px solid rgba(139,92,246,0.2)",
                                color: "#9ca3af",
                              }}>
                              {feature.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs leading-relaxed"
                            style={{ color: feature.included ? "#9ca3af" : "#374151" }}>
                            {feature.text}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.id === "enterprise" ? `mailto:${config.links.contact.email}` : "/register"}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                    style={isHighlighted ? {
                      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                      color: "#fff",
                      boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(124,58,237,0.3)",
                    } : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(139,92,246,0.15)",
                      color: "#6b7280",
                    }}
                  >
                    {plan.cta}
                    {isHighlighted && <ArrowRight className="w-3.5 h-3.5" />}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-6"
        >
          {["🔒 GDPR súlad", "🇸🇰 SK & ČR podpora", "⚡ AES-256 šifrovanie", "↩ Zrušenie kedykoľvek"].map(item => (
            <span key={item} className="text-xs" style={{ color: "#374151" }}>{item}</span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
