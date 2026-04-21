// src/lib/calls.ts
// Helpers for the Calls module — storage path resolution, Whisper
// transcription, and GPT summarisation. Each function is a small
// wrapper around the OpenAI REST API (no SDK, to stay consistent with
// the rest of the project).

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// File store — lives on the PM2 host, one folder per user. Override
// with `UPLOADS_DIR` env in prod (e.g. a Hetzner volume mount).
export function uploadsRoot(): string {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
}

export async function saveCallFile(
  userId: string,
  originalName: string,
  buf: Buffer,
): Promise<{ relPath: string; absPath: string }> {
  const ext = path.extname(originalName).toLowerCase() || ".bin";
  const id = crypto.randomUUID();
  const dir = path.join(uploadsRoot(), "calls", userId);
  await fs.mkdir(dir, { recursive: true });
  const absPath = path.join(dir, `${id}${ext}`);
  await fs.writeFile(absPath, buf);
  const relPath = path.relative(uploadsRoot(), absPath);
  return { relPath, absPath };
}

export function resolveCallFileAbs(relPath: string): string {
  // Guard against escape — prevents `..` walks in DB rows.
  const abs = path.resolve(uploadsRoot(), relPath);
  if (!abs.startsWith(path.resolve(uploadsRoot()))) {
    throw new Error("path_escape");
  }
  return abs;
}

export async function deleteCallFile(relPath: string): Promise<void> {
  try {
    await fs.unlink(resolveCallFileAbs(relPath));
  } catch {
    // File already gone — DB row will be removed regardless.
  }
}

const OPENAI = "https://api.openai.com/v1";

function openaiKey(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY missing");
  return k;
}

export interface WhisperResult {
  text: string;
  durationSec?: number;
}

export async function transcribeAudio(
  absPath: string,
  mimeType: string,
  originalName: string,
): Promise<WhisperResult> {
  const fileBuf = await fs.readFile(absPath);
  const form = new FormData();
  // Whisper expects a `file` field; we send the raw buffer wrapped in
  // a Blob so undici can stream it multipart-style.
  form.append("file", new Blob([new Uint8Array(fileBuf)], { type: mimeType }), originalName);
  form.append("model", "whisper-1");
  form.append("language", "sk"); // Slovak — best accuracy for our users
  form.append("response_format", "verbose_json");

  const res = await fetch(`${OPENAI}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey()}` },
    body: form,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`whisper_failed:${res.status}:${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as { text: string; duration?: number };
  return {
    text: data.text ?? "",
    durationSec: typeof data.duration === "number" ? Math.round(data.duration) : undefined,
  };
}

export interface CallSummary {
  summary: string;
  keyPoints: string[];
  actionItems: Array<{ title: string; ownerHint?: string }>;
}

export async function summariseTranscript(transcript: string): Promise<CallSummary> {
  // Hard cap — Whisper can produce 50k+ tokens for long calls. We feed
  // GPT only the first ~12k chars; summaries of long calls are fine on
  // the opening section plus a note about truncation. Full transcript
  // stays in the DB for the user.
  const trimmed = transcript.length > 12000
    ? transcript.slice(0, 12000) + "\n\n[... skrátené ...]"
    : transcript;

  const sys = [
    "Si asistent, ktorý analyzuje prepis hovoru alebo stretnutia po slovensky.",
    "Vráť STRIKTNE platný JSON bez ďalšieho textu, presne tvaru:",
    '{"summary": string, "keyPoints": string[], "actionItems": [{"title": string, "ownerHint": string?}]}',
    "summary = 3-5 viet, neutrálny ton.",
    "keyPoints = 3-8 bulletov po 1 vete.",
    "actionItems = úlohy/rozhodnutia ktoré vyplynuli z hovoru. Ak žiadne, vráť [].",
  ].join(" ");

  const res = await fetch(`${OPENAI}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: trimmed },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`summary_failed:${res.status}:${errText.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content) as CallSummary;
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 12) : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.slice(0, 12) : [],
    };
  } catch {
    // Model returned invalid JSON — unusual with response_format but
    // we handle it gracefully rather than losing the transcript.
    return { summary: content.slice(0, 500), keyPoints: [], actionItems: [] };
  }
}

// Accepted audio MIME types — whitelist to prevent arbitrary file
// uploads. Whisper supports these natively.
export const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",     // mp3
  "audio/mp3",
  "audio/mp4",      // m4a
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
]);

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
