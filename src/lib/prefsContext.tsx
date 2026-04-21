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
          // 401 means anonymous — keep defaults, don't spam the console.
          return;
        }
        const data = await res.json();
        const u = data?.user;
        if (!u) return;
        setMe({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          membershipTier: u.membershipTier ?? null,
          onboardingCompletedAt: u.onboardingCompletedAt ?? null,
        });
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

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo<PrefsCtx>(
    () => ({ prefs, me, loading, refresh: load }),
    [prefs, me, loading, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
