// src/app/api/invoices/route.ts
// Enterprise feature. List + create SK/CZ invoices. Totals computed
// server-side so the row is the source of truth — frontend never
// trusts client-supplied totals. Invoice number is user-controlled
// (e.g. "2026001") and unique per user.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { computeInvoiceTotals, type InvoiceItem } from "@/lib/invoice";

export const dynamic = "force-dynamic";

function tierGate(tier: string): boolean {
  return tier === "ENTERPRISE";
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  if (!tierGate(session.membershipTier ?? "BASIC")) {
    return NextResponse.json(
      { error: "Faktúry sú v Enterprise.", code: "TIER_LOCKED", requiredTier: "ENTERPRISE" },
      { status: 403 },
    );
  }

  const rows = await prisma.invoice.findMany({
    where: { userId: session.userId },
    orderBy: { issueDate: "desc" },
    select: {
      id: true, invoiceNumber: true, customerName: true,
      totalCents: true, currency: true, status: true,
      issueDate: true, dueDate: true, country: true,
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  if (!tierGate(session.membershipTier ?? "BASIC")) {
    return NextResponse.json(
      { error: "Faktúry sú v Enterprise.", code: "TIER_LOCKED", requiredTier: "ENTERPRISE" },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 }); }

  const required = ["invoiceNumber", "issuerName", "customerName", "items", "dueDate"] as const;
  for (const k of required) {
    if (!body[k]) return NextResponse.json({ error: `Chýba pole: ${k}` }, { status: 400 });
  }

  const country = (body.country === "CZ" ? "CZ" : "SK");
  const items = body.items as InvoiceItem[];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Aspoň jedna položka" }, { status: 400 });
  }
  for (const it of items) {
    if (typeof it.description !== "string" || typeof it.quantity !== "number" || typeof it.unitPrice !== "number" || typeof it.vatRate !== "number") {
      return NextResponse.json({ error: "Neplatná položka" }, { status: 400 });
    }
  }

  const totals = computeInvoiceTotals(items);

  try {
    const created = await prisma.invoice.create({
      data: {
        userId: session.userId,
        invoiceNumber: String(body.invoiceNumber).slice(0, 30),
        country,
        issuerName: String(body.issuerName).slice(0, 200),
        issuerAddress: String(body.issuerAddress ?? "").slice(0, 500),
        issuerIco: body.issuerIco ? String(body.issuerIco).slice(0, 30) : null,
        issuerDic: body.issuerDic ? String(body.issuerDic).slice(0, 30) : null,
        issuerIcDph: body.issuerIcDph ? String(body.issuerIcDph).slice(0, 30) : null,
        issuerIban: body.issuerIban ? String(body.issuerIban).slice(0, 50) : null,
        issuerEmail: body.issuerEmail ? String(body.issuerEmail).slice(0, 200) : null,
        customerName: String(body.customerName).slice(0, 200),
        customerAddress: String(body.customerAddress ?? "").slice(0, 500),
        customerIco: body.customerIco ? String(body.customerIco).slice(0, 30) : null,
        customerDic: body.customerDic ? String(body.customerDic).slice(0, 30) : null,
        customerIcDph: body.customerIcDph ? String(body.customerIcDph).slice(0, 30) : null,
        customerEmail: body.customerEmail ? String(body.customerEmail).slice(0, 200) : null,
        items: items as unknown as object,
        currency: (body.currency as string) === "CZK" ? "CZK" : "EUR",
        subtotalCents: totals.subtotalCents,
        vatTotalCents: totals.vatTotalCents,
        totalCents: totals.totalCents,
        dueDate: new Date(String(body.dueDate)),
        taxableDate: body.taxableDate ? new Date(String(body.taxableDate)) : null,
        variableSymbol: body.variableSymbol ? String(body.variableSymbol).slice(0, 20) : null,
        notes: body.notes ? String(body.notes).slice(0, 2000) : null,
        status: body.status === "ISSUED" ? "ISSUED" : "DRAFT",
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Číslo faktúry už existuje" }, { status: 409 });
    }
    throw e;
  }
}
