// src/lib/userPrefs.ts
// Shape + defaults for `User.preferences` JSON. Kept loose on purpose so
// we can evolve without migrations. All fields optional — reader merges
// with DEFAULT_USER_PREFS. Server helpers here are import-safe from both
// Server Components and Route Handlers.

export type AppId =
  | "dashboard"
  | "email"
  | "calendar"
  | "crm"
  | "pipeline"
  | "calls"
  | "automation";

export type ThemeMode = "dark" | "light" | "auto";
export type Density = "comfortable" | "compact";

export interface UserPrefs {
  theme: ThemeMode;
  density: Density;
  timezone: string; // IANA, e.g. "Europe/Bratislava"
  enabledApps: AppId[];
  notifications: {
    emailDigest: boolean;
    productUpdates: boolean;
  };
  // Marketing-y stuff the user filled out in wizard step 1.
  goals?: string[]; // e.g. ["save-time","close-deals"]
}

export const DEFAULT_USER_PREFS: UserPrefs = {
  theme: "dark",
  density: "comfortable",
  timezone: "Europe/Bratislava",
  enabledApps: [
    "dashboard",
    "email",
    "calendar",
    "crm",
    "pipeline",
    "calls",
    "automation",
  ],
  notifications: {
    emailDigest: true,
    productUpdates: true,
  },
};

export function mergePrefs(raw: unknown): UserPrefs {
  if (!raw || typeof raw !== "object") return DEFAULT_USER_PREFS;
  const r = raw as Partial<UserPrefs>;
  return {
    theme: r.theme ?? DEFAULT_USER_PREFS.theme,
    density: r.density ?? DEFAULT_USER_PREFS.density,
    timezone: r.timezone ?? DEFAULT_USER_PREFS.timezone,
    enabledApps: Array.isArray(r.enabledApps) ? r.enabledApps : DEFAULT_USER_PREFS.enabledApps,
    notifications: {
      emailDigest:
        r.notifications?.emailDigest ?? DEFAULT_USER_PREFS.notifications.emailDigest,
      productUpdates:
        r.notifications?.productUpdates ?? DEFAULT_USER_PREFS.notifications.productUpdates,
    },
    goals: Array.isArray(r.goals) ? r.goals : undefined,
  };
}

export const INDUSTRIES: Array<{ id: string; label: string }> = [
  { id: "freelance", label: "Freelancer / SZČO" },
  { id: "agency", label: "Agentúra / Služby" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "saas", label: "SaaS / IT" },
  { id: "retail", label: "Retail / Obchod" },
  { id: "hospitality", label: "Gastronómia / Hotelierstvo" },
  { id: "realestate", label: "Reality" },
  { id: "other", label: "Iné" },
];

export const GOALS: Array<{ id: string; label: string }> = [
  { id: "save-time", label: "Ušetriť čas na admin" },
  { id: "close-deals", label: "Uzavrieť viac obchodov" },
  { id: "stay-organized", label: "Mať prehľad o klientoch" },
  { id: "automate", label: "Automatizovať rutinu" },
  { id: "team-sync", label: "Zladiť tím" },
];
