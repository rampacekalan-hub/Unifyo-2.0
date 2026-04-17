"use client";
// src/lib/aiPrefs.ts
// Client-side AI preferences — stored in localStorage for now.
// When billing/cloud sync lands, migrate to /api/user/me.

export type ResponseStyle = "concise" | "friendly" | "formal";

export interface AiPrefs {
  style: ResponseStyle;
  temperature: number; // 0..1
  memoryEnabled: boolean;
  suggestionsEnabled: boolean;
}

const KEY = "unifyo.ai.prefs.v1";

export const DEFAULT_PREFS: AiPrefs = {
  style: "friendly",
  temperature: 0.6,
  memoryEnabled: true,
  suggestionsEnabled: true,
};

export function loadPrefs(): AiPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<AiPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: AiPrefs): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* quota */ }
}
