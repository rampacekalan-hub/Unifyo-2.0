"use client";
// Tiny client button used in the footer to reopen the CookieConsent banner.

import { openCookieManager } from "@/components/ui/CookieConsent";

export default function CookieManagerButton() {
  return (
    <button
      type="button"
      onClick={openCookieManager}
      className="text-[0.72rem] transition-colors duration-200 hover:text-[#a78bfa]"
      style={{ color: "#64748b" }}
    >
      Spravovať cookies
    </button>
  );
}
