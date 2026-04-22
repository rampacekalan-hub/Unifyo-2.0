// src/components/ui/Skeleton.tsx
// Drop-in shimmer placeholders. Use wherever we used to show a lone
// `Loader2` spinner while data loads — perceived performance goes up
// because the layout reserves space in the shape of the final content.

import React from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden />;
}

/** A row of skeletons — mirrors list items (e.g. inbox, contacts). */
export function SkeletonRow({ lines = 2 }: { lines?: number }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl"
      style={{
        background: "var(--app-surface-2)",
        border: "1px solid var(--app-border)",
      }}
    >
      <Skeleton className="w-9 h-9 flex-shrink-0" style={{ borderRadius: "var(--r-md)" }} />
      <div className="flex-1 space-y-1.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${90 - i * 20}%` }} />
        ))}
      </div>
    </div>
  );
}

/** A card-sized skeleton — for stat tiles and dashboard panels. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="p-4 rounded-2xl space-y-2"
      style={{
        background: "var(--app-surface-2)",
        border: "1px solid var(--app-border)",
        borderRadius: "var(--r-lg)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="w-7 h-7" style={{ borderRadius: "var(--r-md)" }} />
      </div>
      <Skeleton className="h-6 w-20" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-2.5" style={{ width: `${80 - i * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
          <SkeletonRow />
        </div>
      ))}
    </div>
  );
}
