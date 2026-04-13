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
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#030712] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#030712] to-transparent z-10 pointer-events-none" />

      <p className="text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-700 mb-8">
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
              className="flex items-center gap-2.5 opacity-30 hover:opacity-80 transition-opacity duration-300 cursor-default select-none flex-shrink-0"
            >
              <span className="text-lg">{logo.icon}</span>
              <span className="text-sm font-semibold text-gray-400 tracking-tight">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
