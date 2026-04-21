// src/app/api/feedback/route.ts
// Public-ish endpoint — accepts feedback from the floating widget.
// Optional auth (attach userId if signed in), hard rate-limited by IP
// to prevent form spam. No replies or retrieval API here; owner reads
// feedback from /admin only.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendGenericEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const ALLOWED_KINDS = new Set(["bug", "idea", "praise", "general"]);

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // 5 submissions per IP per 10 min — deliberate honks, not abuse.
  const rl = await rateLimit(req, { maxRequests: 5, windowMs: 600_000 }, "feedback");
  if (rl) return rl;

  let body: { message?: string; kind?: string; rating?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (message.length < 3 || message.length > 5000) {
    return NextResponse.json({ error: "message_length" }, { status: 400 });
  }
  const kind = ALLOWED_KINDS.has(body.kind ?? "") ? body.kind! : "general";
  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;

  const session = await getSession().catch(() => null);
  const page = req.headers.get("referer") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await prisma.feedback.create({
    data: {
      userId: session?.userId ?? null,
      kind,
      message,
      rating,
      page,
      userAgent,
    },
  });

  // Notify the owner — fire-and-forget so a slow SMTP doesn't block
  // the widget. Email goes to ADMIN_EMAIL (or info@unifyo.online as a
  // safe default). Body stays terse so we can read it on a phone.
  const to = process.env.ADMIN_EMAIL ?? "info@unifyo.online";
  const user = session?.userId
    ? await prisma.user
        .findUnique({ where: { id: session.userId }, select: { email: true, name: true } })
        .catch(() => null)
    : null;
  const ratingEmoji = rating ? ["😡","🙁","😐","🙂","😍"][rating - 1] : "—";
  const subject = `[${kind.toUpperCase()}] Feedback od ${user?.email ?? "anonyma"}`;
  const text = [
    `Typ: ${kind}`,
    `Od: ${user?.name ?? "—"} <${user?.email ?? "anonym"}>`,
    `URL: ${page ?? "—"}`,
    `Rating: ${ratingEmoji}${rating ? ` (${rating}/5)` : ""}`,
    "",
    "Správa:",
    message,
    "",
    "Admin: https://unifyo.online/admin/feedback",
  ].join("\n");
  const html = `<pre style="font:13px ui-monospace,Menlo;white-space:pre-wrap;padding:16px;background:#f8fafc;border-radius:8px">${text
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")}</pre>`;
  sendGenericEmail({ to, subject, html, text, tag: "feedback" }).catch((e) =>
    console.error("[feedback:email]", e),
  );

  return NextResponse.json({ ok: true });
}
