"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { label: "Odozva AI", value: 490, suffix: "ms", decimals: 0, prefix: "<" },
  { label: "SLA dostupnosť", value: 99.9, suffix: "%", decimals: 1, prefix: "" },
  { label: "Jazyky", value: 2, suffix: "", decimals: 0, prefix: "" },
  { label: "GDPR súlad", value: 100, suffix: "%", decimals: 0, prefix: "" },
];

function CountUp({ target, suffix, decimals = 0, active, prefix = "" }: { target: number; suffix: string; decimals?: number; active: boolean; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, target]);

  return (
    <span>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString("sk")}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-20 px-6 relative">
      <div className="max-w-5xl mx-auto">
        {/* Top divider */}
        <div className="w-full h-px mb-16" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-2"
            >
              <span className="font-black tabular-nums tracking-tight"
                style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "var(--app-text)" }}>
                <CountUp
                  target={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  active={inView}
                  prefix={stat.prefix}
                />
              </span>
              <span className="text-[0.7rem] font-medium tracking-[0.14em] uppercase" style={{ color: "var(--app-text-muted)" }}>
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Bottom divider */}
        <div className="w-full h-px mt-16" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />
      </div>
    </section>
  );
}
