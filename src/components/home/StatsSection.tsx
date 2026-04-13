"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { label: "Aktívnych tímov", value: 2400, suffix: "+" },
  { label: "Spravovaných projektov", value: 18000, suffix: "+" },
  { label: "Ušetrených hodín mesačne", value: 100, suffix: "+" },
  { label: "Dostupnosť systému", value: 99.9, suffix: "%", decimals: 1 },
];

function CountUp({ target, suffix, decimals = 0, active }: { target: number; suffix: string; decimals?: number; active: boolean }) {
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
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString("sk")}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 px-6 relative">
      {/* Subtle violet glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="w-[600px] h-[200px] bg-[#7c3aed]/[0.04] blur-[100px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-[#0a0a0a]">
            Čísla, ktoré hovoria za všetko
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center gap-2 p-6 rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <span className="text-4xl md:text-5xl font-black tracking-tight text-[#0a0a0a] tabular-nums">
                <CountUp
                  target={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  active={inView}
                />
              </span>
              <span className="text-[0.72rem] text-[#a1a1aa] font-medium tracking-wider uppercase">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
