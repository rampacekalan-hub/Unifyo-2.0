import Link from "next/link";
import { Zap } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      {/* subtle top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand col */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.35)]">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-[0.95rem] text-white tracking-tight">{config.name}</span>
            </div>
            <p className="text-[0.8rem] text-[#3d4b5c] leading-relaxed max-w-[200px]">
              {config.texts.footer.tagline}
            </p>
          </div>

          {/* Navigácia */}
          <div className="flex flex-col gap-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#334155]">
              Navigácia
            </p>
            {config.links.nav.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-[#475569] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Produkt */}
          <div className="flex flex-col gap-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#334155]">
              Účet
            </p>
            {config.links.nav.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-[#475569] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Právne */}
          <div className="flex flex-col gap-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#334155]">
              Právne
            </p>
            {config.links.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-[#475569] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${config.links.contact.email}`}
              className="text-[0.8rem] text-[#475569] hover:text-white transition-colors duration-200"
            >
              {config.links.contact.email}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.72rem] text-[#2d3748]">{config.texts.footer.copyright}</p>
          <div className="flex items-center gap-5">
            {config.links.social.map((s) => (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-[0.72rem] text-[#2d3748] hover:text-[#6366f1] transition-colors duration-200"
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
