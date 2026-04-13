import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Zásady cookies | Unifyo",
  description: "Informácie o používaní súborov cookies na platforme Unifyo, prevádzkovanej spoločnosťou ALAN RAMPÁČEK s. r. o.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      badge="Cookies"
      title="Zásady cookies"
      subtitle="Informácie o tom, aké súbory cookies používa platforma Unifyo (unifyo.online), prevádzkovaná spoločnosťou ALAN RAMPÁČEK s. r. o., IČO: 56 908 377, a ako ich môžete spravovať."
      lastUpdated="13. apríla 2025"
      sections={[
        {
          title: "Čo sú súbory cookies a na čo slúžia",
          content: "Súbory cookies sú malé textové súbory, ktoré sa pri návšteve webovej stránky alebo aplikácie ukladajú do zariadenia Používateľa (počítač, tablet, smartfón). Umožňujú nám rozpoznať zariadenie pri opakovanej návšteve, zapamätať si nastavenia a preferencie, zabezpečiť správne fungovanie autentifikácie a chrániť platformu pred bezpečnostnými hrozbami. Používanie cookies sa riadi zákonom č. 452/2021 Z. z. o elektronických komunikáciách a Nariadením (EÚ) 2016/679 (GDPR).",
        },
        {
          title: "Kategória 1 — Nevyhnutné cookies (bez súhlasu)",
          content: [
            "Tieto cookies sú technicky nevyhnutné na fungovanie platformy. Bez nich nie je možné sa prihlásiť ani bezpečne používať platformu. Nevyžadujú súhlas Používateľa.",
            "sb-access-token — autentifikačný token relácie (Supabase Auth), platnosť: 1 hodina.",
            "sb-refresh-token — obnova prihlasovacej relácie bez opätovného zadania hesla, platnosť: 30 dní.",
            "csrf — ochrana formulárov pred Cross-Site Request Forgery útokmi, platnosť: počas relácie.",
            "cookie_consent — uloženie rozhodnutia Používateľa o cookies, platnosť: 12 mesiacov.",
          ],
        },
        {
          title: "Kategória 2 — Analytické cookies (len so súhlasom)",
          content: [
            "Tieto cookies zbierame iba na základe výslovného súhlasu Používateľa. Slúžia na meranie výkonu platformy, sledovanie chýb a zlepšovanie používateľského zážitku.",
            "Zbierané dáta sú anonymizované alebo pseudonymizované a nie sú využívané na identifikáciu konkrétnych osôb.",
            "Poskytovateľ môže využívať nástroje ako Vercel Analytics alebo vlastnú serverovú analytiku.",
            "Analytické cookies môžete kedykoľvek odmietnuť alebo odvolať súhlas.",
          ],
        },
        {
          title: "Kategória 3 — Marketingové a remarketingové cookies",
          content: [
            "Platforma Unifyo v súčasnosti (ku dňu poslednej aktualizácie) nepoužíva marketingové ani remarketingové cookies tretích strán.",
            "V prípade zavedenia marketingových cookies bude Poskytovateľ Používateľov informovať vopred a vyžiada si nový výslovný súhlas.",
          ],
        },
        {
          title: "Súhlas a správa preferencií",
          content: [
            "Pri prvej návšteve platformy je Používateľovi zobrazená lišta s výberom preferencií cookies.",
            "Súhlas s analytickými cookies je dobrovoľný. Odmietnuť ho alebo odvolať ho môžete kedykoľvek kliknutím na odkaz 'Spravovať cookies' v päte stránky alebo emailom na info@unifyo.online.",
            "Odvolanie súhlasu nemá vplyv na zákonnosť spracúvania pred jeho odvolaním.",
          ],
        },
        {
          title: "Správa cookies v prehliadači",
          content: [
            "Google Chrome: Nastavenia → Ochrana súkromia a zabezpečenie → Súbory cookie a iné údaje stránok.",
            "Mozilla Firefox: Nastavenia → Súkromie a bezpečnosť → Cookies a dáta stránok.",
            "Apple Safari: Predvoľby → Súkromie → Spravovať dáta webových stránok.",
            "Microsoft Edge: Nastavenia → Ochrana osobných údajov, vyhľadávanie a služby → Súbory cookie.",
            "Upozornenie: Zablokovanie nevyhnutných cookies môže spôsobiť, že prihlásenie a základné funkcie platformy prestanú správne fungovať.",
          ],
        },
        {
          title: "Kontakt a aktualizácie",
          content: "O zmenách v týchto Zásadách cookies bude Používateľ informovaný min. 14 dní vopred zobrazením upozornenia na platforme alebo emailom. Aktuálna verzia je vždy dostupná na unifyo.online/cookies. Otázky zasielajte na info@unifyo.online.",
        },
      ]}
    />
  );
}
