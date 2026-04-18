"use server";
// Server actions pre správu ErrorLog z admin UI.
// Oba guardujú rovnakým dvojvrstvovým auth patternom ako /admin/page.tsx:
// 1. JWT role claim, 2. live DB verifikácia (revoke-safe).

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    throw new Error("forbidden");
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
    throw new Error("forbidden");
  }
  return session;
}

/**
 * Označí VŠETKY occurences s daným fingerprint ako resolved. Keďže grupujeme
 * v UI podľa fingerprint, "resolve skupinu" = mark-all-in-group.
 */
export async function resolveFingerprint(fingerprint: string): Promise<void> {
  await requireAdmin();
  if (!fingerprint || typeof fingerprint !== "string") return;
  await prisma.errorLog.updateMany({
    where: { fingerprint, resolved: false },
    data: { resolved: true, resolvedAt: new Date() },
  });
  revalidatePath("/admin/errors");
}

/**
 * Reopen — keď sa chyba znova objaví, admin môže chcieť sledovať ďalšie occurences.
 */
export async function reopenFingerprint(fingerprint: string): Promise<void> {
  await requireAdmin();
  if (!fingerprint) return;
  await prisma.errorLog.updateMany({
    where: { fingerprint, resolved: true },
    data: { resolved: false, resolvedAt: null },
  });
  revalidatePath("/admin/errors");
}
