// src/app/api/invoices/[id]/route.ts
// GET single invoice (used by HTML render). PATCH to mark PAID/
// CANCELLED/ISSUED. DELETE only allowed for DRAFT — once a number is
// issued it must remain in the audit trail.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUS = new Set(["DRAFT", "ISSUED", "PAID", "CANCELLED"]);

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;
  const inv = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
  });
  if (!inv) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
  return NextResponse.json(inv);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  const inv = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!inv) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });

  let body: { status?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 }); }

  if (!body.status || !VALID_STATUS.has(body.status)) {
    return NextResponse.json({ error: "Neplatný stav" }, { status: 400 });
  }
  const updated = await prisma.invoice.update({
    where: { id },
    data: { status: body.status },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  const inv = await prisma.invoice.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, status: true },
  });
  if (!inv) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
  if (inv.status !== "DRAFT") {
    return NextResponse.json({ error: "Iba koncepty môžu byť zmazané" }, { status: 409 });
  }
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
