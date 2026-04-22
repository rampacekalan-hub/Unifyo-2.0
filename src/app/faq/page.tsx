import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NeuralBackground from "@/components/ui/NeuralBackground";

export const metadata = {
  title: "Často kladené otázky | Unifyo",
  description:
    "Odpovede na najčastejšie otázky o Unifyo — AI business asistentovi pre slovenských podnikateľov.",
};

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "Čo je Unifyo?",
    a: "Unifyo je AI business asistent pre slovenských podnikateľov. Spája CRM, kalendár, e-maily, úlohy a AI chat do jedného pracovného priestoru — namiesto desiatich otvorených záložiek máš jedno miesto, kde všetko funguje spolu.",
  },
  {
    q: "Je počas beta obdobia platba?",
    a: "Nie. Počas beta verzie je Unifyo zadarmo pre všetkých prihlásených. Po spustení platených plánov dostaneš dostatočný predstih a možnosť výberu — k ničomu sa automaticky neprihlasuješ.",
  },
  {
    q: "Kde sú uložené moje dáta?",
    a: "Všetky dáta sú uložené na našich serveroch v dátovom centre Hetzner Falkenstein v Nemecku, v rámci Európskej únie. Spracovanie prebieha v súlade s GDPR a slovenským zákonom o ochrane osobných údajov.",
  },
  {
    q: "Môžem svoje dáta vyexportovať?",
    a: "Áno. V Nastavenia → Export údajov si kedykoľvek stiahneš kompletný JSON export (profil, kontakty, úlohy, konverzácie, AI pamäť) a samostatne aj CSV s CRM kontaktmi. Export je tvoje právo podľa článku 20 GDPR.",
  },
  {
    q: "Môžem si zmazať účet?",
    a: "Áno, kedykoľvek. V Nastavenia → Zmazať účet zadáš svoj email na potvrdenie a všetky tvoje dáta sa permanentne vymažú. Operácia sa nedá vrátiť, preto odporúčame najprv si stiahnuť export.",
  },
  {
    q: "Aká AI poháňa chat?",
    a: "Unifyo využíva kombináciu frontier modelov (OpenAI, Anthropic) pre jazyk, pochopenie kontextu a extrakciu. Model vyberáme podľa úlohy a nákladov tak, aby si dostal rýchlu a kvalitnú odpoveď po slovensky.",
  },
  {
    q: "Podporujete import z iných CRM?",
    a: "Áno. V Nastavenia → Import kontaktov nahráš CSV so stĺpcami Meno, Firma, Email, Telefón, Poznámka. Duplikáty (rovnaký email alebo telefón) sa preskočia. Max 5 000 riadkov na jeden import.",
  },
  {
    q: "Funguje to na mobile?",
    a: "Áno. Unifyo je plne responzívne a má režim PWA — po prvej návšteve na mobile ti prehliadač ponúkne možnosť „Nainštaluj aplikáciu“ a Unifyo sa otvorí ako natívna aplikácia bez adresného riadku.",
  },
  {
    q: "Ako fakturujete?",
    a: "Platby spracúva Stripe — mesačne alebo ročne (pri ročnom platení máš -20 %). Faktúry dostaneš automaticky e-mailom s DPH (SK 23 %) a firemnými údajmi. Zrušenie kedykoľvek cez Nastavenia → Plán a fakturácia.",
  },
  {
    q: "Ako funguje pozývací odkaz (referral)?",
    a: "V Nastaveniach nájdeš svoj unikátny link. Ak sa cez neho niekto zaregistruje a kúpi si Pro, obaja dostanete kredit 10 EUR k ďalšej fakturácii. Všetko vidíš v Nastaveniach → Odporúčania (počet pozvaných, získané kredity).",
  },
  {
    q: "Mám technický problém — kde mám pomoc?",
    a: "Napíš na info@unifyo.online — odpovedá priamo autor platformy, zvyčajne do niekoľkých hodín. Na stránke /status vidíš aktuálny stav jednotlivých služieb (AI, e-mail, databáza).",
  },
  {
    q: "Kto je za Unifyo?",
    a: "Unifyo prevádzkuje ALAN RAMPÁČEK s. r. o., IČO: 56 908 377. Je to nezávislý slovenský projekt postavený s dôrazom na súkromie, EÚ hosting a reálny produktový feedback od živých používateľov.",
  },
];

export default function FaqPage() {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            padding: "140px 24px 80px",
          }}
        >
          <div style={{ marginBottom: "40px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "var(--brand-primary)",
                borderRadius: "999px",
                padding: "6px 16px",
                fontSize: "0.78rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              FAQ
            </span>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.2rem)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "var(--app-text)",
                marginBottom: "16px",
                lineHeight: 1.1,
              }}
            >
              Často kladené otázky
            </h1>
            <p
              style={{
                color: "var(--app-text-muted)",
                fontSize: "1rem",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Krátke odpovede na otázky, ktoré nám najčastejšie chodia od solo
              podnikateľov a malých tímov.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {FAQS.map((item, i) => (
              <details
                key={i}
                className="group"
                style={{
                  background: "rgba(99,102,241,0.04)",
                  border: "1px solid rgba(99,102,241,0.22)",
                  borderRadius: "16px",
                  padding: "18px 20px",
                }}
              >
                <summary
                  style={{
                    cursor: "pointer",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    color: "var(--app-text)",
                    fontSize: "0.98rem",
                    fontWeight: 600,
                  }}
                >
                  <span>{item.q}</span>
                  <span
                    className="transition-transform group-open:rotate-45"
                    style={{
                      color: "var(--brand-primary)",
                      fontSize: "1.4rem",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p
                  style={{
                    marginTop: "12px",
                    color: "var(--app-text-muted)",
                    fontSize: "0.92rem",
                    lineHeight: 1.65,
                  }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <p
            style={{
              marginTop: "40px",
              color: "var(--app-text-subtle)",
              fontSize: "0.85rem",
              textAlign: "center",
            }}
          >
            Nenašiel si odpoveď? Napíš nám na{" "}
            <a
              href="mailto:info@unifyo.online"
              style={{ color: "var(--brand-primary)", textDecoration: "none" }}
            >
              info@unifyo.online
            </a>
            .
          </p>
        </div>
        <Footer />
      </main>
    </>
  );
}
