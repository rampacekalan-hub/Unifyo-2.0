"use client";

// Realistický stack, bez emoji placeholderov a bez Vercelu
// (Unifyo je self-hostovaná na Hetzneri).
const logos = [
  { name: "Next.js", icon: "▲" },
  { name: "React", icon: "⚛" },
  { name: "TypeScript", icon: "TS" },
  { name: "Tailwind CSS", icon: "~" },
  { name: "PostgreSQL", icon: "◉" },
  { name: "Prisma", icon: "◆" },
  { name: "Hetzner", icon: "⬡" },
  { name: "Stripe", icon: "S" },
];

export default function MarqueeSection() {
  return (
    <section className="py-16 relative overflow-hidden border-y border-white/5">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, #05070f, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, #05070f, transparent)" }} />

      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] mb-8" style={{ color: "var(--app-text-subtle)" }}>
        Postavené na špičkových technológiách
      </p>

      <div className="flex">
        <div
          className="flex items-center gap-8 sm:gap-14 animate-marquee whitespace-nowrap"
          style={{ animation: "marquee 22s linear infinite" }}
        >
          {[...logos, ...logos].map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex items-center gap-2.5 cursor-default select-none flex-shrink-0" style={{ opacity: 0.55 }}
            >
              <span className="text-lg" style={{ color: "#a78bfa" }}>{logo.icon}</span>
              <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--app-text-muted)" }}>{logo.name}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
