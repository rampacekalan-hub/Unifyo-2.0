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

export interface BrandingConfig {
  colors: {
    primary: string;
    primaryGlow: string;
    accent: string;
    accentGlow: string;
    surface: string;
    surfaceHigh: string;
    surfaceHigher: string;
    border: string;
    borderGlow: string;
    text: string;
    textMuted: string;
    background: string;
    backgroundDeep: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  borderRadius: string;
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

export interface TextsConfig {
  hero: {
    badge: string;
    headline: string;
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
      primary: "#6366f1",
      primaryGlow: "rgba(99, 102, 241, 0.35)",
      accent: "#8b5cf6",
      accentGlow: "rgba(139, 92, 246, 0.3)",
      surface: "#0f1117",
      surfaceHigh: "#161b27",
      surfaceHigher: "#1e2535",
      border: "rgba(99,102,241,0.15)",
      borderGlow: "rgba(99,102,241,0.5)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
      background: "#080b12",
      backgroundDeep: "#04060a",
    },
    fonts: {
      sans: "var(--font-geist-sans)",
      mono: "var(--font-geist-mono)",
    },
    borderRadius: "0.75rem",
  },

  // ─── SEO (Google meta tagy) ────────────────────────────────
  seo: {
    title: "Unifyo 2.0 — Moderná platforma pre váš tím",
    description:
      "Unifyo je prémiová platforma, ktorá spája váš tím do jedného intuitívneho systému. Rýchle, bezpečné a výlučne vaše.",
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

  // ─── FEATURES (Globálne prepínače sekcií) ──────────────────
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
      badge: "Nová éra produktivity",
      headline: "Váš tím. Jeden systém. Nekonečné možnosti.",
      subheadline:
        "Unifyo spája komunikáciu, projekty a ľudí do jednej plynulej skúsenosti. Zabudnite na chaos — vitajte v ére sústredenia.",
      cta: "Začať zadarmo",
      ctaSecondary: "Pozrieť demo",
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
    ],
    contact: {
      email: "hello@unifyo.online",
    },
  },

  // ─── CENNÍK (Zmena tu = zmena všade) ───────────────────────
  pricing: [
    {
      id: "starter",
      name: "Štarter",
      description: "Ideálny pre jednotlivcov a malé projekty",
      price: 0,
      currency: "€",
      interval: "mesiac",
      highlighted: false,
      cta: "Začať zadarmo",
      features: [
        { text: "Až 3 projekty", included: true, tooltip: "Môžete spravovať až 3 aktívne projekty súčasne" },
        { text: "5 GB úložisko", included: true },
        { text: "Základná podpora", included: true },
        { text: "Pokročilá analytika", included: false },
        { text: "Vlastná doména", included: false },
        { text: "Prioritná podpora", included: false },
      ],
    },
    {
      id: "pro",
      name: "Pro",
      description: "Pre rastúce tímy, ktoré myslia na výkon",
      price: 19,
      currency: "€",
      interval: "mesiac",
      badge: "Najpopulárnejší",
      highlighted: true,
      cta: "Vyskúšať Pro",
      features: [
        { text: "Neobmedzené projekty", included: true },
        { text: "50 GB úložisko", included: true },
        { text: "Pokročilá analytika", included: true, tooltip: "Detailné reporty o výkonnosti tímu" },
        { text: "Vlastná doména", included: true },
        { text: "Prioritná podpora", included: true },
        { text: "API prístup", included: false },
      ],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Pre organizácie, ktoré neprijímajú kompromisy",
      price: 49,
      currency: "€",
      interval: "mesiac",
      highlighted: false,
      cta: "Kontaktovať nás",
      features: [
        { text: "Neobmedzené projekty", included: true },
        { text: "500 GB úložisko", included: true },
        { text: "Pokročilá analytika", included: true },
        { text: "Vlastná doména", included: true },
        { text: "Prioritná podpora 24/7", included: true, tooltip: "Garantovaná odpoveď do 2 hodín" },
        { text: "API prístup", included: true },
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
