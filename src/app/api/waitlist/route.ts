// src/app/api/waitlist/route.ts
// POST { feature, email } — pridá užívateľa na waitlist pre daný modul.
// Idempotentné (unique index (feature,email)), takže opakovaný click
// nerobí duplicity. Auth je optional; ak je session, prepojí sa userId.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";
import { getSession } from "@/lib/auth";

const FEATURES = ["email", "calls", "analytics", "automation"] as const;

const schema = z.object({
  feature: z.enum(FEATURES),
  email: z.string().email().max(254),
});

const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limited = await rateLimit(req, security.rateLimit.auth, "waitlist");
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Neplatný vstup." }, { status: 400 });
    }

    const session = await getSession();
    const email = parsed.data.email.toLowerCase().trim();

    await prisma.waitlistSignup.upsert({
      where: {
        feature_email: { feature: parsed.data.feature, email },
      },
      update: {
        // Refresh link to user if they later signed in
        userId: session?.userId ?? undefined,
      },
      create: {
        feature: parsed.data.feature,
        email,
        userId: session?.userId ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[waitlist]", e);
    return NextResponse.json({ error: "Nepodarilo sa." }, { status: 500 });
  }
}
