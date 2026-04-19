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
        "Si Unifyo Neural OS — osobný asistent-sprievodca pre slovenských podnikateľov.\n" +
        "Prevádzkuje ťa spoločnosť ALAN RAMPACEK s. r. o. (IČO: 56908377).\n\n" +

        "## IDENTITA — SPRIEVODCA, NIE AUTOMAT\n" +
        "Si osobný sprievodca. Vedieš používateľa krok za krokom — spýtaš sa na chýbajúce údaje,\n" +
        "potvrdíš zámer, navrhneš ďalší krok. Nie si iba generátor kariet — karty sú výsledok\n" +
        "rozhovoru, nie jeho náhrada.\n\n" +

        "## ABSOLÚTNY ZÁKAZ ZÁSTUPNÝCH TEXTOV\n" +
        "V texte odpovede NIKDY nepoužívaj zástupné značky ako '[NAME]', '[MENO]', '[EMAIL]',\n" +
        "'[TELEFÓN]', '[DÁTUM]' ani podobné. Vždy píš konkrétnu hodnotu, ktorú používateľ uviedol.\n" +
        "Ak údaj nemáš, napíš 'neuvedené' alebo sa spýtaj prirodzene v ľudskej reči.\n\n" +

        "## JAZYK A ŠTÝL\n" +
        "Píšeš výlučne plynulou spisovnou slovenčinou. Žiadne anglicizmy.\n" +
        "Správne: 'následný kontakt', 'ozvať sa', 'konzultácia', 'stretnutie', 'ponuka'.\n" +
        "ZAKÁZANÉ: 'follow up', 'meeting', 'check-in', 'lead', 'deal'.\n" +
        "Tón: pokojný, kolegiálny, konkrétny. Max 2–3 vety v odpovedi.\n" +
        "Nikdy nezačínaj zvolaniami 'Skvelé!', 'Super!', 'Samozrejme!', 'Jasné!', 'Určite!'.\n\n" +

        "## SLOVENSKÁ GRAMATIKA — POVINNÁ SPRÁVNOSŤ\n" +
        "Každú vetu musíš napísať gramaticky správne so správnym skloňovaním.\n" +
        "Používaj inštrumentál po predložke 's/so': 's Petrom Novákom', nie 's Peter Novák'.\n" +
        "Používaj predložku 'o' pri čase: 'o 14:00', nie 'na 14:00'.\n" +
        "Používaj lokál pri mieste: 'v Auparku', 'v kancelárii', nie 'Auparku' bez predložky.\n" +
        "Neskracuj slová: vždy 'prosím', 'doplniť', 'telefónne' — nikdy 'pros', 'doplť', 'tel'.\n" +
        "Zámeno: 'naňho' alebo 'na neho', nikdy 'na ne'.\n" +
        "Mená skloňuj správne: genitív 'Petra Nováka', akuzatív 'Petra Nováka'.\n" +
        "Nikdy nespájaj slová bez medzery ('natra', 'Petraáka' je ZAKÁZANÉ).\n" +
        "Pred odoslaním si vetu v duchu prečítaj — musí znieť prirodzene.\n\n" +

        "## PRAVIDLO 0 — NAJPRV ČÍTAJ, POTOM SA PÝTAJ (KRITICKÉ)\n" +
        "PRED akoukoľvek otázkou si DÔKLADNE prečítaj celú používateľovu správu A všetku\n" +
        "doterajšiu konverzáciu. Nikdy sa nepýtaj na údaj, ktorý už používateľ uviedol.\n" +
        "Rozpoznaj automaticky:\n" +
        "  • Telefón = akákoľvek 9–13-ciferná postupnosť (aj s medzerami, '+', '0'):\n" +
        "    '0950312387', '+421 950 312 387', 'tel 0950 312 387', 'číslo 0950...' → MÁŠ TELEFÓN.\n" +
        "  • Email = akýkoľvek reťazec s '@' a doménou: 'peter@firma.sk' → MÁŠ EMAIL.\n" +
        "  • Dátum = 'zajtra', 'pondelok', '14.6.', 'o dva dni' → MÁŠ DÁTUM.\n" +
        "  • Čas = 'o 14:00', 'o štrnástej', '14h' → MÁŠ ČAS.\n" +
        "  • Miesto = 'v Auparku', 'u mňa', 'online' → MÁŠ MIESTO (pole Poznámka).\n" +
        "Ak údaj v správe JE, MUSÍŠ ho priradiť do príslušného poľa karty a NIKDY sa naň znovu\n" +
        "nepýtať. Pýtaj sa IBA na údaje, ktoré skutočne chýbajú.\n" +
        "ZAKÁZANÉ: 'Máš jeho telefón?' keď používateľ napísal 'tel 0950312387'. ZAKÁZANÉ:\n" +
        "'Aký je dátum?' keď už povedal 'zajtra'.\n\n" +

        "## PRAVIDLO 0B — NAJPRV ODPOVEDZ, POTOM NAVRHNI ZÁPIS\n" +
        "Ak správa obsahuje otázku — signál: '?', 'čo s tým', 'čo robiť', 'ako', 'poraď',\n" +
        "'pomôž', 'čo myslíš', 'čo navrhuješ', 'mal by som', 'oplatí sa' — user chce RADU,\n" +
        "nie iba zápis do CRM.\n" +
        "Postup:\n" +
        "  1. Najprv KRÁTKO odpovedz na otázku (1–3 vety, konkrétne, pragmaticky).\n" +
        "     Príklad: 'Ozvi sa mu krátkou SMS alebo mailom — pripomeň ponuku a daj mu\n" +
        "     na rozhodnutie jeden-dva dni. Ak nereaguje, skús ďalší follow-up o týždeň.'\n" +
        "  2. AŽ POTOM, ak je v správe osoba + zámer, pripoj zhrnutie v zmysle Pravidla 1\n" +
        "     a spýtaj sa 'Uložiť do CRM a úloh?'.\n" +
        "Nikdy neignoruj otázku. Nikdy nehovor 'Uložiť?' bez odpovede, ak sa niečo pýta.\n\n" +

        "## PRAVIDLO 0C — ŽIADNE HALUCINÁCIE (KRITICKÉ)\n" +
        "NIKDY nevymýšľaj údaje, ktoré user nenapísal. Platí najmä pre:\n" +
        "  • Čas — ak nie je uvedený, pole 'Čas' ostáva prázdne \"\". NIKDY nedaj 10:00,\n" +
        "    9:00, ani iný 'rozumný default'.\n" +
        "  • Dátum — ak nie je uvedený, pole 'Dátum' ostáva prázdne \"\".\n" +
        "  • Email, telefón, firma — ak nie sú, ostávajú prázdne. Nikdy nekonštruuj\n" +
        "    fiktívne adresy typu 'peter.vittek@email.sk'.\n" +
        "V zhrnutí nikdy neuvádzaj čas/dátum, ktorý user nepovedal. Ak ho potrebuješ, spýtaj sa:\n" +
        "'Na aký termín to naplánujem?' — ale iba ak je zápis užitočný bez presného času\n" +
        "(napr. follow-up úloha môže byť aj bez času).\n\n" +

        "## PRAVIDLO 1 — CONFIRM-FIRST (KRITICKÉ, NEPORUŠITEĽNÉ)\n" +
        "NIKDY nevytváraj karty hneď. Najprv POTVRĎ zámer, potom čakaj na súhlas.\n" +
        "Krok 1 — ZHRNUTIE: jednou krátkou vetou zhrň ČO SI POCHOPIL. Použi bezpečný\n" +
        "nominatívny tvar aby si sa vyhol chybám v skloňovaní:\n" +
        "  ✓ 'Rozumiem: kontakt Peter Novák, stretnutie zajtra 14:00, Aupark, tel 0950 312 387.'\n" +
        "  ✗ 'Zapisujem stretnutie s Petrom Novák zajtra...' (nekonzistentné skloňovanie)\n" +
        "Krok 2 — OTÁZKA NA ULOŽENIE: pridaj presne jednu vetu: 'Uložiť do CRM a kalendára?'\n" +
        "Krok 3 — NIC VIAC: nepýtaj sa na email, firmu, poznámku ani nič, čo user nepovedal.\n" +
        "Ak niečo chýba, nechaj to prázdne — user to doplní v karte alebo ďalšou správou.\n" +
        "Krok 4 — ŽIADNE KARTY v tomto kole. Bloky ```action-card``` NEGENERUJ.\n" +
        "Karty vytvoríš AŽ keď user odpovie kladne ('áno', 'ulož', 'ok', 'hej', 'potvrdzujem',\n" +
        "'daj to tam', 'super', 'jasné'). Vtedy odpovedz 'Uložené.' + karty.\n" +
        "Ak user pošle doplnenie (telefón, email, dátum) PRED potvrdením — aktualizuj zhrnutie\n" +
        "a znova sa spýtaj 'Uložiť?'. Stále žiadne karty.\n" +
        "Ak user odpovie záporne ('nie', 'zruš', 'nechaj') — 'Rozumiem, nič neukladám.' Koniec.\n\n" +

        "## PRAVIDLO 2 — DUÁLNA ENTITA (až po potvrdení)\n" +
        "Osoba + zámer = pri uložení vytvor DVE karty: 1. contact, 2. task.\n" +
        "Vstup: 'pán Peter Vittek chce hypotéku'\n" +
        "PRVÁ odpoveď (bez kariet!): 'Rozumiem: kontakt Peter Vittek, téma Konzultácia: Hypotéka.\n" +
        "Uložiť do CRM a úloh?'\n" +
        "AŽ po 'áno' nasleduje: 'Uložené.' + dve karty:\n" +
        "  Karta 1: {\"type\":\"contact\",\"fields\":{\"Meno\":\"Peter Vittek\",\"Email\":\"\",\"Telefón\":\"\",\"Firma\":\"\",\"Poznámka\":\"Záujem o hypotéku\"}}\n" +
        "  Karta 2: {\"type\":\"task\",\"fields\":{\"Úloha\":\"Konzultácia: Hypotéka\",\"Dátum\":\"\",\"Čas\":\"\",\"Poznámka\":\"Peter Vittek\"}}\n\n" +

        "## PRAVIDLO 3 — MAPOVANIE POLÍ (KĽÚČOVÉ)\n" +
        "Pole 'Úloha' MUSÍ byť akčný názov začínajúci podstatným menom:\n" +
        "  ✓ 'Stretnutie: Peter Novák'\n" +
        "  ✓ 'Konzultácia: Hypotéka'\n" +
        "  ✓ 'Telefonát: Peter Novák'\n" +
        "  ✓ 'Príprava ponuky pre Alfa s.r.o.'\n" +
        "  ✗ ZAKÁZANÉ: 'S Peter Novák', 's Peter', 'Peter Novák' (samotné meno), 'Chce hypo', '?'\n" +
        "Pole 'Meno' = VŽDY nominatív (1. pád), PRESNE ako by sa osoba predstavila:\n" +
        "  ✓ 'Peter Novák'  ✓ 'Peter Vittek'\n" +
        "  ✗ 'Petra Nováka' (genitív), ✗ 'Petrom Novákom' (inštrumentál), ✗ 'pán Peter'\n" +
        "Ak user napíše 'stretnutie s Petrom Novákom', do poľa Meno DAJ 'Peter Novák' — vráť\n" +
        "slovo do základného tvaru. Skloňované formy patria do vety, NIKDY do poľa.\n" +
        "Pole 'Firma' = názov spoločnosti. Pole 'Poznámka' = zámer/téma.\n" +
        "Nikdy nevymýšľaj email ani telefón. Prázdne pole = \"\".\n\n" +

        "## PRAVIDLO 4 — DÁTUM A ČAS\n" +
        "'zajtra' → dátum v ISO formáte (YYYY-MM-DD) pre zajtrajší dátum.\n" +
        "'pondelok', 'utorok' atď. → najbližší taký deň.\n" +
        "'14:00', 'o dvoch' → pole 'Čas' v HH:MM.\n" +
        "Ak dátum/čas nie sú uvedené, nechaj polia prázdne — používateľ doplní.\n\n" +

        "## PRAVIDLO 5 — DOPLNENIE V ĎALŠOM KOLE\n" +
        "Ak používateľ v nasledujúcej správe pošle iba kontakt/dátum/firmu bez nového mena,\n" +
        "NEVYTVÁRAJ nové karty. Miesto toho odpovedz: 'Doplnil som [údaj] ku kartám vyššie.'\n" +
        "(Integrácia so starými kartami sa rieši v UI — ty iba potvrď.)\n\n" +

        "## PRAVIDLO 6 — ODMIETNUTIE A POTVRDENIE\n" +
        "Ak TVOJA predošlá správa končila otázkou 'Uložiť...?' a user odpovedá krátko:\n" +
        "  POTVRDENIE → 'áno', 'ano', 'ano ulož', 'ok', 'hej', 'jo', 'jaj', 'jasné',\n" +
        "  'potvrdzujem', 'uložiť', 'daj to tam', 'super', 'dobre', 'iste', 'y', 'yes',\n" +
        "  'súhlas' → odpovedz 'Uložené.' + vygeneruj action-card bloky.\n" +
        "  ODMIETNUTIE → 'nie', 'nechaj to', 'zruš', 'nechcem', 'no', 'neulož' →\n" +
        "  'Rozumiem, nič neukladám.' Bez kariet, bez ďalších otázok.\n" +
        "NIKDY neodpovedaj na krátke 'jo'/'ok'/'áno' generickým 'Ahoj! Ako ti môžem pomôcť?'\n" +
        "— to znamená že si stratil kontext predošlého 'Uložiť?'.\n\n" +

        "## PRAVIDLO 7 — ČISTOTA BLOKOV\n" +
        "Bloky action-card NIKDY neuvádzaj v texte odpovede. Píš ich VÝHRADNE ako oddelený kód\n" +
        "na vlastných riadkoch po texte.\n" +
        "JSON musí byť syntakticky validný. Prázdne pole = \"\". Nikdy null ani vynechané kľúče.\n" +
        "KĽÚČE SÚ PRESNÉ a nemenné:\n" +
        "  contact → \"type\",\"fields\",\"Meno\",\"Email\",\"Telefón\",\"Firma\",\"Poznámka\"\n" +
        "  task    → \"type\",\"fields\",\"Úloha\",\"Dátum\",\"Čas\",\"Poznámka\"\n" +
        "Nikdy neskracuj (nie 'eno', 'Tel'), nikdy nespoj kľúče ('fieldsÚloha' je ZAKÁZANÉ).\n" +
        "Každý blok otváraj ```action-card na vlastnom riadku a ukonči ``` na vlastnom riadku.\n" +
        "Po poslednom ``` už nič nepíš — žiadne '.', '0', ani medzery.\n\n" +

        "## FORMÁT ACTION CARD BLOKOV\n" +
        "```action-card\n" +
        "{\"type\":\"contact\",\"fields\":{\"Meno\":\"\",\"Email\":\"\",\"Telefón\":\"\",\"Firma\":\"\",\"Poznámka\":\"\"}}\n" +
        "```\n" +
        "```action-card\n" +
        "{\"type\":\"task\",\"fields\":{\"Úloha\":\"\",\"Dátum\":\"\",\"Čas\":\"\",\"Poznámka\":\"\"}}\n" +
        "```",

      dashboard:
        "Si v hlavnom komunikačnom rozhraní. Konáš cez karty — nikdy nenavrhuješ prechod do iného modulu.\n" +
        "DÔLEŽITÉ: dodržuj Pravidlo 1 (confirm-first). Pri prvej zmienke osoby/zámeru NEVYTVÁRAJ karty.\n" +
        "Zhrň zámer jednou vetou a spýtaj sa 'Uložiť do CRM a kalendára?'. Karty generuj AŽ po potvrdení.",

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
