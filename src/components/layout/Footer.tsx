import Link from "next/link";
import { Zap } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function Footer() {
  return (
    <footer className="relative border-t border-black/[0.07] bg-[#fafafa]">

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand col */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_10px_rgba(124,58,237,0.25)]">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-[0.95rem] text-[#0a0a0a] tracking-tight">{config.name}</span>
            </div>
            <p className="text-[0.8rem] text-[#71717a] leading-relaxed max-w-[200px]">
              {config.texts.footer.tagline}
            </p>
          </div>

          {/* Navigácia */}
          <div className="flex flex-col gap-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#a1a1aa]">
              Navigácia
            </p>
            {config.links.nav.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-[#52525b] hover:text-[#0a0a0a] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Produkt */}
          <div className="flex flex-col gap-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#a1a1aa]">
              Účet
            </p>
            {config.links.nav.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-[#52525b] hover:text-[#0a0a0a] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Právne */}
          <div className="flex flex-col gap-4">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#a1a1aa]">
              Právne
            </p>
            {config.links.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.8rem] text-[#52525b] hover:text-[#0a0a0a] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${config.links.contact.email}`}
              className="text-[0.8rem] text-[#52525b] hover:text-[#0a0a0a] transition-colors duration-200"
            >
              {config.links.contact.email}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-black/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.72rem] text-[#a1a1aa]">{config.texts.footer.copyright}</p>
          <div className="flex items-center gap-5">
            {config.links.social.map((s) => (
              <a
                key={s.platform}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-[0.72rem] text-[#a1a1aa] hover:text-[#7c3aed] transition-colors duration-200"
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
