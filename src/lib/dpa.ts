// src/lib/dpa.ts
// Active DPA version loader + bootstrap. We keep the actual contract
// text in code so version bumps go through git review, not an admin
// UI. On first request the row is upserted into DpaVersion if missing.

import { prisma } from "@/lib/prisma";

export const ACTIVE_DPA_VERSION = "1.0";

export const ACTIVE_DPA_BODY = `
ZMLUVA O SPRACÚVANÍ OSOBNÝCH ÚDAJOV (DPA)
podľa čl. 28 GDPR (Nariadenie EÚ 2016/679)

Verzia: ${ACTIVE_DPA_VERSION}
Účinnosť od: 2026-04-01

1. ZMLUVNÉ STRANY
   Sprostredkovateľ: Unifyo s.r.o. (operátor platformy unifyo.online)
   Prevádzkovateľ: subjekt identifikovaný v podpisovej časti

2. PREDMET SPRACÚVANIA
   Sprostredkovateľ spracúva osobné údaje výhradne v rozsahu nevyhnutnom
   pre poskytovanie služby Unifyo (CRM, kalendár, e-mail, AI asistent,
   prepisy hovorov).

3. KATEGÓRIE DOTKNUTÝCH OSÔB
   Kontakty Prevádzkovateľa, jeho zamestnanci, klienti a obchodní partneri.

4. KATEGÓRIE OSOBNÝCH ÚDAJOV
   Identifikačné údaje (meno, priezvisko, e-mail, telefón), profesijné
   údaje, obsah komunikácie, audio nahrávky a ich prepisy.

5. UMIESTNENIE A PRENOS ÚDAJOV
   Všetky údaje sú hostované v Európskej únii (Hetzner Online GmbH,
   Nemecko). Žiadne osobné údaje sa neprenášajú mimo EÚ. Pre potreby
   AI-funkcionality sa údaje pred spracovaním anonymizujú podľa
   GDPR Privacy Shield politiky platformy.

6. SUB-SPROSTREDKOVATELIA
   Sprostredkovateľ využíva podporných sub-sprostredkovateľov:
   - OpenAI Ireland Ltd. (AI inferencia, EU-only deployment)
   - Stripe Payments Europe Ltd. (platby)
   Aktuálny zoznam je dostupný na unifyo.online/sukromie.

7. BEZPEČNOSTNÉ OPATRENIA
   TLS 1.3 šifrovanie pri prenose, AES-256 pri ukladaní hesiel,
   2FA pre prístup, audit log prihlásení, pravidelný backup, mesačné
   bezpečnostné záplaty serverov.

8. PRÁVA DOTKNUTÝCH OSÔB
   Sprostredkovateľ pomáha Prevádzkovateľovi reagovať na žiadosti
   dotknutých osôb (export, oprava, zmazanie) v lehote 30 dní.

9. OZNAMOVANIE INCIDENTOV
   Bezpečnostné incidenty sa oznamujú do 24 hodín od ich zistenia
   na e-mail Prevádzkovateľa registrovaný v Unifyo.

10. UKONČENIE
    Po ukončení zmluvy Sprostredkovateľ na žiadosť Prevádzkovateľa
    osobné údaje vráti alebo zmaže do 30 dní (s výnimkou údajov,
    ktoré musí uchovávať podľa zákona).

11. ZÁVEREČNÉ USTANOVENIA
    Táto zmluva nadobúda účinnosť okamihom elektronického podpisu.
    Vzťahuje sa na ňu právny poriadok Slovenskej republiky.
`.trim();

export async function ensureActiveDpa() {
  const existing = await prisma.dpaVersion.findUnique({
    where: { version: ACTIVE_DPA_VERSION },
  });
  if (existing) {
    if (!existing.isActive) {
      await prisma.dpaVersion.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return existing;
  }
  // Deactivate older versions, activate current.
  await prisma.dpaVersion.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });
  return prisma.dpaVersion.create({
    data: {
      version: ACTIVE_DPA_VERSION,
      body: ACTIVE_DPA_BODY,
      effectiveAt: new Date("2026-04-01"),
      isActive: true,
    },
  });
}
