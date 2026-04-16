import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  try {
    const conv = await prisma.conversation.findFirst({ where: { id, userId: session.userId } });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const msgs = await prisma.conversationMsg.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(msgs);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  try {
    const conv = await prisma.conversation.findFirst({ where: { id, userId: session.userId } });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { role, content, tokens } = await req.json();
    const msg = await prisma.conversationMsg.create({
      data: { conversationId: id, role, content, tokens: tokens ?? 0 },
    });
    // Update conversation updatedAt
    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
    return NextResponse.json(msg);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}
