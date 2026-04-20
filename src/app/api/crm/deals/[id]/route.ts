// src/app/api/crm/deals/[id]/route.ts
// PATCH: mutate a single deal (title, stage, position, contact, value,
// note, closeAt). Moving to WON/LOST auto-stamps `closedAt`. Any write
// bumps `lastActivityAt` so the AI next-step heuristic sees fresh data.
// DELETE: remove a single deal.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/csrf";
import type { DealStage, Prisma } from "@prisma/client";

const STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
type Stage = (typeof STAGES)[number];

function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }

  // Confirm ownership before anything else — otherwise a user could
  // mutate someone else's deal by guessing an id.
  const existing = await prisma.crmDeal.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, stage: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Deal neexistuje" }, { status: 404 });
  }

  const data: Prisma.CrmDealUpdateInput = { lastActivityAt: new Date() };

  if (typeof body.title === "string" && body.title.trim()) {
    data.title = body.title.trim().slice(0, 200);
  }
  if (typeof body.note === "string") {
    data.note = body.note.trim().slice(0, 2000) || null;
  }
  if (isStage(body.stage)) {
    data.stage = body.stage as DealStage;
    const isClosed = body.stage === "WON" || body.stage === "LOST";
    data.closedAt = isClosed ? new Date() : null;
  }
  if (typeof body.position === "number" && Number.isFinite(body.position)) {
    data.position = Math.max(0, Math.round(body.position));
  }
  if (body.expectedValue === null) {
    data.expectedValue = null;
  } else if (
    typeof body.expectedValue === "number" &&
    Number.isFinite(body.expectedValue) &&
    body.expectedValue >= 0
  ) {
    data.expectedValue = Math.round(body.expectedValue);
  }
  if (body.expectedCloseAt === null) {
    data.expectedCloseAt = null;
  } else if (typeof body.expectedCloseAt === "string" && body.expectedCloseAt) {
    const d = new Date(body.expectedCloseAt);
    if (!Number.isNaN(d.getTime())) data.expectedCloseAt = d;
  }
  if (body.contactId === null) {
    data.contact = { disconnect: true };
  } else if (typeof body.contactId === "string" && body.contactId) {
    const owned = await prisma.crmContact.findFirst({
      where: { id: body.contactId, userId: session.userId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Kontakt nepatrí tomuto účtu" }, { status: 400 });
    }
    data.contact = { connect: { id: owned.id } };
  }

  try {
    const updated = await prisma.crmDeal.update({
      where: { id },
      data,
      include: { contact: { select: { id: true, name: true, company: true } } },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[deals:PATCH]", e);
    return NextResponse.json({ error: "Uloženie zlyhalo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const result = await prisma.crmDeal.deleteMany({
      where: { id, userId: session.userId },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "Deal neexistuje" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[deals:DELETE]", e);
    return NextResponse.json({ error: "Mazanie zlyhalo" }, { status: 500 });
  }
}
