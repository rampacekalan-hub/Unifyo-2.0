// src/app/api/dpa/route.ts
// GET: returns active DPA version + the user's signature for it (if any).
// POST: signs the active DPA version. Idempotent — re-signing the same
// version is a no-op (returns existing record).

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { ensureActiveDpa } from "@/lib/dpa";

export const dynamic = "force-dynamic";

// DPA podpis je B2B Compliance feature — dostupné iba pre Pro a Enterprise.
// Basic používatelia dostanú TIER_LOCKED 403 a musia upgradnúť.
const DPA_ALLOWED_TIERS = new Set<string>(["PREMIUM", "ENTERPRISE"]);
function tierLocked() {
  return NextResponse.json(
    {
      error: "Upgrade na Pro pre odomknutie DPA podpisu",
      code: "TIER_LOCKED",
      requiredTier: "PREMIUM",
    },
    { status: 403 },
  );
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!DPA_ALLOWED_TIERS.has(session.membershipTier ?? "BASIC")) return tierLocked();

  const active = await ensureActiveDpa();
  const sig = await prisma.dpaSignature.findUnique({
    where: { userId_versionId: { userId: session.userId, versionId: active.id } },
  });

  return NextResponse.json({
    version: active.version,
    effectiveAt: active.effectiveAt,
    body: active.body,
    signed: !!sig,
    signature: sig
      ? {
          signerName: sig.signerName,
          signerRole: sig.signerRole,
          companyName: sig.companyName,
          ico: sig.ico,
          signedAt: sig.signedAt,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!DPA_ALLOWED_TIERS.has(session.membershipTier ?? "BASIC")) return tierLocked();

  let body: { signerName?: string; signerRole?: string; companyName?: string; ico?: string; agree?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 }); }

  if (!body.agree) {
    return NextResponse.json({ error: "Súhlas musí byť explicitný" }, { status: 400 });
  }
  const signerName = body.signerName?.trim();
  const signerRole = body.signerRole?.trim();
  const companyName = body.companyName?.trim();
  if (!signerName || !signerRole || !companyName) {
    return NextResponse.json({ error: "Vyplň meno, funkciu a firmu" }, { status: 400 });
  }

  const active = await ensureActiveDpa();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  const sig = await prisma.dpaSignature.upsert({
    where: { userId_versionId: { userId: session.userId, versionId: active.id } },
    update: {}, // existing signature is immutable
    create: {
      userId: session.userId,
      versionId: active.id,
      signerName: signerName.slice(0, 200),
      signerRole: signerRole.slice(0, 100),
      companyName: companyName.slice(0, 200),
      ico: body.ico?.trim().slice(0, 30) || null,
      ipAddress: ip,
      userAgent: ua,
    },
  });

  return NextResponse.json({
    ok: true,
    version: active.version,
    signedAt: sig.signedAt,
  });
}
