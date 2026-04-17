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
        style={{ ...style, border: "1px solid rgba(99,102,241,0.35)" }}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{
        ...style,
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
        color: "white",
        boxShadow: "0 0 12px rgba(99,102,241,0.35)",
      }}
    >
      {initials || "?"}
    </div>
  );
}
