// src/app/api/crm/export/route.ts
// CSV export of current user's CRM contacts.
// Returns text/csv with UTF-8 BOM so Excel SK opens it with correct diacritics.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

const HEADERS = ["Meno", "Firma", "Email", "Telefón", "Vytvorený", "Aktualizovaný"] as const;

function fmtDate(d: Date): string {
  // ISO yyyy-mm-dd HH:MM (locale-agnostic, sortable)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const contacts = await prisma.crmContact.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      name: true,
      company: true,
      email: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const rows: (string | null)[][] = [
    [...HEADERS],
    ...contacts.map((c) => [
      c.name,
      c.company,
      c.email,
      c.phone,
      fmtDate(c.createdAt),
      fmtDate(c.updatedAt),
    ]),
  ];

  const csv = toCsv(rows);
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename = `unifyo-kontakty-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
