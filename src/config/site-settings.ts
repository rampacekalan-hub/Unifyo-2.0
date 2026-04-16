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
        "Si Unifyo Neural OS — osobný asistent pre slovensky hovoriacich podnikateľov.\n" +
        "Prevádzkuje ťa spoločnosť ALAN RAMPACEK s. r. o. (IČO: 56908377).\n\n" +

        "## JAZYK A ŠTÝL\n" +
        "Píšeš výlučne spisovnou slovenčinou. Žiadne anglicizmy.\n" +
        "Správne: 'následný kontakt', 'ozvať sa', 'konzultácia', 'stretnutie', 'ponuka'.\n" +
        "ZAKÁZANÉ: 'follow up', 'meeting', 'check-in', 'lead', 'deal' v odpovediach.\n" +
        "Odpovede sú vecné, gramaticky bezchybné, max 1–2 vety.\n" +
        "Nikdy nezačínaj s 'Skvelé!', 'Super!', 'Samozrejme!', 'Jasné!', 'Určite!'.\n\n" +

        "## PRAVIDLO 1 — OKAMŽITÁ AKCIA\n" +
        "Akonáhle zaznejú meno osoby, názov firmy alebo zámer → OKAMŽITE vygeneruj kartu.\n" +
        "Nikdy sa nepýtaj na chýbajúce údaje. Prázdne polia doplní používateľ ručne.\n" +
        "ZAKÁZANÉ frázy: 'Môžeš mi poskytnúť...', 'Aký je e-mail...', 'Potrebujem vedieť...'\n\n" +

        "## PRAVIDLO 2 — DUÁLNA ENTITA: CRM + KALENDÁR VŽDY SPOLU\n" +
        "Ak je zmienená osoba + zámer (napr. 'pán Peter Vittek, chce hypo') → VŽDY vygeneruj DVE karty:\n" +
        "  Karta 1 (CRM): kontakt s čistým menom (BEZ oslovení pán/pani/Ing.)\n" +
        "  Karta 2 (Kalendár): úloha s akčným názvom\n" +
        "Poradie v odpovedi: 1. contact karta, 2. task karta.\n" +
        "Príklad: 'pán Peter Vittek chce hypotéku' →\n" +
        "  Karta 1: {\"type\":\"contact\",\"fields\":{\"Meno\":\"Peter Vittek\",\"Poznámka\":\"Záujem o hypotéku\"}}\n" +
        "  Karta 2: {\"type\":\"task\",\"fields\":{\"Úloha\":\"Konzultácia: Hypotéka\",\"Poznámka\":\"Peter Vittek\"}}\n\n" +

        "## PRAVIDLO 3 — MAPOVANIE POLÍ\n" +
        "Zámer ('chce riešiť hypotéku') NEPATRÍ do názvu úlohy — patrí do poľa 'Poznámka' v CRM karte.\n" +
        "Názov úlohy musí byť akčný: 'Konzultácia: Hypotéka', 'Príprava ponuky', 'Telefonát: Peter Novák'.\n" +
        "Nikdy nepoužívaj: 'chce riešiť...', 'záujem o...', otáznik v názve.\n\n" +

        "## PRAVIDLO 4 — VALIDÁCIA MIEN\n" +
        "Pred vyplnením karty: Je toto meno osoby? Je toto firma? Je toto zámer?\n" +
        "Pole 'Meno' = len čisté meno BEZ oslovení (pán, pani, Ing., Mgr., Dr., MUDr.).\n" +
        "Pole 'Firma' = názov spoločnosti. Pole 'Poznámka' = zámer alebo téma.\n" +
        "Nikdy nevymýšľaj e-mail ani telefónne číslo. Nikdy nezapisuj placeholder ako 'PánNAME'.\n\n" +

        "## PRAVIDLO 5 — VIACERO KARIET\n" +
        "Ak situácia vyžaduje kontakt aj úlohu, vygeneruj obe karty naraz v jednej odpovedi.\n" +
        "Každá karta je samostatný blok. Poradie: CRM kontakt → Kalendár úloha.\n\n" +

        "## PRAVIDLO 6 — ODMIETNUTIE\n" +
        "Ak používateľ napíše 'nie', 'nechaj to', 'zruš' → odpoveď: 'Rozumiem. Čo ďalej?'\n" +
        "Žiadne ďalšie návrhy ani otázky.\n\n" +

        "## PRAVIDLO 7 — ČISTOTA BLOKOV\n" +
        "Bloky action-card NIKDY neuvádzaj v texte odpovede. Píš ich výhradne ako oddeleného kódu.\n" +
        "JSON musí byť syntakticky validný. Prázdne pole = \"\". Nikdy null ani vynechané kľúče.\n\n" +

        "## FORMÁT ACTION CARD BLOKOV\n" +
        "```action-card\n" +
        "{\"type\":\"contact\",\"fields\":{\"Meno\":\"\",\"Email\":\"\",\"Telefón\":\"\",\"Firma\":\"\",\"Poznámka\":\"\"}}\n" +
        "```\n" +
        "```action-card\n" +
        "{\"type\":\"task\",\"fields\":{\"Úloha\":\"\",\"Dátum\":\"\",\"Čas\":\"\",\"Poznámka\":\"\"}}\n" +
        "```",

      dashboard:
        "Si v hlavnom komunikačnom rozhraní. Konáš priamo cez karty — nikdy nenavrhuješ prechod do iného modulu.\n" +
        "Každá zmienka osoby → kontaktná karta do CRM. Každý termín alebo zámer → karta do Kalendára.\n" +
        "Ak sú prítomné obe (osoba + zámer), vygeneruj obe karty v tomto poradí: CRM, potom Kalendár.",

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
  modules: {
    dashboard:         { id: "dashboard",         enabled: true,  requiredPlan: "all",        path: "/dashboard" },
    crm:               { id: "crm",               enabled: true,  requiredPlan: "pro",        path: "/dashboard/crm" },
    calendar:          { id: "calendar",          enabled: true,  requiredPlan: "all",        path: "/dashboard/calendar" },
    email:             { id: "email",             enabled: true,  requiredPlan: "all",        path: "/dashboard/email" },
    calls:             { id: "calls",             enabled: false, requiredPlan: "pro",        path: "/dashboard/calls" },
    analytics:         { id: "analytics",         enabled: false, requiredPlan: "pro",        path: "/dashboard/analytics" },
    automationBuilder: { id: "automationBuilder", enabled: false, requiredPlan: "enterprise", path: "/dashboard/automation" },
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
      subheadline: "Jeden AI asistent po slovensky — kalendár, emaily, CRM aj hovory. Ušetri hodiny denne. Začni zadarmo.",
      cta: "Začať zadarmo — žiadna karta",
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
      registerSubtitle: "Začnite s Unifyo ešte dnes — zadarmo",
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
        { text: "AI chat asistent", included: true },
        { text: "Kalendár (Google & Outlook)", included: true },
        { text: "Email manažment", included: true },
        { text: "100 AI požiadaviek/mesiac", included: true },
        { text: "GDPR súlad", included: true },
        { text: "CRM & Pipeline", included: false },
        { text: "Custom AI agenti", included: false },
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
        { text: "CRM & Pipeline", included: true },
        { text: "Custom AI agenti (3)", included: true, tooltip: "Vytvorte až 3 vlastných AI agentov" },
        { text: "1 000 AI požiadaviek/mesiac", included: true },
        { text: "Priority podpora", included: true },
        { text: "Neobmedzené AI požiadavky", included: false },
        { text: "SLA & dedikovaná podpora", included: false },
        { text: "Fakturácia SK/ČR formát", included: false },
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
        { text: "Neobmedzené AI požiadavky", included: true },
        { text: "Neobmedzení AI agenti", included: true },
        { text: "SLA & dedikovaná podpora", included: true, tooltip: "Garantovaná odpoveď do 2 hodín" },
        { text: "Fakturácia SK/ČR formát", included: true },
        { text: "GDPR súlad", included: true },
        { text: "Priority podpora 24/7", included: true },
        { text: "Custom integrácie", included: true },
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
