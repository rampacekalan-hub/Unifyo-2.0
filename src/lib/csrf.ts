// src/lib/csrf.ts
// Origin-based CSRF guard — defense-in-depth nad sameSite=Lax cookies.
//
// Prečo to chceme aj keď máme sameSite=Lax:
//  • Chrome má 2-minútový "Lax+POST" grace window po set-cookie, kedy
//    top-level cross-site POST PREJDE. Táto kontrola to zabije.
//  • Ak sa niekedy zmení cookie na sameSite=None pre embed scenár,
//    toto zostane ako druhá vrstva.
//  • Chráni aj non-cookie autorizáciu (API tokeny, headers) ak ju niekedy
//    pridáme — tam sameSite neplatí.
//
// Použitie v route handleroch:
//
//   export async function POST(req: NextRequest) {
//     const csrf = requireSameOrigin(req);
//     if (csrf) return csrf;
//     // … zvyšok logiky
//   }
//
// `requireAuth` toto volá automaticky, takže authenticated mutation routes
// nemusia nič doplniť. Volaj explicitne iba v unauthenticated mutation
// endpointoch (login, register, forgot-password, contact, errors/log…).

import { NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Vráti `null` ak request je same-origin (alebo safe method), inak 403 response.
 * Akceptuje štandardný `Request` aj `NextRequest` — oba majú `.method` a `.headers`.
 */
export function requireSameOrigin(req: Request): NextResponse | null {
  if (SAFE_METHODS.has(req.method)) return null;

  const host = req.headers.get("host");
  if (!host) {
    // Nemalo by nastať — host hlavička je v HTTP/1.1+ povinná.
    return deny("missing host");
  }

  // Preferuj Sec-Fetch-Site (moderný prehliadač) — najspoľahlivejší signál.
  // - "same-origin" / "same-site": OK
  // - "cross-site": block
  // - "none": user-initiated (typing URL, bookmark) — pri mutation endpoint
  //   to znamená attacker trik (form submit z cudzieho tabu). Block.
  const sfs = req.headers.get("sec-fetch-site");
  if (sfs) {
    if (sfs === "same-origin" || sfs === "same-site") return null;
    return deny(`sec-fetch-site=${sfs}`);
  }

  // Fallback pre staršie prehliadače / non-browser klientov (Postman, curl):
  // porovnaj Origin alebo Referer host s request hostom.
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const source = origin || referer;
  if (!source) {
    // Non-browser klient bez origin — necháme prejsť, lebo by to inak
    // blokovalo legitímne server-to-server calls (napr. Stripe webhook).
    // Webhook endpointy si aj tak overujú signature zvlášť.
    return null;
  }

  let sourceHost: string;
  try {
    sourceHost = new URL(source).host;
  } catch {
    return deny("malformed origin/referer");
  }

  if (sourceHost !== host) {
    return deny(`origin host mismatch (${sourceHost} vs ${host})`);
  }
  return null;
}

function deny(reason: string): NextResponse {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[csrf] blocked: ${reason}`);
  }
  return NextResponse.json(
    { error: "Cross-origin request rejected" },
    { status: 403 }
  );
}
