// src/lib/verification-gate.ts
// Gate helpers pre features ktoré vyžadujú overený email.
//
// Politika:
//   • Prvých N AI requestov je zadarmo aj bez verifikácie (trial experience
//     aby ľudia nemuseli vybaľovať inbox pred prvým "wow" momentom).
//   • Po prekročení trial limitu → požadujeme verifikovaný email.
//   • Platené plány (pro, enterprise) — verifikovaný email povinný vždy
//     (pridá sa pri Stripe integrácii).
//
// Konštanta `UNVERIFIED_AI_TRIAL` je zámerne v kóde — malá, nepotrebuje admin UI.
// Ak ju budeš chcieť meniť často, presuň do site-settings.ts.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const UNVERIFIED_AI_TRIAL = 10;

export interface VerificationGateResult {
  ok: boolean;
  response?: NextResponse;
}

/**
 * Overí či používateľ môže robiť AI request. Vráti { ok:true } ak áno, alebo
 * { ok:false, response } (402 Payment Required s friendly message + CTA).
 *
 * Prečo 402 a nie 403: 403 = nikdy nemôžeš, 402 = pay-per-action (tu: overiť
 * email). Frontend to rozlíši a zobrazí banner "overte email" namiesto "zákaz".
 */
export async function requireAiAccess(userId: string): Promise<VerificationGateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerifiedAt: true,
      _count: { select: { aiRequests: true } },
    },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Session expirovala" }, { status: 401 }),
    };
  }

  // Verifikovaní prejdú vždy.
  if (user.emailVerifiedAt) return { ok: true };

  // Neverifikovaní: prvých N requestov zadarmo (trial).
  if (user._count.aiRequests < UNVERIFIED_AI_TRIAL) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "email_verification_required",
        message: `Využil si ${UNVERIFIED_AI_TRIAL} ukážkových AI správ. Pre pokračovanie si overte email — poslali sme ti link pri registrácii. Môžeš ho dať znova odoslať v Nastaveniach.`,
        trialUsed: user._count.aiRequests,
        trialLimit: UNVERIFIED_AI_TRIAL,
      },
      { status: 402 },
    ),
  };
}

/**
 * Prísnejšia verzia — vyžaduje verifikovaný email bez ohľadu na trial.
 * Použije sa pri platených plánoch (Stripe checkout, admin upgrady).
 */
export async function requireVerifiedEmail(userId: string): Promise<VerificationGateResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Session expirovala" }, { status: 401 }),
    };
  }
  if (user.emailVerifiedAt) return { ok: true };

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: "email_verification_required",
        message: "Táto funkcia vyžaduje overený email. Pošli si znova verifikačný link v Nastaveniach.",
      },
      { status: 402 },
    ),
  };
}
