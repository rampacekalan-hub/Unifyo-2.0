// src/app/api/crm/deals/route.ts
// Pipeline CRUD. GET returns the whole board grouped by stage so the
// client can render columns without N+1 fetches. POST creates a deal
// at the top of its stage column (position = 0, everything else shifts).

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireSameOrigin } from "@/lib/csrf";
import type { DealStage } from "@prisma/client";

const STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
type Stage = (typeof STAGES)[number];

function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const deals = await prisma.crmDeal.findMany({
      where: { userId: session.userId },
      orderBy: [{ stage: "asc" }, { position: "asc" }, { createdAt: "desc" }],
      include: {
        contact: { select: { id: true, name: true, company: true } },
      },
    });
    return NextResponse.json(deals);
  } catch (e) {
    console.error("[deals:GET]", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const {
    title,
    stage,
    contactId,
    expectedValue,
    expectedCloseAt,
    note,
  } = (body ?? {}) as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Názov dealu je povinný" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "Názov je príliš dlhý" }, { status: 400 });
  }

  const finalStage: Stage = isStage(stage) ? stage : "LEAD";

  // If a contact is attached it must belong to this user — otherwise
  // someone could attach a deal to a stranger's contact.
  let finalContactId: string | null = null;
  if (typeof contactId === "string" && contactId) {
    const owned = await prisma.crmContact.findFirst({
      where: { id: contactId, userId: session.userId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Kontakt nepatrí tomuto účtu" }, { status: 400 });
    }
    finalContactId = owned.id;
  }

  const valueCents =
    typeof expectedValue === "number" && Number.isFinite(expectedValue) && expectedValue >= 0
      ? Math.round(expectedValue)
      : null;

  const closeAt =
    typeof expectedCloseAt === "string" && expectedCloseAt
      ? new Date(expectedCloseAt)
      : null;

  try {
    // Push every existing deal in this stage down by one so new deal lands at top.
    // Done in a transaction so concurrent creates don't both grab position=0.
    const deal = await prisma.$transaction(async (tx) => {
      await tx.crmDeal.updateMany({
        where: { userId: session.userId, stage: finalStage as DealStage },
        data: { position: { increment: 1 } },
      });
      return tx.crmDeal.create({
        data: {
          userId: session.userId,
          title: title.trim(),
          stage: finalStage as DealStage,
          position: 0,
          contactId: finalContactId,
          expectedValue: valueCents,
          expectedCloseAt: closeAt && !Number.isNaN(closeAt.getTime()) ? closeAt : null,
          note: typeof note === "string" && note.trim() ? note.trim().slice(0, 2000) : null,
          closedAt: finalStage === "WON" || finalStage === "LOST" ? new Date() : null,
        },
        include: { contact: { select: { id: true, name: true, company: true } } },
      });
    });
    return NextResponse.json(deal);
  } catch (e) {
    console.error("[deals:POST]", e);
    return NextResponse.json({ error: "Uloženie zlyhalo" }, { status: 500 });
  }
}
