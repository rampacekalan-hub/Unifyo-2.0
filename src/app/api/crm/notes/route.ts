import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { contactId, content } = await req.json();
    // Verify ownership
    const contact = await prisma.crmContact.findFirst({ where: { id: contactId, userId: session.userId } });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const note = await prisma.crmNote.create({ data: { contactId, content } });
    return NextResponse.json(note);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id, contactId } = await req.json();
    const contact = await prisma.crmContact.findFirst({ where: { id: contactId, userId: session.userId } });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.crmNote.deleteMany({ where: { id, contactId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}
