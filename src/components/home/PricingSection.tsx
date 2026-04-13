"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function PricingSection() {
  if (!config.features.showPricing) return null;

  return (
    <section id="pricing" className="py-28 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#6366f1]/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center gap-4"
        >
          <Badge className="px-4 py-1.5 text-xs bg-[rgba(99,102,241,0.12)] text-[#a5b4fc] border border-[rgba(99,102,241,0.25)] rounded-full">
            Cenník
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Transparentné ceny,{" "}
            <span className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] bg-clip-text text-transparent">
              žiadne prekvapenia
            </span>
          </h2>
          <p className="text-[#94a3b8] text-lg max-w-xl">
            Vyberte si plán, ktorý zodpovedá veľkosti vášho tímu.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {config.pricing.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col rounded-2xl p-6 border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-[#1a1d2e] to-[#0f1117] border-[rgba(99,102,241,0.5)] shadow-[0_0_40px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(99,102,241,0.2)]"
                  : "bg-[#0f1117] border-[rgba(99,102,241,0.1)] hover:border-[rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-[#64748b]">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? "Zadarmo" : `${plan.currency}${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[#64748b] text-sm mb-1.5">/{plan.interval}</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        feature.included
                          ? "bg-[rgba(99,102,241,0.15)]"
                          : "bg-[rgba(100,116,139,0.1)]"
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-2.5 h-2.5 text-[#6366f1]" />
                      ) : (
                        <X className="w-2.5 h-2.5 text-[#475569]" />
                      )}
                    </div>
                    {feature.tooltip ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <span
                            className={`text-sm cursor-help underline decoration-dotted underline-offset-2 ${
                              feature.included ? "text-[#cbd5e1]" : "text-[#475569]"
                            }`}
                          >
                            {feature.text}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1e2535] border-[rgba(99,102,241,0.2)] text-[#cbd5e1] text-xs max-w-[200px]">
                          {feature.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span
                        className={`text-sm ${
                          feature.included ? "text-[#cbd5e1]" : "text-[#475569]"
                        }`}
                      >
                        {feature.text}
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={plan.id === "enterprise" ? `mailto:${config.links.contact.email}` : "/register"}>
                <Button
                  className={`w-full h-11 font-medium transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white border-0 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] hover:scale-[1.02]"
                      : "bg-[#161b27] text-[#cbd5e1] border border-[rgba(99,102,241,0.15)] hover:border-[rgba(99,102,241,0.4)] hover:bg-[rgba(99,102,241,0.06)] hover:text-white"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
