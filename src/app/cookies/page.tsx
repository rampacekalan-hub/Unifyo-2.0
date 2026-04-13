import LegalLayout from "@/components/layout/LegalLayout";

export const metadata = {
  title: "Zásady cookies | Unifyo",
  description: "Informácie o používaní cookies na platforme Unifyo.",
};

export default function CookiesPage() {
  return (
    <LegalLayout
      badge="Cookies"
      title="Zásady cookies"
      subtitle="Vysvetlenie, aké cookies používame na platforme Unifyo a ako ich môžete spravovať."
      lastUpdated="13. apríla 2025"
      sections={[
        {
          title: "Čo sú cookies",
          content: "Cookies sú malé textové súbory, ktoré sa ukladajú do vášho prehliadača pri návšteve webovej stránky. Pomáhajú nám zapamätať si vaše preferencie, zabezpečiť správne fungovanie prihlásenia a zlepšovať výkon platformy.",
        },
        {
          title: "Nevyhnutné cookies",
          content: [
            "session_token — overenie prihlásenia, platnosť 30 dní (alebo do odhlásenia).",
            "csrf_token — ochrana pred CSRF útokmi, platnosť počas relácie.",
            "cookie_consent — uloženie vašich preferencií cookies, platnosť 1 rok.",
            "Tieto cookies nie je možné vypnúť — sú nevyhnutné pre fungovanie platformy.",
          ],
        },
        {
          title: "Analytické cookies (len so súhlasom)",
          content: [
            "Používame anonymizovanú analytiku na meranie výkonu platformy a sledovanie chýb.",
            "Tieto cookies neobsahujú osobné identifikátory.",
            "Dáta sú agregované a slúžia výlučne na zlepšenie kvality služby.",
            "Môžete ich kedykoľvek odmietnuť alebo odvolať súhlas v nastaveniach.",
          ],
        },
        {
          title: "Marketingové cookies (len so súhlasom)",
          content: [
            "Unifyo v súčasnosti nepoužíva cookies tretích strán na remarketingové účely.",
            "Ak sa to zmení, budeme vás vopred informovať a vyžiadame si nový súhlas.",
          ],
        },
        {
          title: "Správa cookies",
          content: [
            "Nastavenia cookies môžete kedykoľvek zmeniť v nastaveniach svojho prehliadača.",
            "Chrome: Nastavenia > Ochrana súkromia a zabezpečenie > Cookies.",
            "Firefox: Nastavenia > Súkromie a bezpečnosť > Cookies.",
            "Safari: Predvoľby > Súkromie > Spravovať dáta webových stránok.",
            "Vypnutie nevyhnutných cookies môže spôsobiť nefunkčnosť prihlásenia.",
          ],
        },
        {
          title: "Súhlas a odvolanie",
          content: "Súhlas s analytickými cookies udeľujete pri prvej návšteve platformy. Súhlas môžete kedykoľvek odvolať kliknutím na odkaz 'Spravovať cookies' v päte stránky, alebo emailom na hello@unifyo.online.",
        },
      ]}
    />
  );
}
