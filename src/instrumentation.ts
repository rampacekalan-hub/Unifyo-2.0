// src/instrumentation.ts
// Next 16 instrumentation hook — `onRequestError` sa volá vždy, keď server
// zachytí unhandled chybu (route handler, server component, server action).
// Zapíšeme ju do nášho ErrorLog cez rovnakú logiku ako klient-side errors.
//
// Toto uzatvára diery ktorú mal predchádzajúci stav: /admin/errors videl
// IBA chyby z prehliadača. Teraz uvidíme aj server crashes, Prisma výnimky,
// OpenAI timeouty atď.

import type { Instrumentation } from "next";

// Keďže sa tento modul načíta VEĽMI skoro (pred DB clientom), lazy-importujeme
// logError aby prípadná chyba v schéme nezablokovala štart servera.
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  try {
    const { logError } = await import("@/lib/error-log");
    const e = err as Error & { digest?: string };

    // Next 16 passes request metadata: { path, method, headers }.
    // context: { routerKind: "Pages Router" | "App Router", routePath, routeType, ... }
    const url = typeof request === "object" && request !== null && "path" in request
      ? String((request as { path: unknown }).path)
      : null;

    // Source classification — edge runtime má iný context.
    const routeType =
      typeof context === "object" && context !== null && "routeType" in context
        ? String((context as { routeType: unknown }).routeType)
        : null;
    const source =
      routeType === "middleware" || routeType === "proxy" ? "edge" : "server";

    await logError({
      source,
      name: e?.name ?? "Error",
      message: e?.message ?? String(err),
      stack: e?.stack ?? null,
      digest: e?.digest ?? null,
      url,
      meta: {
        routeType,
        routerKind:
          typeof context === "object" && context !== null && "routerKind" in context
            ? (context as { routerKind: unknown }).routerKind
            : undefined,
      },
    });
  } catch (inner) {
    // Nikdy necháj error v reporter-i zhodiť ďalší request.
    console.error("[instrumentation.onRequestError] failed to log:", inner);
  }
};
