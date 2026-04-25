import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const contacts = await prisma.crmContact.findMany({
      where: {
        userId: session.userId,
        ...(q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ]} : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: { notes: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    return NextResponse.json(contacts);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { name, company, email, phone, note } = await req.json();
    if (!name) return NextResponse.json({ error: "Meno je povinné" }, { status: 400 });

    // ── DEDUPE ─────────────────────────────────────────────────────
    // The AI assistant routinely re-creates the same person every turn
    // because it can't read its own past output. Match by name
    // (case-insensitive) for the same user and merge instead of
    // duplicating. Empty incoming fields never overwrite stored ones —
    // that prevents the wizard from blanking a real email when the LLM
    // streams a follow-up card without it.
    const existing = await prisma.crmContact.findFirst({
      where: {
        userId: session.userId,
        name: { equals: String(name).trim(), mode: "insensitive" },
      },
      include: { notes: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    const trim = (s: unknown) => (typeof s === "string" ? s.trim() : "");
    const incomingNote = trim(note);

    if (existing) {
      // Merge: only fill fields that are currently empty.
      const patch: { company?: string; email?: string; phone?: string } = {};
      if (!existing.company && trim(company)) patch.company = trim(company);
      if (!existing.email && trim(email))     patch.email   = trim(email);
      if (!existing.phone && trim(phone))     patch.phone   = trim(phone);

      const lastNoteContent = existing.notes[0]?.content?.trim() ?? "";
      const shouldAppendNote =
        incomingNote.length > 0 && incomingNote !== lastNoteContent;

      const updated = await prisma.crmContact.update({
        where: { id: existing.id },
        data: {
          ...patch,
          ...(shouldAppendNote
            ? { notes: { create: { content: incomingNote } } }
            : {}),
        },
        include: { notes: { orderBy: { createdAt: "desc" }, take: 5 } },
      });
      return NextResponse.json({ ...updated, _merged: true });
    }

    // No existing match → create + optional first note.
    const contact = await prisma.crmContact.create({
      data: {
        userId: session.userId,
        name: trim(name),
        company: trim(company) || null,
        email: trim(email) || null,
        phone: trim(phone) || null,
        ...(incomingNote ? { notes: { create: { content: incomingNote } } } : {}),
      },
      include: { notes: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    return NextResponse.json(contact);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id, name, company, email, phone } = await req.json();
    await prisma.crmContact.updateMany({
      where: { id, userId: session.userId },
      data: { name, company, email, phone },
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const body = await req.json();
    // Accept either { id } or { ids: [] } for bulk deletes.
    const idList: string[] = Array.isArray(body.ids)
      ? body.ids.filter((x: unknown) => typeof x === "string")
      : typeof body.id === "string" ? [body.id] : [];
    if (idList.length === 0) {
      return NextResponse.json({ error: "Missing id(s)" }, { status: 400 });
    }
    const result = await prisma.crmContact.deleteMany({
      where: { id: { in: idList }, userId: session.userId },
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}
