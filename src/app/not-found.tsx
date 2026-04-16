// src/app/not-found.tsx — 404 page with Unifyo visual

import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#080b12" }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Logo */}
        <h1
          className="text-2xl font-black tracking-tight mb-10"
          style={{ color: "#eef2ff" }}
        >
          Unifyo
        </h1>

        {/* Card */}
        <div
          className="rounded-2xl p-10"
          style={{
            background: "rgba(15,18,32,0.85)",
            border: "1px solid rgba(99,102,241,0.18)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 60px rgba(99,102,241,0.08)",
          }}
        >
          {/* 404 number */}
          <div
            className="text-8xl font-black leading-none mb-4 select-none"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.3))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </div>

          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "#eef2ff" }}
          >
            Stránka neexistuje
          </h2>
          <p
            className="text-sm mb-8 leading-relaxed"
            style={{ color: "#94a3b8" }}
          >
            Stránka, ktorú hľadáte, nebola nájdená.
            Možno bola presunutá alebo zmazaná.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #6366f1, #5b21b6)",
                color: "#fff",
                boxShadow: "0 0 20px rgba(99,102,241,0.35)",
              }}
            >
              Späť domov
            </Link>
            <a
              href="mailto:info@unifyo.online"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center transition-all active:scale-[0.98]"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.18)",
                color: "#eef2ff",
              }}
            >
              Kontakt podpory
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
