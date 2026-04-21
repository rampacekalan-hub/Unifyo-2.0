// src/app/onboarding/page.tsx
// First-run wizard host — server shell that gates on completion and
// hands initial data off to the client. We also accept `?step=3` so the
// Google OAuth round-trip can bring the user straight back to the
// "Connect Google" step without re-asking profile info.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vitaj v Unifyo" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; google?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      email: true,
      company: true,
      industry: true,
      onboardingCompletedAt: true,
      googleIntegration: { select: { googleEmail: true } },
    },
  });

  if (!user) redirect("/login");

  // Already onboarded — bounce to dashboard. Users can still edit all
  // these fields later from /settings, so there's no "re-run wizard"
  // path here intentionally.
  if (user.onboardingCompletedAt) {
    redirect("/dashboard-overview");
  }

  const sp = await searchParams;
  const startStep = (() => {
    const n = Number(sp.step);
    return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 1;
  })();

  return (
    <OnboardingWizard
      initialStep={startStep}
      defaultName={user.name ?? ""}
      email={user.email}
      defaultCompany={user.company ?? ""}
      defaultIndustry={user.industry ?? ""}
      googleConnected={!!user.googleIntegration}
      googleEmail={user.googleIntegration?.googleEmail ?? null}
      justConnectedGoogle={sp.google === "connected"}
    />
  );
}
