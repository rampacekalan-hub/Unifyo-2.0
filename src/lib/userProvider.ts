// src/lib/userProvider.ts
// Resolves WHICH integration serves Mail vs Calendar for a given user.
//
// The user can pin a preference (User.emailProvider / calendarProvider).
// If pinned, we honor it as long as that provider is still connected.
// Otherwise we auto-pick the first connected provider in a stable order
// (google → microsoft → apple) so a single-provider user "just works"
// without ever touching settings.
//
// Returning null means "no provider available" — the unified route
// should then 409 and the UI shows the connect banner.

import { prisma } from "@/lib/prisma";

export type Provider = "google" | "microsoft" | "apple";
export type Surface = "email" | "calendar";

/** Fetch which provider should serve the given surface for this user. */
export async function resolveProvider(
  userId: string,
  surface: Surface,
): Promise<Provider | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailProvider: true,
      calendarProvider: true,
      googleIntegration: { select: { id: true } },
      microsoftIntegration: { select: { id: true } },
      appleIntegration: { select: { id: true } },
    },
  });
  if (!user) return null;

  const connected: Record<Provider, boolean> = {
    google: !!user.googleIntegration,
    microsoft: !!user.microsoftIntegration,
    apple: !!user.appleIntegration,
  };

  const pinned = (surface === "email" ? user.emailProvider : user.calendarProvider) as
    | Provider
    | null;
  if (pinned && connected[pinned]) return pinned;

  // Auto-pick: stable preference order. Apple is intentionally last
  // because its CalDAV/IMAP path is heavier than the OAuth providers.
  if (connected.google) return "google";
  if (connected.microsoft) return "microsoft";
  if (connected.apple) return "apple";
  return null;
}

/** Update a user's provider preference. Pass null to clear. */
export async function setProviderPreference(
  userId: string,
  surface: Surface,
  provider: Provider | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:
      surface === "email"
        ? { emailProvider: provider }
        : { calendarProvider: provider },
  });
}
