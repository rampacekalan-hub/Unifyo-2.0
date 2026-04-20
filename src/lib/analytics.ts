// src/lib/analytics.ts
// Client-side event tracker. Fire-and-forget so it nikdy nezdrží UX, nikdy
// nezhodí call-site aj keď server odpovie 500.
//
// Používaj ako:
//   import { track } from "@/lib/analytics";
//   track("contact_created");
//   track("page_viewed", { path: "/dashboard" });
//
// `keepalive: true` dovolí dokončiť request aj keď navigácia zavrie stránku
// (napr. odchádzame zo signup flow → login redirect).

export type AnalyticsProps = Record<string, unknown>;

export function track(name: string, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, props }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      /* silently swallow — analytics never breaks UX */
    });
  } catch {
    /* very defensive — JSON.stringify with exotic props etc. */
  }
}
