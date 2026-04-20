// src/lib/shareLoader.ts
// Server-side loader used by both /api/s/:token and the public
// /s/[token] server page. Returns a discriminated payload: active data
// or a non-available reason. Increments viewCount on active hits.

import { prisma } from "@/lib/prisma";
import { shareLinkState } from "@/lib/share";

export type SharedTaskPayload = {
  resourceType: "task";
  title: string;
  date: string;
  time: string | null;
  description: string | null;
  owner: string;
};

export type SharedContactPayload = {
  resourceType: "contact";
  name: string;
  company: string | null;
  notes: { content: string; createdAt: string }[];
  owner: string;
};

export type SharedPayload =
  | { status: "active"; data: SharedTaskPayload | SharedContactPayload }
  | { status: "revoked" | "expired" | "not_found" };

export async function loadSharedByToken(token: string): Promise<SharedPayload> {
  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) return { status: "not_found" };

  const state = shareLinkState({ revokedAt: link.revokedAt, expiresAt: link.expiresAt });
  if (state !== "active") return { status: state };

  const owner = await prisma.user.findUnique({
    where: { id: link.userId },
    select: { name: true, email: true },
  });
  const ownerName = owner?.name?.trim() || owner?.email || "Unifyo používateľ";

  if (link.resourceType === "task") {
    const t = await prisma.calendarTask.findFirst({
      where: { id: link.resourceId, userId: link.userId },
      select: { title: true, date: true, time: true, description: true },
    });
    if (!t) return { status: "not_found" };

    // Best-effort increment. Don't block the response on this.
    void prisma.shareLink
      .update({ where: { token }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});

    return {
      status: "active",
      data: {
        resourceType: "task",
        title: t.title,
        date: t.date,
        time: t.time,
        description: t.description,
        owner: ownerName,
      },
    };
  }

  // contact
  const c = await prisma.crmContact.findFirst({
    where: { id: link.resourceId, userId: link.userId },
    select: {
      name: true,
      company: true,
      notes: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { content: true, createdAt: true },
      },
    },
  });
  if (!c) return { status: "not_found" };

  void prisma.shareLink
    .update({ where: { token }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return {
    status: "active",
    data: {
      resourceType: "contact",
      name: c.name,
      company: c.company,
      notes: c.notes.map((n) => ({
        content: n.content,
        createdAt: n.createdAt.toISOString(),
      })),
      owner: ownerName,
    },
  };
}
