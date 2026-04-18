// src/app/api/contact/route.ts
// Verejný kontaktný formulár → info@unifyo.online cez SMTP (Websupport).
// Naivný in-memory rate-limit (3 req / IP / 10 min) na obmedzenie spamu
// — stačí na soft-launch; pri ďalšom raste prejsť na Redis alebo edge store.

import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return false;
  }
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

function getIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: "Príliš veľa pokusov. Skús to o chvíľu znova." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Neplatný formát." }, { status: 400 });
  }

  const { name, email, message } = (body as Record<string, unknown>) || {};

  // Validácia
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 120) {
    return NextResponse.json({ ok: false, error: "Neplatné meno." }, { status: 400 });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return NextResponse.json({ ok: false, error: "Neplatný email." }, { status: 400 });
  }
  if (typeof message !== "string" || message.trim().length < 5 || message.length > 5000) {
    return NextResponse.json({ ok: false, error: "Neplatná správa." }, { status: 400 });
  }

  try {
    await sendContactMessage({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] send failed:", err);
    return NextResponse.json(
      { ok: false, error: "Odoslanie zlyhalo. Skús to znova." },
      { status: 500 },
    );
  }
}
