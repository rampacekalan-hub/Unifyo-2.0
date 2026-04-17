// src/lib/email.ts
// Thin wrapper around Resend. Keeps transactional templates in one place
// so marketing/tone changes don't need to chase API routes. Fails soft in
// development — when RESEND_API_KEY is missing, we log the email to the
// console instead of throwing, so signup still works on localhost.

import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "Unifyo <noreply@unifyo.online>";
const APP_URL = (process.env.APP_URL || "https://unifyo.online").replace(/\/$/, "");

const resend = API_KEY ? new Resend(API_KEY) : null;

// ── Low-level send ────────────────────────────────────────────────

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
}

async function send({ to, subject, html, text, tag }: SendArgs): Promise<void> {
  if (!resend) {
    // Dev fallback — visible in terminal so you can copy the link.
    console.warn(
      `[email DEV] would send to=${to} subject="${subject}"\n---\n${text}\n---`,
    );
    return;
  }
  try {
    const res = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
      tags: tag ? [{ name: "type", value: tag }] : undefined,
    });
    if (res.error) throw new Error(res.error.message);
  } catch (e) {
    console.error("[email]", tag, "failed:", e);
    throw e;
  }
}

// ── Templates ─────────────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  rawToken: string,
): Promise<void> {
  const link = `${APP_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await send({
    to,
    subject: "Reset hesla — Unifyo",
    tag: "password_reset",
    text: [
      "Ahoj,",
      "",
      "Požiadal si o obnovenie hesla k účtu Unifyo. Klikni na odkaz nižšie — platí 60 minút:",
      "",
      link,
      "",
      "Ak si o reset nepožiadal, tento email ignoruj — tvoje heslo sa nezmenilo.",
      "",
      "— Unifyo",
    ].join("\n"),
    html: wrap({
      preheader: "Obnov si heslo v nasledujúcich 60 minútach",
      title: "Reset hesla",
      bodyHtml: `
        <p>Požiadal si o obnovenie hesla k účtu <strong>Unifyo</strong>.</p>
        <p>Klikni na tlačidlo nižšie — odkaz platí <strong>60 minút</strong>.</p>
      `,
      cta: { label: "Obnoviť heslo", href: link },
      footerHtml:
        "Ak si o reset nepožiadal, tento email ignoruj — tvoje heslo sa nezmenilo.",
    }),
  });
}

export async function sendVerificationEmail(
  to: string,
  rawToken: string,
): Promise<void> {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;
  await send({
    to,
    subject: "Over svoj email — Unifyo",
    tag: "email_verify",
    text: [
      "Vitaj v Unifyo!",
      "",
      "Over si email kliknutím na odkaz nižšie — platí 7 dní:",
      "",
      link,
      "",
      "Ak si účet nevytváral, tento email ignoruj.",
      "",
      "— Unifyo",
    ].join("\n"),
    html: wrap({
      preheader: "Jeden klik a máš účet plne aktivovaný",
      title: "Vitaj v Unifyo",
      bodyHtml: `
        <p>Si len jeden klik od plne aktivovaného účtu.</p>
        <p>Over si email — odkaz platí <strong>7 dní</strong>.</p>
      `,
      cta: { label: "Overiť email", href: link },
      footerHtml: "Ak si účet nevytváral, tento email pokojne ignoruj.",
    }),
  });
}

// ── HTML template (minimal, email-client-safe inline styles) ─────
// Intentionally no external CSS — Gmail/Outlook strip <style> tags.

interface WrapArgs {
  preheader: string;
  title: string;
  bodyHtml: string;
  cta: { label: string; href: string };
  footerHtml: string;
}

function wrap({ preheader, title, bodyHtml, cta, footerHtml }: WrapArgs): string {
  return `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#05070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#eef2ff;">
<div style="display:none;max-height:0;overflow:hidden;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:rgba(10,12,24,0.95);border:1px solid rgba(99,102,241,0.25);border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 0;">
            <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#22d3ee);color:#fff;font-weight:800;font-size:14px;padding:8px 14px;border-radius:10px;letter-spacing:0.04em;">
              UNIFYO
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 8px;">
            <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#eef2ff;">${escape(title)}</h1>
            <div style="font-size:14px;line-height:1.6;color:#cbd5e1;">
              ${bodyHtml}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 32px;">
            <a href="${escape(cta.href)}"
               style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:12px;">
              ${escape(cta.label)}
            </a>
            <p style="font-size:11px;color:#6b7280;margin:20px 0 0;word-break:break-all;">
              Alebo skopíruj tento odkaz:<br>
              <span style="color:#94a3b8;">${escape(cta.href)}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(99,102,241,0.18);font-size:11px;color:#6b7280;line-height:1.6;">
            ${footerHtml}
          </td>
        </tr>
      </table>
      <p style="font-size:10px;color:#475569;margin:16px 0 0;">
        Unifyo · <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">unifyo.online</a>
      </p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const _appUrl = APP_URL;
