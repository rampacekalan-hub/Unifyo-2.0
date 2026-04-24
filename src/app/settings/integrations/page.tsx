// src/app/settings/integrations/page.tsx
// Integrations hub — Server Component wrapper. Loads current status for
// every connected provider (Google, Microsoft, Apple iCloud) and hands
// the data off to the client for the interactive pieces (connect
// button, disconnect confirm, error toast, Apple credentials form).

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getGoogleIntegrationStatus } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import IntegrationsClient from "./IntegrationsClient";

export const metadata = {
  title: "Integrácie — Unifyo",
};

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings/integrations");

  const [google, msRow, appleRow] = await Promise.all([
    getGoogleIntegrationStatus(session.userId),
    prisma.microsoftIntegration.findUnique({
      where: { userId: session.userId },
      select: { microsoftEmail: true, scopes: true, connectedAt: true },
    }),
    prisma.appleIntegration.findUnique({
      where: { userId: session.userId },
      select: { appleId: true, connectedAt: true },
    }),
  ]);

  const microsoft = msRow
    ? {
        connected: true as const,
        email: msRow.microsoftEmail,
        scopes: msRow.scopes.split(/\s+/).filter(Boolean),
        connectedAt: msRow.connectedAt,
      }
    : { connected: false as const };

  const apple = appleRow
    ? {
        connected: true as const,
        email: appleRow.appleId,
        connectedAt: appleRow.connectedAt,
      }
    : { connected: false as const };

  return <IntegrationsClient google={google} microsoft={microsoft} apple={apple} />;
}
