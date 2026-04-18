"use client";
// Shared brand mark for auth pages (login, register, forgot/reset, verify).
// Matches Navbar + email header: gradient U square + wordmark + Neural OS label.

import Link from "next/link";

export default function AuthBrand({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <Link href="/" className="flex items-center gap-2.5 group" aria-label="Unifyo">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            boxShadow: "0 0 20px rgba(124,58,237,0.4)",
          }}
        >
          <span className="text-white text-sm font-black tracking-tight">U</span>
        </div>
        <div className="text-left">
          <div
            className="font-bold text-[1.15rem] tracking-tight leading-none"
            style={{ color: "#eef2ff" }}
          >
            Unifyo
          </div>
          <div
            className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] mt-1"
            style={{ color: "#64748b" }}
          >
            Neural OS
          </div>
        </div>
      </Link>
      {subtitle && (
        <p className="text-sm mt-4" style={{ color: "#94a3b8" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function GradientTitle({
  before,
  accent,
  after,
  className = "text-2xl font-black tracking-tight",
}: {
  before?: string;
  accent: string;
  after?: string;
  className?: string;
}) {
  return (
    <h2 className={className} style={{ color: "#eef2ff", letterSpacing: "-0.02em" }}>
      {before && <span>{before} </span>}
      <span
        style={{
          background: "linear-gradient(90deg, #a78bfa, #67e8f9)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {accent}
      </span>
      {after && <span> {after}</span>}
    </h2>
  );
}
