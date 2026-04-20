// src/app/api/share/route.ts
// POST — create (or reuse) a share link for a task/contact owned by the user.
// GET  — list the user's share links, with resource label joined.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateShareToken,
  isShareResourceType,
  shareLinkState,
  shareUrl,
} from "@/lib/share";

// ── POST ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const body = await req.json();
    const { resourceType, resourceId, ttlDays } = body ?? {};
    if (!isShareResourceType(resourceType) || typeof resourceId !== "string" || !resourceId) {
      return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
    }

    // Ownership check.
    if (resourceType === "task") {
      const t = await prisma.calendarTask.findFirst({
        where: { id: resourceId, userId: session.userId },
        select: { id: true },
      });
      if (!t) return NextResponse.json({ error: "Úloha sa nenašla" }, { status: 404 });
    } else {
      const c = await prisma.crmContact.findFirst({
        where: { id: resourceId, userId: session.userId },
        select: { id: true },
      });
      if (!c) return NextResponse.json({ error: "Kontakt sa nenašiel" }, { status: 404 });
    }

    // TTL — accept number | null | undefined. 0 / null = no expiry.
    let expiresAt: Date | null = null;
    if (typeof ttlDays === "number" && ttlDays > 0 && ttlDays <= 3650) {
      // Allow fractional (e.g. 1 for 24h). 14 is default from UI.
      expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    }

    // Reuse existing active link when present.
    const existing = await prisma.shareLink.findFirst({
      where: {
        userId: session.userId,
        resourceType,
        resourceId,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      return NextResponse.json({
        token: existing.token,
        url: shareUrl(existing.token),
        expiresAt: existing.expiresAt ? existing.expiresAt.toISOString() : null,
        reused: true,
      });
    }

    // Generate a unique token. Collision on 22-char base64url is ~0,
    // but retry once on Prisma unique-violation to be safe.
    let token = generateShareToken();
    let created;
    try {
      created = await prisma.shareLink.create({
        data: {
          token,
          userId: session.userId,
          resourceType,
          resourceId,
          expiresAt,
        },
      });
    } catch {
      token = generateShareToken();
      created = await prisma.shareLink.create({
        data: {
          token,
          userId: session.userId,
          resourceType,
          resourceId,
          expiresAt,
        },
      });
    }

    return NextResponse.json({
      token: created.token,
      url: shareUrl(created.token),
      expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
      reused: false,
    });
  } catch (e) {
    console.error("[share:POST]", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

// ── GET ─────────────────────────────────────────────────────────
// List the user's share links (all states). We join the current
// resource label so the UI can show "Peter Novák (kontakt)" etc.
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const links = await prisma.shareLink.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Resolve resource labels in two grouped queries.
    const taskIds = links.filter((l) => l.resourceType === "task").map((l) => l.resourceId);
    const contactIds = links.filter((l) => l.resourceType === "contact").map((l) => l.resourceId);
    const [tasks, contacts] = await Promise.all([
      taskIds.length
        ? prisma.calendarTask.findMany({
            where: { id: { in: taskIds }, userId: session.userId },
            select: { id: true, title: true, date: true, time: true },
          })
        : [],
      contactIds.length
        ? prisma.crmContact.findMany({
            where: { id: { in: contactIds }, userId: session.userId },
            select: { id: true, name: true, company: true },
          })
        : [],
    ]);
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    const rows = links.map((l) => {
      let label = "(zmazané)";
      if (l.resourceType === "task") {
        const t = taskMap.get(l.resourceId);
        if (t) label = t.title;
      } else {
        const c = contactMap.get(l.resourceId);
        if (c) label = c.name;
      }
      return {
        token: l.token,
        url: shareUrl(l.token),
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        label,
        createdAt: l.createdAt.toISOString(),
        expiresAt: l.expiresAt ? l.expiresAt.toISOString() : null,
        revokedAt: l.revokedAt ? l.revokedAt.toISOString() : null,
        viewCount: l.viewCount,
        state: shareLinkState({ revokedAt: l.revokedAt, expiresAt: l.expiresAt }),
      };
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("[share:GET]", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
