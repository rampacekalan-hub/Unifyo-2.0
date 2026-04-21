"use client";
// src/lib/prefsContext.tsx
// React context for the current user's preferences + profile snapshot.
// One roundtrip to /api/user/me per app load, shared by everything
// downstream (Sidebar, Dashboard, Settings, …). Falls back to
// DEFAULT_USER_PREFS when anonymous or on fetch failure so consumers
// never need to null-check.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { DEFAULT_USER_PREFS, mergePrefs, type UserPrefs } from "@/lib/userPrefs";
import { primeAvatar } from "@/lib/avatar";

interface MeSnapshot {
  id: string;
  email: string;
  name: string | null;
  role: string;
  membershipTier: string | null;
  onboardingCompletedAt: string | null;
}

interface PrefsCtx {
  prefs: UserPrefs;
  me: MeSnapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PrefsCtx>({
  prefs: DEFAULT_USER_PREFS,
  me: null,
  loading: true,
  refresh: async () => {},
});

export function usePrefs(): PrefsCtx {
  return useContext(Ctx);
}

export default function UserPrefsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_USER_PREFS);
  const [me, setMe] = useState<MeSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  const load = useMemo(
    () => async () => {
      try {
        const res = await fetch("/api/user/me", { cache: "no-store" });
        if (!res.ok) {
          // 401 means anonymous — log out scenario. Wipe any leftover
          // client-side caches from the previous user. Without this a
          // shared browser shows the old avatar / draft / prefs to the
          // next login (actual data stays isolated on the server, but
          // the UX looks like a leak — same thing from user's view).
          try {
            const last = localStorage.getItem("unifyo.session.userId");
            if (last) {
              wipeUserScopedStorage();
              primeAvatar(null);
            }
          } catch {}
          return;
        }
        const data = await res.json();
        const u = data?.user;
        if (!u) return;

        // User-switch detection: if the cached userId no longer matches,
        // wipe before we render anything from the new account. This is
        // the primary guard against the "new account sees old photo"
        // class of bug.
        try {
          const prevId = localStorage.getItem("unifyo.session.userId");
          if (prevId && prevId !== u.id) {
            wipeUserScopedStorage();
            primeAvatar(null); // clear old user's cached avatar before new data lands
          }
          localStorage.setItem("unifyo.session.userId", u.id);
        } catch {
          // localStorage blocked — no caches to wipe anyway.
        }

        setMe({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          membershipTier: u.membershipTier ?? null,
          onboardingCompletedAt: u.onboardingCompletedAt ?? null,
        });
        // Server-authoritative avatar — prime the shared store so
        // every Avatar component across the app updates in one tick.
        primeAvatar(u.avatarDataUrl ?? null);
        const merged = mergePrefs(u.preferences);
        setPrefs(merged);

        // Sync next-themes. "auto" maps to system so the ThemeProvider
        // (enableSystem) follows the OS preference.
        if (merged.theme === "auto") setTheme("system");
        else setTheme(merged.theme);
      } catch {
        // Offline / network — defaults are fine.
      } finally {
        setLoading(false);
      }
    },
    [setTheme],
  );

  function wipeUserScopedStorage() {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        // Remove every Unifyo-scoped key and legacy user-bound keys.
        // Keep only genuinely device-scoped prefs (cookie consent,
        // onboarding tour dismissal — those are UX polish, not PII).
        if (
          k.startsWith("unifyo.") &&
          k !== "unifyo.cookie-consent.v1" &&
          k !== "unifyo.onboarding.v1" && // first-run tour, device-scoped
          k !== "unifyo.session.userId"   // we'll overwrite this ourselves
        ) {
          keys.push(k);
        }
        if (k.startsWith("waitlist:")) keys.push(k);
        if (k === "onboarding_dismissed") keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Nothing we can do if storage is unavailable.
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<PrefsCtx>(
    () => ({ prefs, me, loading, refresh: load }),
    [prefs, me, loading, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
