import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Ochrana súkromia (GDPR) | Unifyo",
  description: "Zásady ochrany osobných údajov platformy Unifyo v súlade s GDPR.",
};

export default function SukromiePage() {
  return (
    <LegalLayout
      badge="GDPR & Súkromie"
      title="Ochrana súkromia"
      subtitle="Vašu súkromnosť berieme vážne. Tento dokument vysvetľuje, aké osobné údaje zbierame, prečo a ako ich chránime."
      lastUpdated="13. apríla 2025"
      sections={[
        {
          title: "Prevádzkovateľ osobných údajov",
          content: `Prevádzkovateľom osobných údajov je Unifyo (ďalej len "Prevádzkovateľ"), dostupný na adrese unifyo.online. Kontakt: hello@unifyo.online. Spracúvanie osobných údajov prebieha v súlade s Nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov.`,
        },
        {
          title: "Aké údaje zbierame",
          content: [
            "Identifikačné údaje: meno, priezvisko, emailová adresa (pri registrácii).",
            "Prihlasovacie údaje: hashované heslo (nikdy v čitateľnej forme).",
            "Fakturačné údaje: fakturačná adresa, IČO/DIČ pre firemné účty (nevyžadujeme číslo karty — spracúva ho Stripe).",
            "Prevádzkové údaje: IP adresa, typ prehliadača, čas prístupu, log aktivít v aplikácii.",
            "Obsah: údaje, ktoré sami vložíte do platformy (kontakty, emaily, záznamy hovorov, pipeline).",
          ],
        },
        {
          title: "Právny základ spracúvania",
          content: [
            "Plnenie zmluvy (čl. 6 ods. 1 písm. b GDPR) — spracúvanie nevyhnutné na poskytovanie služby.",
            "Oprávnený záujem (čl. 6 ods. 1 písm. f GDPR) — bezpečnosť systému, prevencia podvodov, analytika výkonu.",
            "Súhlas (čl. 6 ods. 1 písm. a GDPR) — marketingové emaily a newsletter (odvolateľný kedykoľvek).",
            "Zákonná povinnosť (čl. 6 ods. 1 písm. c GDPR) — uchovávanie účtovných dokladov.",
          ],
        },
        {
          title: "Ako dlho uchovávame údaje",
          content: [
            "Údaje účtu: po dobu trvania zmluvného vzťahu + 3 roky po zrušení účtu.",
            "Fakturačné záznamy: 10 rokov podľa zákona o účtovníctve.",
            "Logy prístupu: 90 dní.",
            "Marketingové preferencie: do odvolania súhlasu.",
          ],
        },
        {
          title: "Príjemcovia a tretie strany",
          content: [
            "Stripe Inc. — platobné spracovanie (certifikovaný PCI DSS Level 1).",
            "Vercel Inc. — hosting infraštruktúra (dátové centrá v EÚ).",
            "OpenAI / AI poskytovatelia — spracovanie AI požiadaviek (bez ukladania obsahu na strane AI).",
            "Žiadne osobné údaje nepredávame tretím stranám na marketingové účely.",
          ],
        },
        {
          title: "Vaše práva",
          content: [
            "Právo na prístup — môžete kedykoľvek požiadať o výpis svojich údajov.",
            "Právo na opravu — môžete opraviť nepresné osobné údaje.",
            "Právo na vymazanie ('zabudnutie') — môžete požiadať o vymazanie údajov.",
            "Právo na prenosnosť — môžete požiadať o export údajov v strojovo čitateľnom formáte.",
            "Právo namietať — môžete namietať spracúvanie na základe oprávneného záujmu.",
            "Právo podať sťažnosť — na Úrad na ochranu osobných údajov SR (dataprotection.gov.sk).",
            "Na uplatnenie práv nás kontaktujte na: hello@unifyo.online",
          ],
        },
        {
          title: "Bezpečnosť údajov",
          content: [
            "Všetka komunikácia je šifrovaná protokolom TLS 1.3.",
            "Dáta v úložisku sú šifrované pomocou AES-256.",
            "Pravidelné bezpečnostné audity a penetračné testovanie.",
            "Prísna kontrola prístupu — princíp najmenších oprávnení pre zamestnancov.",
          ],
        },
        {
          title: "Cookies",
          content: `Na platforme používame cookies nevyhnutné pre fungovanie služby a analytické cookies (po udelení súhlasu). Podrobnosti nájdete v našich Zásadách cookies na adrese unifyo.online/cookies.`,
        },
        {
          title: "Zmeny dokumentu",
          content: "O akýchkoľvek zmenách v tomto dokumente vás budeme informovať emailom aspoň 14 dní vopred. Aktuálna verzia je vždy dostupná na unifyo.online/sukromie.",
        },
      ]}
    />
  );
}
