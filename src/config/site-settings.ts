import { cache } from "react";

// ============================================================
// UNIFYO 2.0 — SYSTEM CORE (Mozog systému)
// Toto je jediné miesto pre zmenu obsahu, cien, textov a správania.
// ============================================================

// ─── INTERFACES ─────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  href: string;
  label: string;
}

export interface LegalLink {
  label: string;
  href: string;
}

export interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: "mesiac" | "rok";
  badge?: string;
  highlighted: boolean;
  features: PricingFeature[];
  cta: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  twitterHandle?: string;
  canonicalUrl: string;
}

export interface ThemeEngine {
  glowIntensity: number;
  glowRadius: number;
  blurStrength: number;
  noiseOpacity: number;
  gradientAngle: number;
  animationSpeed: number;
  particleDensity: number;
  particleOpacity: number;
  particleSpeed: number;
}

export interface BrandingConfig {
  colors: {
    primary: string;
    primaryGlow: string;
    accent: string;
    accentGlow: string;
    violet: string;
    violetGlow: string;
    surface: string;
    surfaceHigh: string;
    surfaceHigher: string;
    border: string;
    borderGlow: string;
    text: string;
    textMuted: string;
    textDim: string;
    background: string;
    backgroundDeep: string;
    green: string;
    yellow: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  borderRadius: string;
  themeEngine: ThemeEngine;
}

export interface ValidationConfig {
  email: {
    minLength: number;
    maxLength: number;
  };
  password: {
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSpecial: boolean;
  };
  name: {
    minLength: number;
    maxLength: number;
  };
}

export interface FeaturesConfig {
  showPricing: boolean;
  showBlog: boolean;
  showTestimonials: boolean;
  showRegister: boolean;
  showLogin: boolean;
  maintenanceMode: boolean;
  showCookieBanner: boolean;
}

export interface SystemPrompts {
  base: string;           // Zakladny kontext o Unifyo — ide do kazdeho API volania
  dashboard: string;      // Kontext pre hlavny AI chat
  calendar: string;       // Kontext pre kalendar akcie
  email: string;          // Kontext pre email akcie
  crm: string;            // Kontext pre CRM/pipeline akcie
  calls: string;          // Kontext pre prepis hovorov
}

export interface AiConfig {
  defaultModel: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  requestLimits: Record<"basic" | "pro" | "enterprise", number>;
  features: {
    calendarEnabled: boolean;
    emailEnabled: boolean;
    crmEnabled: boolean;
    callTranscriptionEnabled: boolean;
    customAgentsEnabled: boolean;
  };
  endpoints: {
    chat: string;
    transcribe: string;
    summarize: string;
  };
  systemPrompts: SystemPrompts;
}

export type DbFieldType = "string" | "number" | "boolean" | "datetime" | "enum" | "relation";

export interface DbField {
  type: DbFieldType;
  required: boolean;
  description: string;
  enumValues?: string[];
}

export interface DbTableSchema {
  table: string;
  fields: Record<string, DbField>;
}

export interface DataStrategyConfig {
  // Mapovanie Prisma tabuliek — bez citlivych dat, len pre AI kontext a CMS
  schema: {
    user: DbTableSchema;
    subscription: DbTableSchema;
    aiRequest: DbTableSchema;
  };
}

export interface ModuleConfig {
  id: string;
  enabled: boolean;
  requiredPlan: "basic" | "pro" | "enterprise" | "all";
  path?: string;
}

export interface ModulesConfig {
  dashboard: ModuleConfig;
  crm: ModuleConfig;
  calendar: ModuleConfig;
  email: ModuleConfig;
  calls: ModuleConfig;
  analytics: ModuleConfig;
  automationBuilder: ModuleConfig;
}

export interface TextsConfig {
  hero: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subheadline: string;
    cta: string;
    ctaSecondary: string;
  };
  about: {
    title: string;
    body: string;
  };
  footer: {
    tagline: string;
    copyright: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
  };
  dashboard: {
    welcome: string;
    systemsOnline: string;
    aiReady: string;
    chatPlaceholder: string;
  };
  errorStates: {
    aiUnavailable: string;
    rateLimited: string;
    noCredits: string;
    dailyLimitReached: string;
    networkError: string;
    sessionExpired: string;
  };
}

export interface LinksConfig {
  nav: NavLink[];
  social: SocialLink[];
  legal: LegalLink[];
  contact: {
    email: string;
    phone?: string;
  };
}

export interface SecurityConfig {
  rateLimit: {
    auth: { maxRequests: number; windowMs: number };   // login/register
    ai: { maxRequests: number; windowMs: number };     // AI endpoints
    api: { maxRequests: number; windowMs: number };    // general API
  };
  bcryptRounds: number;
  sessionMaxAgeSec: number;
}

export interface TierLimits {
  dailyRequests: number | null;  // null = unlimited
  memorySlots: number;           // max neural memories stored
  contextWindow: number;         // how many past memories sent to AI
  label: string;
}

export interface MembershipConfig {
  tiers: {
    BASIC:      TierLimits;
    PREMIUM:    TierLimits;
    ENTERPRISE: TierLimits;
  };
}

export interface SiteConfig {
  name: string;
  tagline: string;
  url: string;
  locale: string;
  branding: BrandingConfig;
  seo: SEOConfig;
  features: FeaturesConfig;
  ai: AiConfig;
  modules: ModulesConfig;
  membership: MembershipConfig;
  dataStrategy: DataStrategyConfig;
  texts: TextsConfig;
  links: LinksConfig;
  pricing: PricingPlan[];
  validation: ValidationConfig;
  security: SecurityConfig;
}

// ─── SYSTEM CORE DEFINITION ──────────────────────────────────

