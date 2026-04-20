// src/app/api/crm/import/route.ts
// CSV import for CRM contacts. Accepts JSON body { csv: string }.
// Detects header variants (SK/EN), skips duplicates (same email or normalized phone),
// validates basic fields, and reports per-row errors.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { parseCsv } from "@/lib/csv";

const MAX_ROWS = 5000;

// Map of normalized header → canonical field name.
const HEADER_MAP: Record<string, "name" | "company" | "email" | "phone" | "note"> = {
  meno: "name",
  name: "name",
  firma: "company",
  company: "company",
  email: "email",
  telefon: "phone",
  phone: "phone",
  poznamka: "note",
  note: "note",
};

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeader(h: string): string {
  return stripDiacritics(h).trim().toLowerCase();
}

function normalizePhone(p: string): string {
  // Keep digits only for duplicate detection.
  return p.replace(/\D+/g, "");
}

function isValidEmail(s: string): boolean {
  // Simple pragmatic check; server doesn't need full RFC 5322.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

interface ImportError {
  row: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  // Rate limit — 10 per hour keyed per user.
  const rl = await rateLimit(
    req,
    { maxRequests: 10, windowMs: 60 * 60 * 1000 },
    `crm-import:${session.userId}`,
  );
  if (rl) return rl;

  let body: { csv?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatné JSON telo" }, { status: 400 });
  }

  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) {
    return NextResponse.json({ error: "Chýba CSV obsah" }, { status: 400 });
  }

  let rows: string[][];
  try {
    rows = parseCsv(csv);
  } catch {
    return NextResponse.json({ error: "CSV sa nedá spracovať" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Prázdny CSV" }, { status: 400 });
  }

  const header = rows[0].map(normalizeHeader);
  const dataRows = rows.slice(1);

  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Príliš veľa riadkov (${dataRows.length}). Max je ${MAX_ROWS} — rozdeľ súbor.` },
      { status: 400 },
    );
  }

  // Map header position → canonical field.
  const colMap: Record<number, "name" | "company" | "email" | "phone" | "note"> = {};
  header.forEach((h, i) => {
    const field = HEADER_MAP[h];
    if (field) colMap[i] = field;
  });

  if (!Object.values(colMap).includes("name")) {
    return NextResponse.json(
      { error: "CSV musí obsahovať stĺpec Meno alebo Name" },
      { status: 400 },
    );
  }

  // Load existing contacts for duplicate detection.
  const existing = await prisma.crmContact.findMany({
    where: { userId: session.userId },
    select: { email: true, phone: true },
  });
  const existingEmails = new Set<string>();
  const existingPhones = new Set<string>();
  for (const c of existing) {
    if (c.email) existingEmails.add(c.email.toLowerCase());
    if (c.phone) {
      const np = normalizePhone(c.phone);
      if (np) existingPhones.add(np);
    }
  }

  let imported = 0;
  let skipped = 0;
  const errors: ImportError[] = [];

  // Also track duplicates within the same import batch.
  const batchEmails = new Set<string>();
  const batchPhones = new Set<string>();

  for (let r = 0; r < dataRows.length; r++) {
    const rowNum = r + 2; // 1-based + header
    const cells = dataRows[r];

    // Skip entirely empty rows silently.
    if (cells.every((c) => c.trim() === "")) continue;

    const record: { name?: string; company?: string; email?: string; phone?: string; note?: string } = {};
    cells.forEach((value, i) => {
      const field = colMap[i];
      if (!field) return;
      const v = value.trim();
      if (v) record[field] = v;
    });

    if (!record.name) {
      errors.push({ row: rowNum, reason: "Chýba meno" });
      continue;
    }

    if (record.email && !isValidEmail(record.email)) {
      errors.push({ row: rowNum, reason: `Neplatný email: ${record.email}` });
      continue;
    }

    if (record.phone) {
      const digits = normalizePhone(record.phone);
      if (digits.length < 6) {
        errors.push({ row: rowNum, reason: `Príliš krátke telefónne číslo: ${record.phone}` });
        continue;
      }
    }

    const emailKey = record.email?.toLowerCase();
    const phoneKey = record.phone ? normalizePhone(record.phone) : "";

    if (
      (emailKey && (existingEmails.has(emailKey) || batchEmails.has(emailKey))) ||
      (phoneKey && (existingPhones.has(phoneKey) || batchPhones.has(phoneKey)))
    ) {
      skipped++;
      continue;
    }

    try {
      await prisma.crmContact.create({
        data: {
          userId: session.userId,
          name: record.name,
          company: record.company ?? null,
          email: record.email ?? null,
          phone: record.phone ?? null,
          ...(record.note
            ? { notes: { create: [{ content: record.note }] } }
            : {}),
        },
      });
      imported++;
      if (emailKey) batchEmails.add(emailKey);
      if (phoneKey) batchPhones.add(phoneKey);
    } catch (e) {
      errors.push({
        row: rowNum,
        reason: e instanceof Error ? e.message : "Zápis zlyhal",
      });
    }
  }

  return NextResponse.json({ imported, skipped, errors });
}
