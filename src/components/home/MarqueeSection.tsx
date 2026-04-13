"use client";

const logos = [
  { name: "Next.js", icon: "▲" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Prisma", icon: "◆" },
  { name: "Hetzner", icon: "⬡" },
  { name: "TypeScript", icon: "TS" },
  { name: "Tailwind CSS", icon: "🌊" },
  { name: "Vercel", icon: "▲" },
  { name: "React", icon: "⚛" },
];

export default function MarqueeSection() {
  return (
    <section className="py-16 relative overflow-hidden border-y border-white/5">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #05070f, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #05070f, transparent)" }} />

      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] mb-8" style={{ color: "#374151" }}>
        Postavené na špičkových technológiách
      </p>

      <div className="flex">
        <div
          className="flex items-center gap-14 animate-marquee whitespace-nowrap"
          style={{ animation: "marquee 22s linear infinite" }}
        >
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex items-center gap-2.5 cursor-default select-none flex-shrink-0" style={{ opacity: 0.28 }}
            >
              <span className="text-lg">{logo.icon}</span>
              <span className="text-sm font-semibold tracking-tight" style={{ color: "#6b7280" }}>{logo.name}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
