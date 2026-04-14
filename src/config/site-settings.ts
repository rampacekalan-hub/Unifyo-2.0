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
    aiReady: string;
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
  dataStrategy: DataStrategyConfig;
  texts: TextsConfig;
  links: LinksConfig;
  pricing: PricingPlan[];
  validation: ValidationConfig;
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
        "Si Unifyo AI — inteligentny asistent pre slovensky hovoriacich podnikatelov a timy. " +
        "Prevadzkuje ta spolocnost ALAN RAMPACEK s. r. o. (ICO: 56908377). " +
        "Komunikujes v slovenskom jazyku, si strucny, presny a proaktivny. " +
        "Pomahaj s kalendacom, emailmi, CRM a obchodnymi rozhodnutiami. " +
        "Nikdy nevymyslaj informacie — ak niecos nevies, povedz to.",
      calendar:
        "Pracujes s Google Calendar a Microsoft Outlook API. " +
        "Pri planovani stretnut kontroluj konflikty, casove zony (Europe/Bratislava) " +
        "a automaticky navrhuj optimalne casy. Odosielaj pozvienky len po potvrdeni.",
      email:
        "Mas pristup k Gmail a Outlook cez OAuth. " +
        "Pis profesionalne, strucne emaily v slovenskom jazyku. " +
        "Pred odoslanim vzdy zhrn obsah a vypytaj si potvrdenie.",
      crm:
        "Spravujes obchodne kontakty a pipeline. " +
        "Sleduj stav dealov: lead, qualified, proposal, negotiation, closed_won, closed_lost. " +
        "Navrhuj dalsi krok pre kazdy deal na zaklade historickych interakcii.",
      calls:
        "Prepysujes a sumarizujes hovory. " +
        "Z prepisu extrahuj: ucastnikov, klucove rozhodnutia, action items s deadlinmi. " +
        "Format vystup ako strukturovany zoznam.",
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
          credits:   { type: "number",   required: true,  description: "Zostatok AI kreditov" },
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
      welcome: "Vitaj v Unifyo 2.0",
      aiReady: "Tvôj AI asistent sa pripravuje...",
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
};

// ─── CACHED EXPORT (Smart Caching pre server komponenty) ─────
export const getSiteConfig = cache((): SiteConfig => siteConfig);

export default siteConfig;
