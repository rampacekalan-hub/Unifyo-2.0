// src/app/api/support/[id]/route.ts
// GET ticket + replies. POST = add reply. PATCH = close from user side.
// Owner-only checks throughout. Admin reply path lives separately
// under /api/admin/support/* (TODO).

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.userId },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, status: true },
  });
  if (!ticket) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
  if (ticket.status === "CLOSED") {
    return NextResponse.json({ error: "Ticket je uzavretý" }, { status: 409 });
  }

  let body: { body?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 }); }

  const replyBody = body.body?.trim();
  if (!replyBody) return NextResponse.json({ error: "Prázdna správa" }, { status: 400 });

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      authorId: session.userId,
      isStaff: false,
      body: replyBody.slice(0, 10_000),
    },
  });
  // Bump ticket updatedAt + reopen if was RESOLVED.
  await prisma.supportTicket.update({
    where: { id },
    data: {
      updatedAt: new Date(),
      status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status,
    },
  });
  return NextResponse.json(reply, { status: 201 });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  let body: { status?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 }); }

  // User can only close (or reopen) their own ticket.
  if (body.status !== "CLOSED" && body.status !== "OPEN") {
    return NextResponse.json({ error: "Neplatný stav" }, { status: 400 });
  }

  const owned = await prisma.supportTicket.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: { status: body.status },
  });
  return NextResponse.json(updated);
}
