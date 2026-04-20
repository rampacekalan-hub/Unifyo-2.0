"use client";
// src/components/analytics/PageViewTracker.tsx
// Emits a `page_viewed` event on every client-side route change.
// Mounted once in the root layout; no DOM output.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    track("page_viewed", { path: pathname });
  }, [pathname]);

  return null;
}
