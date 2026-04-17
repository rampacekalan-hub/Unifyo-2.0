"use client";
// src/components/ui/EmptyIllustration.tsx
// Animated SVG illustrations for empty states. Pure inline SVG — no image
// assets, no extra requests. Reusable via `variant` prop.

import { motion } from "framer-motion";

type Variant = "contacts" | "calendar" | "email" | "search";

const GRAD = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  muted: "rgba(99,102,241,0.25)",
};

interface Props {
  variant: Variant;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  size?: number;
}

export default function EmptyIllustration({ variant, title, hint, action, size = 120 }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{ width: size, height: size }}
        className="mb-4 relative"
      >
        {variant === "contacts" && <ContactsIllustration />}
        {variant === "calendar" && <CalendarIllustration />}
        {variant === "email" && <EmailIllustration />}
        {variant === "search" && <SearchIllustration />}
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="text-sm font-semibold mb-1"
        style={{ color: "#eef2ff" }}
      >
        {title}
      </motion.h3>
      {hint && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
          className="text-xs max-w-sm leading-relaxed"
          style={{ color: "#94a3b8" }}
        >
          {hint}
        </motion.p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="mt-4"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}

// ── Contacts: three overlapping cards ──────────────────────────
function ContactsIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <defs>
        <linearGradient id="ci-g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={GRAD.indigo} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GRAD.violet} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {/* Background glow */}
      <motion.circle
        cx="60" cy="60" r="48"
        fill={GRAD.indigo} opacity="0.08"
        animate={{ scale: [1, 1.06, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Back card */}
      <motion.g
        animate={{ rotate: [-8, -6, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <rect x="20" y="34" width="52" height="58" rx="8"
          fill="url(#ci-g1)" stroke={GRAD.indigo} strokeOpacity="0.35" />
        <circle cx="46" cy="52" r="8" fill={GRAD.indigo} opacity="0.5" />
        <rect x="32" y="66" width="28" height="3" rx="1.5" fill={GRAD.indigo} opacity="0.4" />
        <rect x="32" y="74" width="20" height="3" rx="1.5" fill={GRAD.indigo} opacity="0.25" />
      </motion.g>
      {/* Front card */}
      <motion.g
        animate={{ rotate: [6, 8, 6], y: [0, -2, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <rect x="48" y="28" width="52" height="58" rx="8"
          fill="url(#ci-g1)" stroke={GRAD.violet} strokeOpacity="0.45" />
        <circle cx="74" cy="46" r="8" fill={GRAD.violet} opacity="0.7" />
        <rect x="60" y="60" width="28" height="3" rx="1.5" fill={GRAD.violet} opacity="0.6" />
        <rect x="60" y="68" width="20" height="3" rx="1.5" fill={GRAD.violet} opacity="0.35" />
      </motion.g>
    </svg>
  );
}

// ── Calendar: sheet with pulsing day ───────────────────────────
function CalendarIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <motion.circle
        cx="60" cy="60" r="48"
        fill={GRAD.indigo} opacity="0.08"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <rect x="24" y="24" width="72" height="72" rx="10"
        fill={GRAD.indigo} fillOpacity="0.1"
        stroke={GRAD.indigo} strokeOpacity="0.4" />
      {/* Rings */}
      <rect x="40" y="18" width="4" height="14" rx="2" fill={GRAD.violet} />
      <rect x="76" y="18" width="4" height="14" rx="2" fill={GRAD.violet} />
      {/* Header bar */}
      <rect x="24" y="36" width="72" height="10" fill={GRAD.indigo} opacity="0.22" />
      {/* Day grid */}
      {[0, 1, 2, 3, 4].map((r) =>
        [0, 1, 2, 3, 4, 5].map((c) => (
          <circle
            key={`${r}-${c}`}
            cx={34 + c * 10} cy={56 + r * 8} r="2"
            fill={GRAD.indigo} opacity={r === 2 && c === 3 ? 1 : 0.35}
          />
        )),
      )}
      {/* Pulsing highlighted day */}
      <motion.circle
        cx="64" cy="72" r="4"
        fill={GRAD.violet}
        animate={{ opacity: [0.5, 1, 0.5], r: [4, 5, 4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

// ── Email: envelope with floating sparkle ──────────────────────
function EmailIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <motion.circle cx="60" cy="60" r="48" fill={GRAD.indigo} opacity="0.08"
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      <rect x="22" y="38" width="76" height="50" rx="7"
        fill={GRAD.indigo} fillOpacity="0.12" stroke={GRAD.indigo} strokeOpacity="0.4" />
      <path d="M22 42 L60 68 L98 42" stroke={GRAD.violet} strokeOpacity="0.7" strokeWidth="2" fill="none" />
      <motion.circle
        cx="90" cy="32" r="4" fill={GRAD.sky}
        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

// ── Search: magnifier with no results ──────────────────────────
function SearchIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden>
      <motion.circle cx="60" cy="60" r="48" fill={GRAD.indigo} opacity="0.08"
        animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} />
      <motion.g
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 60px" }}
      >
        <circle cx="52" cy="52" r="20" fill={GRAD.indigo} fillOpacity="0.1"
          stroke={GRAD.indigo} strokeOpacity="0.55" strokeWidth="3" />
        <line x1="68" y1="68" x2="86" y2="86"
          stroke={GRAD.violet} strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
      </motion.g>
      <line x1="44" y1="52" x2="60" y2="52" stroke={GRAD.muted} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
