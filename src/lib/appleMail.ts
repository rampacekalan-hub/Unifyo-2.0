// src/lib/appleMail.ts
// Apple iCloud Mail adapters — IMAP for read, SMTP for send.
//
// Auth uses the SAME app-specific password that backs CalDAV (apple
// integration row). iCloud endpoints:
//   IMAP: imap.mail.me.com:993 (TLS)
//   SMTP: smtp.mail.me.com:587 (STARTTLS)
//
// We deliberately keep these adapters per-call (open → operate → close)
// because Next.js App Router is request-scoped and pooling would survive
// past the response. iCloud is happy with short-lived sessions.

import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { simpleParser } from "mailparser";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto-kv";

interface Creds {
  appleId: string;
  password: string;
}

async function getCreds(userId: string): Promise<Creds | null> {
  const row = await prisma.appleIntegration.findUnique({ where: { userId } });
  if (!row) return null;
  return { appleId: row.appleId, password: decryptSecret(row.passwordEnc) };
}

function newImap(creds: Creds): ImapFlow {
  return new ImapFlow({
    host: "imap.mail.me.com",
    port: 993,
    secure: true,
    auth: { user: creds.appleId, pass: creds.password },
    logger: false,
  });
}

export interface AppleMailSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

/** Map the unified `label` query to an iCloud IMAP folder name. */
function folderForLabel(label: "INBOX" | "SENT" | "DRAFT" | "STARRED" | "ALL"): string {
  switch (label) {
    case "SENT": return "Sent Messages";
    case "DRAFT": return "Drafts";
    case "STARRED": return "INBOX"; // iCloud has no flagged folder; emulated below
    case "ALL":
    case "INBOX":
    default: return "INBOX";
  }
}

export async function listAppleInbox(
  userId: string,
  opts: { maxResults?: number; q?: string; label?: "INBOX" | "SENT" | "DRAFT" | "STARRED" | "ALL" } = {},
): Promise<AppleMailSummary[]> {
  const creds = await getCreds(userId);
  if (!creds) return [];
  const max = Math.min(50, opts.maxResults ?? 20);
  const folder = folderForLabel(opts.label ?? "INBOX");

  const client = newImap(creds);
  await client.connect();
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      const mb = client.mailbox && typeof client.mailbox === "object" ? client.mailbox : null;
      const exists = mb && "exists" in mb ? (mb.exists as number) : 0;
      if (!exists) return [];

      // Fetch the most-recent `max` messages by sequence number.
      const from = Math.max(1, exists - max + 1);
      const seq = `${from}:${exists}`;
      const out: AppleMailSummary[] = [];
      for await (const msg of client.fetch(seq, {
        envelope: true,
        flags: true,
        uid: true,
        bodyStructure: false,
        size: true,
      })) {
        const env = msg.envelope;
        if (!env) continue;
        const fromAddr = env.from?.[0];
        const toAddr = env.to?.[0];
        const subject = env.subject || "(bez predmetu)";
        if (opts.q && !subject.toLowerCase().includes(opts.q.toLowerCase())) continue;
        const isRead = msg.flags?.has("\\Seen") ?? false;
        const isFlagged = msg.flags?.has("\\Flagged") ?? false;
        if (opts.label === "STARRED" && !isFlagged) continue;
        out.push({
          id: String(msg.uid),
          threadId: env.messageId ?? String(msg.uid),
          from: fromAddr ? `${fromAddr.name ?? ""} <${fromAddr.address ?? ""}>`.trim() : "",
          to: toAddr ? `${toAddr.name ?? ""} <${toAddr.address ?? ""}>`.trim() : "",
          subject,
          snippet: "", // iCloud doesn't expose preview without fetching body
          date: env.date ? new Date(env.date).toISOString() : new Date().toISOString(),
          unread: !isRead,
        });
      }
      return out.reverse(); // newest first
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function getAppleMessage(
  userId: string,
  uid: string,
): Promise<{
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  html: string | null;
  text: string | null;
  snippet: string;
}> {
  const creds = await getCreds(userId);
  if (!creds) throw new Error("not_connected");
  const client = newImap(creds);
  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const msg = await client.fetchOne(uid, { source: true, envelope: true }, { uid: true });
      if (!msg || !msg.source) throw new Error("not_found");
      const parsed = await simpleParser(msg.source as Buffer);
      // Mark \Seen so a read shows up as read, matches Gmail/Outlook semantics.
      try {
        await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
      } catch {}
      const fromHeader = parsed.from?.text ?? "";
      const toHeader = Array.isArray(parsed.to) ? parsed.to.map((a) => a.text).join(", ") : parsed.to?.text ?? "";
      return {
        id: uid,
        threadId: parsed.messageId ?? uid,
        from: fromHeader,
        to: toHeader,
        subject: parsed.subject || "(bez predmetu)",
        date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
        html: parsed.html || null,
        text: parsed.text || null,
        snippet: (parsed.text ?? "").slice(0, 160),
      };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function sendAppleMessage(
  userId: string,
  opts: { to: string; subject: string; body: string },
): Promise<void> {
  const creds = await getCreds(userId);
  if (!creds) throw new Error("not_connected");
  const transporter = nodemailer.createTransport({
    host: "smtp.mail.me.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user: creds.appleId, pass: creds.password },
  });
  await transporter.sendMail({
    from: creds.appleId,
    to: opts.to,
    subject: opts.subject,
    text: opts.body,
  });
}

/** Append a message to the Drafts folder via IMAP APPEND. */
export async function saveAppleDraft(
  userId: string,
  opts: { to: string; subject: string; body: string },
): Promise<{ id: string }> {
  const creds = await getCreds(userId);
  if (!creds) throw new Error("not_connected");
  const raw =
    `From: ${creds.appleId}\r\n` +
    `To: ${opts.to}\r\n` +
    `Subject: ${opts.subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n\r\n` +
    opts.body;

  const client = newImap(creds);
  await client.connect();
  try {
    const r = await client.append("Drafts", raw, ["\\Draft"]);
    const uid = r && typeof r === "object" && "uid" in r ? (r as { uid?: number }).uid : undefined;
    return { id: String(uid ?? Date.now()) };
  } finally {
    await client.logout().catch(() => {});
  }
}
