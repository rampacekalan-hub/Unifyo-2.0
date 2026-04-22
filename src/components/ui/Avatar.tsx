"use client";
// src/components/ui/Avatar.tsx
// Shared avatar — prefers uploaded image from localStorage; falls back to
// initials-on-gradient when none is set. Auto-updates across mount points
// via subscribeAvatar.

import { useSyncExternalStore } from "react";
import { getAvatar, subscribeAvatar } from "@/lib/avatar";

interface Props {
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

export function useAvatar(): string | null {
  return useSyncExternalStore(
    subscribeAvatar,
    () => getAvatar(),
    () => null,
  );
}

// Deterministic-pastel gradient from the identity seed. Same person
// gets the same avatar every time; different people get visually
// distinct colours. 12 curated pairs so we never land on muddy tones.
const GRADIENT_PAIRS: Array<[string, string]> = [
  ["#8b5cf6", "#0ea5e9"], // violet → sky
  ["#8b5cf6", "#f43f5e"], // violet → rose
  ["#0ea5e9", "#10b981"], // sky → emerald
  ["#f59e0b", "#f43f5e"], // amber → rose
  ["#6366f1", "#22d3ee"], // indigo → cyan
  ["#10b981", "#0ea5e9"], // emerald → sky
  ["#a855f7", "#ec4899"], // purple → pink
  ["#ef4444", "#f59e0b"], // red → amber
  ["#14b8a6", "#3b82f6"], // teal → blue
  ["#d946ef", "#6366f1"], // fuchsia → indigo
  ["#f97316", "#ef4444"], // orange → red
  ["#3b82f6", "#8b5cf6"], // blue → violet
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function gradientFor(seed: string): string {
  const [a, b] = GRADIENT_PAIRS[hashSeed(seed) % GRADIENT_PAIRS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export default function Avatar({ name, email, size = 32, className = "" }: Props) {
  const src = useAvatar();
  const displayName = name ?? email ?? "U";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Use the most stable bit of identity (email > name) as the seed so
  // the colour is tied to the user, not to a rename.
  const seed = email ?? name ?? "default";
  const gradient = gradientFor(seed);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(10, size / 2.6),
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? email ?? "Avatar"}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ ...style, border: "1px solid rgba(139,92,246,0.3)" }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{
        ...style,
        background: gradient,
        color: "white",
        // Pull one of the gradient colours for the glow so it looks
        // like the avatar itself is radiating light.
        boxShadow: `0 0 12px color-mix(in oklab, ${gradient.match(/#[0-9a-f]{6}/i)?.[0] ?? "#8b5cf6"} 45%, transparent)`,
        letterSpacing: "-0.02em",
      }}
    >
      {initials || "?"}
    </div>
  );
}