const siteConfig: SiteConfig = {
  name: "Unifyo",
  tagline: "Jednotná platforma pre moderné tímy",
  url: "https://unifyo.online",
  locale: "sk",

  // ─── BRANDING (Farby & Fonty — centrálna pravda) ───────────
  branding: {
    colors: {
      primary: "#7c3aed",
      primaryGlow: "rgba(124,58,237,0.35)",
      accent: "#06b6d4",
      accentGlow: "rgba(6,182,212,0.25)",
      violet: "#8b5cf6",
      violetGlow: "rgba(139,92,246,0.3)",
      surface: "#0c0f1a",
      surfaceHigh: "#111827",
      surfaceHigher: "#1e2535",
      border: "rgba(139,92,246,0.12)",
      borderGlow: "rgba(139,92,246,0.3)",
      text: "#eef2ff",
      textMuted: "#94a3b8",
      textDim: "#64748b",
      background: "#05070f",
      backgroundDeep: "#020408",
      green: "#10b981",
      yellow: "#f59e0b",
    },
    fonts: {
      sans: "var(--font-inter), SF Pro Display, -apple-system, system-ui, sans-serif",
      mono: "var(--font-geist-mono)",
    },
    borderRadius: "0.875rem",
    themeEngine: {
      glowIntensity: 0.8,
      glowRadius: 32,
      blurStrength: 16,
      noiseOpacity: 0.025,
      gradientAngle: 135,
      animationSpeed: 1.0,
      particleDensity: 80,
      particleOpacity: 0.45,
      particleSpeed: 2.0,
    },
  },

  // ─── AI CONFIG (Modely, limity, systemPrompts) ──────────────
  ai: {
    defaultModel: "gpt-4o-mini",
    fallbackModel: "gpt-3.5-turbo",
    maxTokens: 2048,
    temperature: 0.7,
    requestLimits: {
      basic: 100,
      pro: 1000,
      enterprise: -1,
    },
    features: {
      calendarEnabled: true,
      emailEnabled: true,
      crmEnabled: false,
      callTranscriptionEnabled: false,
      customAgentsEnabled: false,
    },
    endpoints: {
      chat: "/api/ai/chat",
      transcribe: "/api/ai/transcribe",
      summarize: "/api/ai/summarize",
    },
    systemPrompts: {
      base:
        "Si Unifyo — skúsený biznis kolega slovenského podnikateľa. Pracuješ s ním denne\n" +
        "na jeho klientoch, obchodoch a úlohách. Prevádzkuje ťa ALAN RAMPACEK s.r.o. (IČO 56908377).\n\n" +

        "## KTO SI\n" +
        "Si kolega-poradca s praxou v predaji, financiách, poistení, hypotékach a B2B vzťahoch.\n" +
        "Hovoríš ako človek — nie ako chatbot, nie ako formulár. Premýšľaš o jeho situácii,\n" +
        "dávaš konkrétne návrhy, pýtaš sa keď treba doplniť. Pri rutinných veciach (uložiť\n" +
        "kontakt, vytvoriť úlohu) si efektívny, pri rozhodovacích (čo s klientom) pomôžeš premyslieť.\n\n" +

        "## AKO REAGOVAŤ — PRIMÁRNE PRAVIDLO\n" +
        "Čítaj správu pozorne a rozhodni čo user naozaj chce:\n\n" +
        "  (A) PÝTA SA / HĽADÁ RADU — správa obsahuje '?', 'čo s tým', 'ako', 'poraď',\n" +
        "      'mal by som', 'oplatí sa', opisuje situáciu bez príkazu.\n" +
        "      → ODPOVEDZ AKO SPRIEVODCA: 2–4 krátke odseky, konkrétne kroky číslované (1), (2), (3).\n" +
        "      Štruktúra: najprv krátko pomenuj situáciu (1 veta), potom 2–3 konkrétne kroky,\n" +
        "      na konci prázdny riadok a JEMNÝ dovetok 'Chceš ho pridať do CRM?' ak má zmysel.\n" +
        "      Žiadne 'Rozumiem:', žiadne 'téma: X'. Hovor ako kolega, nie ako formulár.\n\n" +
        "  (B) PRIAMO POŽIADA O ZÁPIS / NAPLÁNOVANIE — 'ulož', 'zapíš', 'pridaj kontakt',\n" +
        "      'naplánuj', 'stretnutie zajtra 14:00', 'zavolaj Petrovi'.\n" +
        "      → Jedno krátke slovo potvrdenia ('Uložené.' / 'Naplánované.') + action-cards.\n" +
        "      Žiadne zhŕňanie 'Rozumiem: kontakt X, téma Y'. Len potvrď a ulož.\n\n" +
        "  (C) NEJEDNOZNAČNÉ — spomenul osobu/tému bez jasného príkazu.\n" +
        "      → Jedna veta návrhu + jedna otázka: 'Pridám Petra Vitteka do CRM\n" +
        "      s poznámkou rizikové životné — ideme na to?' Čakaj na 'áno'.\n" +
        "      Nikdy nepíš 'Rozumiem: kontakt X, téma Y. Uložiť?' — to znie ako robot.\n\n" +

        "## PROAKTÍVNE ZBERANIE ÚDAJOV (TVRDÉ PRAVIDLO — PREBÍJA (A))\n" +
        "Keď user spomenie klienta/človeka/volajúceho BEZ MENA ('mám klienta',\n" +
        "'tento človek', 'volal mi jeden chlapík', 'klient sa pýta', 'mám niekoho'):\n" +
        "→ ZAKÁZANÉ: sypať tri-kroky generickú radu ('Skús: (1)... (2)... (3)...').\n" +
        "→ POVINNÉ: prvá tvoja veta je KRÁTKA otázka na meno + kontext (max 2 vety):\n" +
        "  'Aby som ti vedel pripraviť konkrétny text — ako sa volá a čo presne\n" +
        "  rieši? Stačí meno a 1 veta o situácii, zvyšok dorobím.'\n\n" +

        "## ARCHITEKTÚRA ODPOVEDE — UNIFYO INTELLIGENCE ARCHITECT (4 FÁZY)\n" +
        "Si najvyšší stupeň asistenta: 0 % administratívy pre používateľa,\n" +
        "100 % prehľad o procese. Proaktívny, analytický, technicky precízny.\n" +
        "Keď MÁŠ meno klienta + tému, odpovedaj v PRESNOM 4-fázovom formáte.\n" +
        "Každá fáza má svoj emoji nadpis. Používateľovi tykáš, ku klientovi\n" +
        "píšeš odborne (LTV, fixácia, bonita, retenčná lehota, znalecký posudok,\n" +
        "úrokový diferenciál — používaj prirodzene).\n\n" +

        "### FÁZA I — 🧐 NÁLEZ V HISTÓRII (LUSTRÁCIA, vždy prvé)\n" +
        "PRED čímkoľvek prehľadaj ## POSLEDNÉ KONTAKTY V CRM a ## OTVORENÉ DEALY.\n" +
        "Tri možné výsledky, vyber jeden a explicitne pomenuj:\n" +
        "  • ZHODA: 'V systéme už máme p. Vitteka (posledný Deal: PZP, 2024).\n" +
        "    Priradím novú hypotéku k tomuto profilu?' — žiadny duplicitný\n" +
        "    contact card, iba doplň poznámku a založ nový deal.\n" +
        "  • NOVÝ: 'Pán Vittek v systéme nie je — zakladám čistý profil so\n" +
        "    štítkom Nový dopyt.'\n" +
        "  • AMBIGUITA (viac osôb rovnakého mena): vypýtaj si upresnenie\n" +
        "    (firma / mesto), nezakladaj nič.\n" +
        "Backend: server stejne dedupuje kontakty podľa mena (case-insensitive)\n" +
        "a poznámku pripája ako CrmNote — takže keď si pomýliš, NIE JE\n" +
        "katastrofa, ale presnosť tu šetrí klikania.\n\n" +

        "### FÁZA II — 🚀 SPRIEVODCA PROCESOM (3 KROKY V ACTION-CARDS)\n" +
        "Nikdy nenechávaj prázdne polia. Ak niečo nevieš, navrhni inteligentný\n" +
        "placeholder. Vygeneruj action-cards v presnom poradí:\n\n" +
        "  1) KONTAKT (contact action-card)\n" +
        "     - Meno, Firma (ak vieš), Zdroj v Poznámke (napr. 'Správy/WhatsApp').\n" +
        "     - Email/Telefón ostávajú \"\" ak ich user nenapísal — server filtruje\n" +
        "       fiktívne hodnoty, takže prázdne je správne.\n" +
        "     - Preskoč ak Fáza I našla zhodu (kontakt už existuje).\n" +
        "  2) DEAL (deal action-card)\n" +
        "     - Názov: '[Produkt] — [Meno klienta]' (napr. 'Hypotéka — Peter Vittek').\n" +
        "     - Fáza: 'Analýza potrieb' default; 'Lead' pre prvý kontakt; 'Ponuka'\n" +
        "       keď už klient niečo dostal; 'Vyhraté'/'Stratené' pre uzavreté.\n" +
        "     - Hodnota: odhadni potenciál ak vieš (napr. 'Hypotéka Bratislava\n" +
        "       1-izbák' → 120000), inak prázdne ''. Nikdy si nevymýšľaj nuly.\n" +
        "     - Poznámka: 'Naviazané na stretnutie [Dátum z Kroku 3].'\n" +
        "  3) KALENDÁR (task action-card s prefixom 'Stretnutie:')\n" +
        "     - Úloha: '🤝 Stretnutie: [Meno] — [Téma]' (povolené emoji v názve).\n" +
        "     - Dátum: POVINNÉ. Vyber najbližší voľný pracovný slot z\n" +
        "       ## DNEŠNÝ KALENDÁROVÝ KONTEXT (pon–pia, 2–5 dní dopredu).\n" +
        "     - Čas: POVINNÉ. 9:00–17:00, prirodzené sloty (10:00, 14:00, 15:00).\n" +
        "     - Poznámka: agenda + spätné odkazy:\n" +
        "         '👤 Klient: [Meno] · 📈 Deal: [Názov]\n" +
        "          📝 Agenda: [krátka veta — napr. Analýza bonity a LTV]'\n\n" +

        "### FÁZA III — ✉️ NÁVRH KOMUNIKÁCIE (POVINNÝ, NESKIPOVATEĽNÝ)\n" +
        "TENTO BLOK SA NIKDY NEVYNECHÁVA. Pripravené správy na okamžité odoslanie.\n" +
        "Vždy DVE verzie, každá so svojím predmetom:\n" +
        "  **A) Formálna (Vykanie)** — predmet typu 'Konzultácia financovania:\n" +
        "      [Zámeru]' alebo 'Hypotéka — porovnanie ponúk a návrh stretnutia'.\n" +
        "      Vykanie, dôraz na expertízu, 'Vážený pán X', 1–2 odborné pojmy\n" +
        "      (LTV, retenčná lehota, znalecký posudok, úrokový diferenciál,\n" +
        "      ESG, fixácia, bonita) prirodzene v tele.\n" +
        "  **B) Mierne neformálna (Tykanie)** — predmet typu 'Tvoja hypotéka —\n" +
        "      info a ďalší krok' alebo 'Hypotéka — pár tipov a krátke stretko'.\n" +
        "      Tykanie, priateľský tón, 'Ahoj Peter', 1 odborný pojem stačí.\n" +
        "Štruktúra každej verzie:\n" +
        "  riadok 1:  Predmet: <6–10 slov>\n" +
        "  riadok 2:  (prázdny)\n" +
        "  riadky 3+: Pozdrav + telo 2–4 odseky + výzva s konkrétnym časom\n" +
        "             (rovnaký ako v Kroku 3 Kalendár) + rozlúčka + podpis.\n" +
        "ZAKÁZANÉ: 'Pripravím ti email', 'Mám napísať návrh?', 'tu je draft' bez\n" +
        "tela, [PLACEHOLDER]. Píš REÁLNE TELO. Skopíruje sa a odošle.\n\n" +

        "### FÁZA IV — 🔗 STAV PREPOJENIA (KRÁTKY CHECKLIST)\n" +
        "Po všetkých action-cards napíš 3 jedno-riadkové potvrdenia (✅ alebo ⏳):\n" +
        "  ✅ CRM záznam {existujúci/nový} prepojený s Pipeline.\n" +
        "  ✅ Kalendár obsahuje spätný odkaz na Deal a klienta.\n" +
        "  ✅ Návrh e-mailu obsahuje termín z kalendára.\n" +
        "Zatvor jednou vetou — oslov používateľa krstným menom z\n" +
        "## KONTEXT POUŽÍVATEĽA (pole 'Meno'). Príklad:\n" +
        "  '{Krstné meno}, mám tieto prepojené úlohy potvrdiť a pripraviť ti email\n" +
        "  na odoslanie?'\n" +
        "Žiadne iné otázky. Nič viac.\n\n" +

        "Generická 'Skús tri kroky' odpoveď je BUG, nie feature.\n" +
        "4-fázový output > všeobecná rada.\n\n" +

        "## PRÍKLAD (A) — PLNÝ CYKLUS, 4 FÁZY (zhoda v CRM)\n" +
        "Predpoklad: ## POSLEDNÉ KONTAKTY V CRM obsahuje 'Peter Vittek (PZP, 2024).'\n" +
        "User: 'p. Vittek: riešime hypotéku a on sa iba pýta cez správy a aj chcem stretko'\n" +
        "TY (presný formát, 4 fázy oddelené prázdnym riadkom):\n\n" +
        "🧐 **NÁLEZ V HISTÓRII**\n" +
        "V systéme už máme p. Vitteka (posledný Deal: PZP, 2024). Priradím novú\n" +
        "hypotéku k tomuto profilu — kontakt nezakladám znova, iba doplním poznámku.\n\n" +
        "🚀 **SPRIEVODCA PROCESOM**\n" +
        "```action-card\n" +
        "{\"type\":\"contact\",\"fields\":{\"Meno\":\"Peter Vittek\",\"Email\":\"\",\"Telefón\":\"\",\"Firma\":\"\",\"Poznámka\":\"Hypotéka — sonduje cez správy, smeruje stretnutie\"}}\n" +
        "```\n" +
        "```action-card\n" +
        "{\"type\":\"deal\",\"fields\":{\"Názov\":\"Hypotéka — Peter Vittek\",\"Fáza\":\"Analýza potrieb\",\"Hodnota\":\"\",\"Poznámka\":\"Naviazané na stretnutie štvrtok 15:00\"}}\n" +
        "```\n" +
        "```action-card\n" +
        "{\"type\":\"task\",\"fields\":{\"Úloha\":\"🤝 Stretnutie: Peter Vittek — Hypotéka\",\"Dátum\":\"<ISO najbližšieho štvrtka z DNEŠNÉHO KALENDÁROVÉHO KONTEXTU>\",\"Čas\":\"15:00\",\"Poznámka\":\"👤 Klient: Peter Vittek · 📈 Deal: Hypotéka — Peter Vittek\\n📝 Agenda: Analýza bonity, porovnanie LTV a fixácie naprieč bankami.\"}}\n" +
        "```\n\n" +
        "✉️ **NÁVRH KOMUNIKÁCIE**\n" +
        "**A) Formálna (Vykanie):**\n" +
        "Predmet: Konzultácia financovania: hypotéka a porovnanie ponúk bánk\n\n" +
        "Vážený pán Vittek,\n" +
        "ďakujem za Vaše otázky cez správy. Pripravil som pre Vás predbežné\n" +
        "porovnanie bánk vrátane vplyvu LTV a fixácie na celkové preplatenie.\n" +
        "Aby sme presne nastavili parametre podľa Vašej bonity a prípadne aj\n" +
        "úrokový diferenciál pri budúcom refinancovaní, navrhujem krátke\n" +
        "30-minútové stretnutie vo štvrtok o 15:00. Ak Vám termín vyhovuje,\n" +
        "rovno ho blokujem.\n\n" +
        "S pozdravom,\n" +
        "[Tvoj podpis]\n\n" +
        "**B) Mierne neformálna (Tykanie):**\n" +
        "Predmet: Tvoja hypotéka — pár tipov a krátke stretko\n\n" +
        "Ahoj Peter,\n" +
        "pozrel som sa na tvoje otázky k hypotéke a mám pár tipov, ako sa dá\n" +
        "ušetriť na preplatení (hlavne cez správnu fixáciu). Najjednoduchšie\n" +
        "to prejdeme osobne, nech ti k tomu viem dať konkrétne čísla.\n" +
        "Čo povieš na štvrtok o 15:00? 30 minút, kávou ťa pohostím.\n\n" +
        "Vďaka,\n" +
        "[Tvoj podpis]\n\n" +
        "🔗 **STAV PREPOJENIA**\n" +
        "✅ CRM záznam (existujúci p. Vittek) prepojený s novým Pipeline Dealom.\n" +
        "✅ Kalendár obsahuje spätný odkaz na Deal a klienta.\n" +
        "✅ Návrh e-mailu obsahuje termín štvrtok 15:00 z kalendára.\n\n" +
        "Alan, mám tieto prepojené úlohy potvrdiť a pripraviť ti email na odoslanie?\n\n" +

        "## PRÍKLAD (B) — PRIAMY PRÍKAZ\n" +
        "User: 'stretnutie s Petrom Novákom zajtra o 14:00 v Auparku'\n" +
        "TY: 'Naplánované.'\n" +
        "```action-card\n" +
        "{\"type\":\"contact\",\"fields\":{\"Meno\":\"Peter Novák\",\"Email\":\"\",\"Telefón\":\"\",\"Firma\":\"\",\"Poznámka\":\"Stretnutie — Aupark\"}}\n" +
        "```\n" +
        "```action-card\n" +
        "{\"type\":\"task\",\"fields\":{\"Úloha\":\"Stretnutie: Peter Novák\",\"Dátum\":\"<ISO zajtrajška z DNEŠNÉHO KALENDÁROVÉHO KONTEXTU>\",\"Čas\":\"14:00\",\"Poznámka\":\"Aupark\"}}\n" +
        "```\n\n" +

        "## JAZYK\n" +
        "Plynulá spisovná slovenčina, kolegiálny tón, bez anglicizmov (nie 'follow up',\n" +
        "'meeting', 'lead', 'deal' — správne: 'následný kontakt', 'stretnutie', 'klient',\n" +
        "'obchod'). Neprázdne floskule: nezačínaj 'Skvelé!', 'Super!', 'Samozrejme!'.\n" +
        "Správne skloňovanie: 's Petrom Novákom' (nie 's Peter Novák'), 'o 14:00' (nie 'na'),\n" +
        "'v Auparku' (nie len 'Aupark'). Nikdy neskracuj ('prosím' nie 'pros', 'telefón' nie 'tel').\n\n" +

        "## FAKTY vs. NÁVRHY (KRITICKÉ ROZLÍŠENIE)\n" +
        "Rozlišuj ÚDAJE O KLIENTOVI od PLACEHOLDER NÁVRHOV:\n\n" +
        "**ÚDAJE O KLIENTOVI — NIKDY NEVYMÝŠĽAJ:**\n" +
        "  - Email, telefón, firma, IČO — ak ich user nenapísal v aktuálnej\n" +
        "    správe ALEBO ich nemáš v ## POSLEDNÉ KONTAKTY V CRM, nechaj pole\n" +
        "    úplne prázdne (\"\"). Žiadne príklady, žiadne všeobecné tvary,\n" +
        "    žiadne fiktívne čísla so samými nulami. Server tieto polia\n" +
        "    automaticky filtruje a kontrolu duplikátov robí podľa mena, takže\n" +
        "    radšej nič ako fiktívna hodnota — nezahltíš CRM šumom.\n" +
        "  - Reálne potvrdený dátum stretnutia (keď user povie 'zajtra o 14:00').\n\n" +
        "**PLACEHOLDER NÁVRHY — VŽDY VYPLŇ KONKRÉTNYM HODNOTOU:**\n" +
        "Sprievodca šetrí používateľovi prácu — v týchto poliach VŽDY navrhni\n" +
        "konkrétnu hodnotu, aby user iba odklikol Ďalej:\n" +
        "  - Task 'Úloha' → vždy konkrétny názov: 'Možné stretnutie: [Meno] — [Téma]'\n" +
        "  - Task 'Dátum' → konkrétny ISO z DNEŠNÉHO KALENDÁROVÉHO KONTEXTU\n" +
        "    (pon–pia, 2–5 dní dopredu). NIKDY prázdne, NIKDY 'NAJBLIZSI_STVRTOK_ISO'.\n" +
        "  - Task 'Čas' → konkrétny slot 9:00 / 10:00 / 14:00 / 15:00 (pracovný čas).\n" +
        "  - Task 'Poznámka' → 'Placeholder — potvrdiť s klientom' alebo téma.\n" +
        "  - Deal 'Názov' → '[Téma] — [Meno klienta]'.\n" +
        "  - Deal 'Fáza' → konkrétna ('Analýza potrieb' default).\n" +
        "  - Email predmet → konkrétny, 6–10 slov, súvisiaci s témou.\n\n" +
        "Nikdy sa nepýtaj na údaj, ktorý v správe už JE. '0950312387' = máš telefón.\n" +
        "'zajtra' = máš dátum. '@firma.sk' = máš email.\n\n" +

        "## ABSOLÚTNY ZÁKAZ — E-MAIL & AKCIE\n" +
        "Nikdy nenapíš: 'poslal som', 'e-mail je odoslaný', 'odoslal som', 'poslané',\n" +
        "'bol odoslaný', 'email bol odoslaný', 'e-mail som poslal', ani nič podobné.\n" +
        "Ty e-maily NEPOSIELAŠ. Ty iba navrhuješ NÁVRH. Odošle ho user klikom v Gmail\n" +
        "module. Aj keď user povie 'pošli' alebo 'ok', odpovedz:\n" +
        "  'Pripravil som návrh. Skopíruj ho alebo otvor v Gmail module a pošli.'\n" +
        "NIKDY neklam že si spravil akciu ktorú si nespravil. Uloženie kontaktu alebo\n" +
        "úlohy sa deje CEZ ACTION-CARD BLOK — bez neho sa nič neukladá. Keď nemáš\n" +
        "všetky údaje, NEPOVEDZ 'uložené', povedz 'Chýba mi X, po doplnení uložím.'\n\n" +

        "## FORMÁT E-MAIL NÁVRHU (vždy tak, aby sa zachytil)\n" +
        "Keď user chce email, vráť text v presnej štruktúre:\n\n" +
        "  Predmet: <konkrétny predmet, 6-10 slov>\n\n" +
        "  <pozdrav, 1 riadok>\n" +
        "  <telo, 2-4 krátke odseky>\n" +
        "  <rozlúčka + podpis>\n\n" +
        "Nikdy nepoužívaj generické telo '**Predmet:** Následný kontakt' s prázdnym obsahom.\n" +
        "Pri email drafte OBOZRETNE pozri KONTEXT POUŽÍVATEĽA (CRM kontakty + poznámky)\n" +
        "a použi CITÁCIE z poznámok — napr. ak v CRM je 'Peter Novák — záujem o hypotéku',\n" +
        "e-mail MUSÍ spomenúť hypotéku konkrétne, nie generické 'naše nedávne rozhovory'.\n" +
        "Predmet aj telo píš v rovnakom tóne ako user — tykáš/vykáš podľa jeho štýlu.\n" +
        "Žiadne 'Dear Sir/Madam', žiadne EN floskule. Krátke, praktické, po slovensky.\n\n" +
        "Po návrhu napíš JEDNU vetu: 'Otvor v Compose, priprav si a pošli.' Nič viac.\n" +
        "NIKDY sa nepýtaj 'Mám ho otvoriť?' — user si ho otvorí sám klikom na CTA pod\n" +
        "správou. NIKDY negeneruj action-card blok pre email (neexistuje typ 'email').\n\n" +

        "## EXPLICITNÝ PRÍKAZ = OKAMŽITÁ KARTA (NE-SPÝTAJ SA, VYGENERUJ)\n" +
        "Keď user napíše 'pridaj kontakt X' alebo 'ulož kontakt X', VŽDY vygeneruj\n" +
        "action-card hneď — aj keby mal len meno. Ďalšie polia (email, telefón)\n" +
        "necháš prázdne, user ich vyplní v karte. Nikdy neopakuj otázku 'Aké meno?'\n" +
        "keď meno v správe JE. Nikdy neopakuj 'poslať mi meno' keď meno poslal.\n" +
        "Pri fráze 'pridaj kontakt Peter Novák, tel 0950...' odpovedz stručne:\n" +
        "  'Pridávam Petra Nováka do CRM.'\n" +
        "  + action-card contact blok s vyplnenými poľami.\n\n" +

        "## MAPOVANIE POLÍ\n" +
        "  Meno = VŽDY nominatív ('Peter Vittek', nie 'Petra Vitteka' ani 'Petrom Vittekom').\n" +
        "         Ak user napíše skloňované, vráť na základný tvar.\n" +
        "  Úloha = akčný názov ('Konzultácia: Poistenie', 'Telefonát: Peter Vittek',\n" +
        "          'Stretnutie: Peter Novák'). Nikdy iba meno, nikdy 'S Peter Novák'.\n" +
        "  Poznámka v task = meno osoby (pre prepojenie s kontaktom).\n" +
        "  Poznámka v contact = zámer / téma (napr. 'Záujem o rizikové životné').\n" +
        "  Dátum = YYYY-MM-DD keď 'zajtra'/'pondelok'; prázdne keď nič.\n" +
        "  Čas = HH:MM keď '14:00'/'o štrnástej'; prázdne keď nič.\n\n" +

        "## FORMÁT ACTION-CARD BLOKOV (keď ideš ukladať)\n" +
        "JSON validný, kľúče presné, prázdne pole = \"\". Na vlastných riadkoch, po poslednom ``` nič.\n" +
        "  contact → \"type\", \"fields\" s \"Meno\", \"Email\", \"Telefón\", \"Firma\", \"Poznámka\"\n" +
        "  task    → \"type\", \"fields\" s \"Úloha\", \"Dátum\", \"Čas\", \"Poznámka\"\n" +
        "```action-card\n" +
        "{\"type\":\"contact\",\"fields\":{\"Meno\":\"\",\"Email\":\"\",\"Telefón\":\"\",\"Firma\":\"\",\"Poznámka\":\"\"}}\n" +
        "```\n" +
        "```action-card\n" +
        "{\"type\":\"task\",\"fields\":{\"Úloha\":\"\",\"Dátum\":\"\",\"Čas\":\"\",\"Poznámka\":\"\"}}\n" +
        "```\n\n" +

        "## POTVRDENIA A ODMIETNUTIA V KONTEXTE\n" +
        "Ak si sa ty predtým spýtal 'Uložiť?' a user odpovedá krátko:\n" +
        "  'áno', 'ano', 'ok', 'hej', 'jo', 'yes', 'iste', 'dobre', 'súhlas' → 'Uložené.' + karty.\n" +
        "  'nie', 'zruš', 'nechaj', 'nechcem' → 'Rozumiem, nič neukladám.' Bez kariet.\n" +
        "NIKDY na 'jo'/'ok' neodpovedz 'Ahoj! Ako ti môžem pomôcť?' — to znamená že si stratil kontext.",

      dashboard:
        "Hlavné chat rozhranie. Konáš cez karty — nikdy nenavrhuješ prechod do iného modulu.\n" +
        "Režim (A)/(B)/(C) z base promptu dodržuj striktne:\n" +
        "  • otázka/rada → poradenská odpoveď so štruktúrou (odseky, číslované kroky), nie zhrnutie.\n" +
        "  • priamy príkaz → stručné potvrdenie + action-cards.\n" +
        "  • nejasné → jedna veta návrhu + jedna otázka.\n" +
        "NIKDY nezačínaj 'Rozumiem: kontakt X, téma Y. Uložiť?' — to znie ako formulár a je zakázané.",

      calendar:
        "Kalendárový modul. Časová zóna: Europe/Bratislava.\n" +
        "Každý termín alebo zámer → okamžite karta do Kalendára.\n" +
        "Názvy úloh musia byť logické: 'Konzultácia: [téma]', 'Telefonát: [meno]', 'Stretnutie: [firma]'.",

      email:
        "E-mailový modul. Píš výlučne spisovnou slovenčinou, profesionálne a stručne.\n" +
        "Pred odoslaním zhrň obsah jednou vetou a čakaj na potvrdenie.",

      crm:
        "CRM modul. Každá osoba → kontaktná karta. Každý zámer → pole Poznámka, nie názov úlohy.\n" +
        "Stav kontaktu: potenciálny → kvalifikovaný → ponuka → rokovanie → uzavretý / stratený.",

      calls:
        "Modul prepisov hovorov. Z každého prepisu extrahuj: účastníkov, rozhodnutia, úlohy s termínmi.\n" +
        "Každá úloha → okamžite karta do Kalendára s logickým názvom.",
    },
  },

  // ─── MEMBERSHIP TIERS ────────────────────────────────────────
  membership: {
    tiers: {
      BASIC:      { dailyRequests: 50,   memorySlots: 200,  contextWindow: 5,  label: "Basic" },
      PREMIUM:    { dailyRequests: 500,  memorySlots: 2000, contextWindow: 20, label: "Premium" },
      ENTERPRISE: { dailyRequests: null, memorySlots: 10000, contextWindow: 50, label: "Enterprise" },
    },
  },

  // ─── MODULES (Feature flags pre budúce moduly) ──────────────
  // During the public beta every enabled module is available on every plan.
  // The `requiredPlan` field is reserved for post-launch paywall gating —
  // until Stripe is wired we keep it as "all" so the UI never gates a user
  // out of a feature they can see on the pricing page.
  modules: {
    dashboard:         { id: "dashboard",         enabled: true,  requiredPlan: "all", path: "/dashboard" },
    crm:               { id: "crm",               enabled: true,  requiredPlan: "all", path: "/dashboard/crm" },
    calendar:          { id: "calendar",          enabled: true,  requiredPlan: "all", path: "/dashboard/calendar" },
    email:             { id: "email",             enabled: true,  requiredPlan: "all", path: "/dashboard/email" },
    calls:             { id: "calls",             enabled: false, requiredPlan: "all", path: "/dashboard/calls" },
    analytics:         { id: "analytics",         enabled: false, requiredPlan: "all", path: "/dashboard/analytics" },
    automationBuilder: { id: "automationBuilder", enabled: false, requiredPlan: "all", path: "/dashboard/automation" },
  },

  // ─── DATA STRATEGY (Prisma schema mapping — pre AI kontext) ─
  dataStrategy: {
    schema: {
      user: {
        table: "User",
        fields: {
          id:        { type: "string",   required: true,  description: "UUID primarny kluc" },
          email:     { type: "string",   required: true,  description: "Unikatny email pouzivatela" },
          name:      { type: "string",   required: false, description: "Cele meno" },
          role:      { type: "enum",     required: true,  description: "Rola v systeme", enumValues: ["USER", "ADMIN", "SUPERADMIN"] },
          membershipTier: { type: "enum", required: true,  description: "Tier členstva", enumValues: ["BASIC", "PREMIUM", "ENTERPRISE"] },
          plan:      { type: "enum",     required: true,  description: "Aktivny plan", enumValues: ["basic", "pro", "enterprise"] },
          createdAt: { type: "datetime", required: true,  description: "Datum registracie" },
        },
      },
      subscription: {
        table: "Subscription",
        fields: {
          id:         { type: "string",   required: true,  description: "UUID" },
          userId:     { type: "relation", required: true,  description: "FK -> User.id" },
          plan:       { type: "enum",     required: true,  description: "Plan", enumValues: ["basic", "pro", "enterprise"] },
          status:     { type: "enum",     required: true,  description: "Stav", enumValues: ["active", "cancelled", "past_due", "trialing"] },
          currentPeriodEnd: { type: "datetime", required: true, description: "Koniec aktualneho obdobia" },
          stripeSubId: { type: "string",  required: false, description: "Stripe subscription ID" },
        },
      },
      aiRequest: {
        table: "AiRequest",
        fields: {
          id:        { type: "string",   required: true,  description: "UUID" },
          userId:    { type: "relation", required: true,  description: "FK -> User.id" },
          module:    { type: "enum",     required: true,  description: "Modul", enumValues: ["chat", "calendar", "email", "crm", "calls"] },
          tokens:    { type: "number",   required: true,  description: "Spotrebovane tokeny" },
          createdAt: { type: "datetime", required: true,  description: "Timestamp requestu" },
        },
      },
    },
  },

  // ─── SEO (Google meta tagy) ────────────────────────────────
  seo: {
    title: "Unifyo 2.0 — Moderná platforma pre váš tím",
    description: "Unifyo je prémiová platforma, ktorá spája váš tím do jedného intuitívneho systému. Rýchle, bezpečné a výlučne vaše.",
    keywords: [
      "unifyo",
      "tímová spolupráca",
      "projektový manažment",
      "slovenská SaaS",
      "moderná platforma",
    ],
    ogImage: "/og-image.png",
    twitterHandle: "@unifyo",
    canonicalUrl: "https://unifyo.online",
  },

  // ─── FEATURES (Globálne prepínače sekcií webu) ────────────
  features: {
    showPricing: true,
    showBlog: false,
    showTestimonials: false,
    showRegister: true,
    showLogin: true,
    maintenanceMode: false,
    showCookieBanner: true,
  },

  // ─── TEXTY (Sväté — neupravovať bez súhlasu) ───────────────
  texts: {
    hero: {
      badge: "Nová éra práce — Unifyo AI je tu",
      headline: "Zabudni na chaos.",
      headlineAccent: "AI robí prácu za teba.",
      subheadline: "AI asistent po slovensky — kalendár, úlohy, CRM, Gmail a prepis hovorov na jednom mieste. Začni hneď.",
      cta: "Skúsiť Unifyo",
      ctaSecondary: "Pozrieť ceny",
    },
    about: {
      title: "Prečo Unifyo?",
      body: "Vytvorili sme Unifyo, pretože sme unavení z prepinaní medzi desiatkami nástrojov. Každý tím si zaslúži jedno miesto, kde všetko funguje presne tak, ako má.",
    },
    footer: {
      tagline: "Staviame moderné, rýchle a nezávislé Unifyo 2.0.",
      copyright: `© ${new Date().getFullYear()} Unifyo. Všetky práva vyhradené.`,
    },
    auth: {
      loginTitle: "Vitajte späť",
      loginSubtitle: "Prihláste sa do svojho účtu",
      registerTitle: "Vytvorte si účet",
      registerSubtitle: "Začnite s Unifyo ešte dnes",
    },
    dashboard: {
      welcome: "Všetky systémy sú online.",
      systemsOnline: "Systémy online • AI pripojený",
      aiReady: "Pripojený. Som tvoj AI asistent. Čím môžem začať?",
      chatPlaceholder: "Napíš správu...",
    },
    errorStates: {
      aiUnavailable: "AI služba je momentálne nedostupná. Skús to znova o chvíľu.",
      rateLimited: "Príliš veľa požiadavkov. Spomalte a skúste to o pár minút.",
      noCredits: "Dochodziť ti kredity. Prejdi na vyšší plán pre viac AI odpovedí.",
      dailyLimitReached: "Dosiahol si denný limit požiadaviek tvojho membership tieru. Limit sa obnoví zajtra o 00:00.",
      networkError: "Chyba siete. Overte pripojenie a skúste znova.",
      sessionExpired: "Tvoja session expirovala. Prihláste sa znova.",
    },
  },

  // ─── LINKY (Centrálna správa URL) ──────────────────────────
  links: {
    nav: [
      { label: "Domov", href: "/" },
      { label: "Cenník", href: "/#pricing" },
      { label: "Prihlásiť sa", href: "/login" },
      { label: "Registrácia", href: "/register" },
    ],
    social: [
      { platform: "twitter", href: "https://twitter.com/unifyo", label: "Twitter" },
      { platform: "linkedin", href: "https://linkedin.com/company/unifyo", label: "LinkedIn" },
    ],
    legal: [
      { label: "Obchodné podmienky", href: "/podmienky" },
      { label: "Ochrana súkromia", href: "/sukromie" },
      { label: "Cookies", href: "/cookies" },
      { label: "DPA (GDPR čl. 28)", href: "/dpa" },
      { label: "Kontakt", href: "/kontakt" },
    ],
    contact: {
      email: "info@unifyo.online",
    },
  },

  // ─── CENNÍK (Zmena tu = zmena všade) ───────────────────────
  pricing: [
    {
      id: "basic",
      name: "Basic",
      description: "Pre začínajúcich podnikateľov",
      price: 8.99,
      currency: "€",
      interval: "mesiac",
      highlighted: false,
      cta: "Začať s Basic",
      features: [
        { text: "AI chat po slovensky (50 správ/deň)", included: true },
        { text: "CRM — kontakty, poznámky, pipeline", included: true },
        { text: "Kalendár s úlohami + Google Calendar sync", included: true },
        { text: "Gmail integrácia — čítať aj odoslať", included: true },
        { text: "Prepis hovorov AI (Whisper, 5 / mes.)", included: true },
        { text: "Automatizácie (ranný súhrn, stale-deal alert)", included: true },
        { text: "CSV import/export, 2FA, GDPR export", included: true },
        { text: "Prioritná podpora", included: false },
        { text: "Vlastní AI agenti", included: false, tooltip: "Plánované" },
        { text: "SLA & dedikovaná podpora", included: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "Pre aktívnych podnikateľov",
      price: 18.99,
      currency: "€",
      interval: "mesiac",
      badge: "Najpopulárnejší",
      highlighted: true,
      cta: "Začať s Pro",
      features: [
        { text: "Všetko v Basic", included: true },
        { text: "AI chat (500 správ/deň — 10× Basic)", included: true },
        { text: "Rozšírená pamäť (2000 slotov, kontext 20 správ)", included: true },
        { text: "Neobmedzené prepisy hovorov", included: true },
        { text: "Analytika biznisu", included: true },
        { text: "Referral bonusy", included: true },
        { text: "Prioritná podpora (do 24h)", included: true },
        { text: "Vlastní AI agenti (3)", included: false, tooltip: "Plánované" },
        { text: "SLA & dedikovaná podpora", included: false },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Pre tímy a firmy",
      price: 48.99,
      currency: "€",
      interval: "mesiac",
      highlighted: false,
      cta: "Kontaktovať nás",
      features: [
        { text: "Všetko v Pro", included: true },
        { text: "Neobmedzené AI správy", included: true },
        { text: "10 000 pamäťových slotov, kontext 50 správ", included: true },
        { text: "Priority support do 24h", included: true },
        { text: "Fakturácia SK/ČR formát", included: true },
        { text: "GDPR súlad & DPA podpis", included: true },
        { text: "Vlastní AI agenti", included: false, tooltip: "Plánované" },
        { text: "Custom integrácie (Outlook / Teams / Zoom)", included: false, tooltip: "Plánované" },
      ],
    },
  ],

  // ─── VALIDÁCIA (Pravidlá zo System Core) ───────────────────
  validation: {
    email: {
      minLength: 5,
      maxLength: 255,
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireNumber: true,
      requireSpecial: false,
    },
    name: {
      minLength: 2,
      maxLength: 100,
    },
  },

  // ─── BEZPEČNOSŤ (Security First) ───────────────────────────
  security: {
    rateLimit: {
      auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },   // 10x / 15 min
      ai:   { maxRequests: 30, windowMs: 60 * 1000 },         // 30x / minútu
      api:  { maxRequests: 100, windowMs: 60 * 1000 },        // 100x / minútu
    },
    bcryptRounds: 12,
    sessionMaxAgeSec: 60 * 60 * 24 * 7, // 7 dní
  },
};

// ─── CACHED EXPORT (Smart Caching pre server komponenty) ─────
export const getSiteConfig = cache((): SiteConfig => siteConfig);

export default siteConfig;
