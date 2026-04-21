// src/app/api/calls/route.ts
// GET — list current user's recordings (compact fields, for the list UI).
// POST — multipart upload: file + optional title. Runs synchronously:
// saves to disk, Whisper transcribes, GPT summarises, upserts DB row.
// Short calls (< 5 min) finish in 15-30s; longer ones may hit the
// 300s max. If that's a problem in prod, move the work to a worker.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_AUDIO_MIMES,
  MAX_UPLOAD_BYTES,
  deleteCallFile,
  saveCallFile,
  summariseTranscript,
  transcribeAudio,
  resolveCallFileAbs,
} from "@/lib/calls";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — matches typical Whisper processing for <15min audio
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const rows = await prisma.callRecording.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      status: true,
      durationSec: true,
      createdAt: true,
      summary: true,
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  // Expensive endpoint — Whisper + GPT each cost real money. Cap at
  // 10 uploads / hour / IP (user can still bulk-upload, but spam
  // attacks stall quickly).
  const rl = await rateLimit(req, { maxRequests: 10, windowMs: 3600_000 }, "calls-upload");
  if (rl) return rl;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Neplatný multipart" }, { status: 400 });
  }

  const fileEntry = form.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ error: "Chýba audio súbor" }, { status: 400 });
  }

  if (fileEntry.size === 0) {
    return NextResponse.json({ error: "Súbor je prázdny" }, { status: 400 });
  }
  if (fileEntry.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Súbor je väčší ako 50 MB" }, { status: 413 });
  }
  if (!ALLOWED_AUDIO_MIMES.has(fileEntry.type)) {
    return NextResponse.json(
      { error: `Nepodporovaný formát: ${fileEntry.type || "neznámy"}` },
      { status: 415 },
    );
  }

  const titleRaw = form.get("title");
  const title =
    typeof titleRaw === "string" && titleRaw.trim()
      ? titleRaw.trim().slice(0, 120)
      : fileEntry.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Hovor";

  const buf = Buffer.from(await fileEntry.arrayBuffer());
  let relPath: string;
  let absPath: string;
  try {
    const saved = await saveCallFile(session.userId, fileEntry.name, buf);
    relPath = saved.relPath;
    absPath = saved.absPath;
  } catch (e) {
    console.error("[calls:upload] save failed", e);
    return NextResponse.json({ error: "Uloženie zlyhalo" }, { status: 500 });
  }

  // Create row upfront in UPLOADED state so we can show "processing"
  // immediately if the client polls. Then flip to TRANSCRIBING for the
  // long part of the work.
  const row = await prisma.callRecording.create({
    data: {
      userId: session.userId,
      title,
      originalName: fileEntry.name,
      mimeType: fileEntry.type,
      sizeBytes: fileEntry.size,
      filePath: relPath,
      status: "TRANSCRIBING",
    },
    select: { id: true },
  });

  try {
    const wh = await transcribeAudio(absPath, fileEntry.type, fileEntry.name);
    const sum = wh.text.trim().length
      ? await summariseTranscript(wh.text)
      : { summary: "", keyPoints: [], actionItems: [] };

    const updated = await prisma.callRecording.update({
      where: { id: row.id },
      data: {
        status: "DONE",
        transcript: wh.text,
        durationSec: wh.durationSec ?? null,
        summary: sum.summary,
        keyPoints: sum.keyPoints as unknown as object,
        actionItems: sum.actionItems as unknown as object,
      },
      select: {
        id: true, title: true, status: true, durationSec: true,
        createdAt: true, summary: true, transcript: true,
        keyPoints: true, actionItems: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[calls:upload] processing failed", e);
    await prisma.callRecording.update({
      where: { id: row.id },
      data: {
        status: "FAILED",
        errorMessage: e instanceof Error ? e.message.slice(0, 300) : "unknown",
      },
    });
    // Keep the file so user can retry from admin if needed — but for
    // now we auto-clean to save disk. Comment out if you want retention.
    try {
      await deleteCallFile(relPath);
    } catch {}
    // Silence the unused-var lint for the guarded helper.
    void resolveCallFileAbs;
    return NextResponse.json(
      { id: row.id, error: "Spracovanie zlyhalo", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
