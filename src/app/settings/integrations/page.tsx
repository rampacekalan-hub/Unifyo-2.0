// src/app/settings/integrations/page.tsx
// Integrations hub — Server Component wrapper. Loads current Google
// integration status from DB and hands off to client for the interactive
// pieces (connect button, disconnect confirm, error toast).

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getGoogleIntegrationStatus } from "@/lib/google";
import IntegrationsClient from "./IntegrationsClient";

export const metadata = {
  title: "Integrácie — Unifyo",
};

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/settings/integrations");

  const google = await getGoogleIntegrationStatus(session.userId);
  return <IntegrationsClient google={google} />;
}
