import Link from "next/link";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function Footer() {
  return (
    <footer className="relative" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
      {/* Top fade line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)" }}
      />

      <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", boxShadow: "0 0 12px rgba(124,58,237,0.25)" }}>
                <span className="text-white text-[10px] font-black">U</span>
              </div>
              <span className="font-bold text-sm tracking-tight" style={{ color: "#eef2ff" }}>
                {config.name}
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-[180px]" style={{ color: "#64748b" }}>
              {config.texts.footer.tagline}
            </p>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
              <span className="text-[0.68rem]" style={{ color: "#64748b" }}>Všetky systémy fungujú</span>
            </div>
          </div>

          {/* Nav col */}
          <div className="flex flex-col gap-3.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#94a3b8" }}>
              Navigácia
            </p>
            {config.links.nav.slice(0, 3).map((link) => (
              <Link key={link.href} href={link.href}
                className="text-xs transition-colors duration-200 hover:text-white"
                style={{ color: "#64748b" }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Account col */}
          <div className="flex flex-col gap-3.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#94a3b8" }}>
              Účet
            </p>
            {config.links.nav.slice(3).map((link) => (
              <Link key={link.href} href={link.href}
                className="text-xs transition-colors duration-200 hover:text-white"
                style={{ color: "#64748b" }}>
                {link.label}
              </Link>
            ))}
            <Link href="/register"
              className="text-xs transition-colors duration-200"
              style={{ color: "#8b5cf6" }}>
              Začať zadarmo →
            </Link>
          </div>

          {/* Legal col */}
          <div className="flex flex-col gap-3.5">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "#94a3b8" }}>
              Právne & Kontakt
            </p>
            {config.links.legal.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-xs transition-colors duration-200 hover:text-white"
                style={{ color: "#64748b" }}>
                {link.label}
              </Link>
            ))}
            <a href={`mailto:${config.links.contact.email}`}
              className="text-xs transition-colors duration-200 hover:text-white"
              style={{ color: "#64748b" }}>
              {config.links.contact.email}
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px mb-6" style={{ background: "rgba(139,92,246,0.08)" }} />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.68rem]" style={{ color: "#64748b" }}>
            {config.texts.footer.copyright}
          </p>
          <div className="flex items-center gap-5">
            <span className="text-[0.68rem]" style={{ color: "#64748b" }}>
              🇸🇰 Made in Slovakia
            </span>
            {config.links.social.map((s) => (
              <a key={s.platform} href={s.href}
                target="_blank" rel="noopener noreferrer"
                aria-label={s.label}
                className="text-[0.68rem] transition-colors duration-200 hover:text-[#a78bfa]"
                style={{ color: "#64748b" }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
