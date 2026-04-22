import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NeuralBackground from "@/components/ui/NeuralBackground";

export const metadata = {
  title: "Čo je nové | Unifyo",
  description:
    "Prehľad zmien, nových funkcií a opráv v platforme Unifyo — aktualizované pravidelne.",
};

type Tag = "nové" | "oprava" | "vylepšenie";

interface Entry {
  version: string;
  date: string;
  tags: Tag[];
  items: string[];
}

// Realne zhrnutia na zaklade git log (posledne commity 2026-04).
const ENTRIES: Entry[] = [
  {
    version: "0.9.0",
    date: "20. apríl 2026",
    tags: ["nové", "vylepšenie"],
    items: [
      "Verejná status stránka so stavom jednotlivých služieb",
      "Dnešok — nový prehľadový panel na dashboarde",
      "Timeline aktivít kontaktu v CRM",
      "Referral program — 30 dní Pro pre obe strany",
      "Plán a fakturácia (stránka /settings/billing) + analytika využitia",
    ],
  },
  {
    version: "0.8.0",
    date: "18. apríl 2026",
    tags: ["nové"],
    items: [
      "Notifikačné centrum v sidebare",
      "Onboarding checklist pre nových používateľov",
      "CSV import a export CRM kontaktov",
      "Waitlist + ETA + progress na Coming Soon stránkach",
      "Loading skeletony pre všetky moduly",
    ],
  },
  {
    version: "0.7.0",
    date: "15. apríl 2026",
    tags: ["vylepšenie", "oprava"],
    items: [
      "AI chat — sprievodca režim a prirodzenejší prompt",
      "Advisory gate: AI najprv odpovie na otázku, potom ponúka uloženie",
      "Confirm-first mode: žiadne invazívne otázky pred potvrdením",
      "Žiadne halucinované časy (napr. „o 5 minút“)",
      "História konverzácií cez portal + lepšia čitateľnosť UsageChip dropdown-u",
    ],
  },
  {
    version: "0.6.0",
    date: "12. apríl 2026",
    tags: ["nové", "oprava"],
    items: [
      "Server-side error capture (Sentry-lite) + interný monitoring",
      "Email verification gate pre citlivé akcie",
      "Postgres rate-limit pre API endpointy",
      "CSRF guard naprieč formulármi",
      "Nová DPA stránka (GDPR článok 28) a odstránený deprecated X-XSS-Protection",
    ],
  },
  {
    version: "0.5.0",
    date: "8. apríl 2026",
    tags: ["nové", "vylepšenie"],
    items: [
      "GDPR cookie consent banner s granulárnymi preferenciami",
      "Logout presmeruje na /login namiesto JSON odpovede",
      "Redizajn auth stránok — zjednotená Neural OS identita",
      "Emailové šablóny v brand štýle + prechod na Websupport SMTP",
      "Pre-launch balík: /cennik, robots, sitemap, OG image, JWT hard-fail",
    ],
  },
];

const TAG_STYLE: Record<Tag, { bg: string; border: string; color: string }> = {
  "nové": {
    bg: "rgba(99,102,241,0.15)",
    border: "rgba(99,102,241,0.35)",
    color: "#a5b4fc",
  },
  "oprava": {
    bg: "rgba(34,211,238,0.1)",
    border: "rgba(34,211,238,0.25)",
    color: "#22d3ee",
  },
  "vylepšenie": {
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.3)",
    color: "var(--brand-primary)",
  },
};

export default function ChangelogPage() {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            padding: "140px 24px 80px",
          }}
        >
          <div style={{ marginBottom: "48px" }}>
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
              Changelog
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
              Čo je nové
            </h1>
            <p
              style={{
                color: "var(--app-text-muted)",
                fontSize: "1rem",
                lineHeight: 1.6,
                maxWidth: "600px",
              }}
            >
              Prehľad najnovších zmien, nových funkcií a opráv v Unifyo. Aktualizujeme pravidelne — zvyčajne raz za 1–2 týždne.
            </p>
          </div>

          {/* Timeline */}
          <div style={{ position: "relative", paddingLeft: "0" }}>
            {ENTRIES.map((entry, idx) => (
              <div
                key={entry.version}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 160px) 1fr",
                  gap: "24px",
                  marginBottom: idx === ENTRIES.length - 1 ? 0 : "32px",
                  position: "relative",
                }}
                className="changelog-row"
              >
                {/* Left — date */}
                <div style={{ textAlign: "right" }} className="changelog-date">
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: "var(--app-text)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    v{entry.version}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--app-text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {entry.date}
                  </div>
                </div>

                {/* Right — card */}
                <div
                  style={{
                    background: "rgba(99,102,241,0.04)",
                    border: "1px solid rgba(99,102,241,0.22)",
                    borderRadius: "16px",
                    padding: "20px 22px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                      marginBottom: "14px",
                    }}
                  >
                    {entry.tags.map((t) => {
                      const s = TAG_STYLE[t];
                      return (
                        <span
                          key={t}
                          style={{
                            background: s.bg,
                            border: `1px solid ${s.border}`,
                            color: s.color,
                            borderRadius: "999px",
                            padding: "3px 10px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          {t}
                        </span>
                      );
                    })}
                  </div>
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {entry.items.map((item, i) => (
                      <li
                        key={i}
                        style={{
                          color: "#cbd5e1",
                          fontSize: "0.92rem",
                          lineHeight: 1.55,
                          paddingLeft: "18px",
                          position: "relative",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "0.55em",
                            width: "6px",
                            height: "6px",
                            borderRadius: "999px",
                            background:
                              "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
