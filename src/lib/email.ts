// src/lib/email.ts
// Thin wrapper around nodemailer + SMTP (Websupport). Keeps transactional
// templates in one place so marketing/tone changes don't chase API routes.
// Fails soft in development — when SMTP creds are missing, we log the email
// to the console instead of throwing, so signup still works on localhost.

import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM = process.env.EMAIL_FROM || "Unifyo <info@unifyo.online>";
const APP_URL = (process.env.APP_URL || "https://unifyo.online").replace(/\/$/, "");

const transport: Transporter | null =
  SMTP_HOST && SMTP_USER && SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // 465 = SSL; 587 = STARTTLS
        auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      })
    : null;

// ── Low-level send ────────────────────────────────────────────────

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
  tag?: string;
}

async function send({ to, subject, html, text, tag }: SendArgs): Promise<void> {
  if (!transport) {
    // Dev fallback — visible in terminal so you can copy the link.
    console.warn(
      `[email DEV] would send to=${to} subject="${subject}"\n---\n${text}\n---`,
    );
    return;
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, html, text });
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
      "Reset hesla — Unifyo",
      "",
      "Požiadal si o obnovenie hesla k účtu Unifyo.",
      "Klikni na odkaz nižšie — platí 60 minút:",
      "",
      link,
      "",
      "Ak si o reset nepožiadal, tento email ignoruj — tvoje heslo sa nezmenilo.",
      "",
      "— Unifyo · unifyo.online",
    ].join("\n"),
    html: wrap({
      preheader: "Obnov si heslo v nasledujúcich 60 minútach",
      statusLabel: "Bezpečnostná akcia",
      title: "Reset",
      titleAccent: "hesla",
      intro:
        "Požiadal si o obnovenie hesla. Klikni na tlačidlo nižšie — odkaz platí <strong style=\"color:#eef2ff;\">60 minút</strong> a dá sa použiť iba raz.",
      cta: { label: "Obnoviť heslo", href: link },
      meta: [
        { label: "Platnosť", value: "60 minút" },
        { label: "Jednorazové použitie", value: "Áno" },
      ],
      footerHtml:
        "Nevyžiadal si tento reset? Pokojne email ignoruj — tvoje heslo sa <strong style=\"color:#cbd5e1;\">nezmenilo</strong>. Pre istotu sa uisti, že máš silné heslo.",
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
    subject: "Vitaj v Unifyo — over svoj email",
    tag: "email_verify",
    text: [
      "Vitaj v Unifyo!",
      "",
      "Si len jeden klik od plne aktivovaného Neural OS účtu.",
      "Over si email — odkaz platí 7 dní:",
      "",
      link,
      "",
      "Ak si účet nevytváral, tento email pokojne ignoruj.",
      "",
      "— Unifyo · unifyo.online",
    ].join("\n"),
    html: wrap({
      preheader: "Jeden klik a máš účet plne aktivovaný",
      statusLabel: "Vitaj na palube",
      title: "Vitaj v",
      titleAccent: "Unifyo",
      intro:
        "Si len jeden klik od plne aktivovaného <strong style=\"color:#eef2ff;\">Neural OS</strong> účtu. Over si email a sprístupní si všetky AI funkcie.",
      cta: { label: "Overiť email", href: link },
      meta: [
        { label: "Platnosť odkazu", value: "7 dní" },
        { label: "Krok", value: "1/1 · Posledný" },
      ],
      footerHtml:
        "Ak si účet nevytváral, tento email pokojne ignoruj. Nikto nebude môcť pristupovať bez overenia.",
    }),
  });
}

// ── HTML template (Unifyo brand, email-client-safe inline styles) ─
// Intentionally no external CSS — Gmail/Outlook strip <style> tags.
// Colors mirror AppLayout + Navbar: violet→cyan gradient, indigo border,
// ink bg #05070f, text #eef2ff, muted #94a3b8.

interface WrapArgs {
  preheader: string;
  statusLabel: string; // small uppercase label above title (e.g. "Bezpečnostná akcia")
  title: string; // first part of heading
  titleAccent: string; // gradient-accented tail of heading
  intro: string; // HTML-allowed intro paragraph
  cta: { label: string; href: string };
  meta?: { label: string; value: string }[]; // key-value chips under CTA
  footerHtml: string;
}

function wrap({
  preheader,
  statusLabel,
  title,
  titleAccent,
  intro,
  cta,
  meta,
  footerHtml,
}: WrapArgs): string {
  const metaHtml =
    meta && meta.length
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;width:100%;">
          <tr>
            ${meta
              .map(
                (m) => `<td style="padding:10px 14px;border:1px solid rgba(139,92,246,0.14);border-radius:12px;background:rgba(139,92,246,0.04);">
              <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;font-weight:600;">${escape(m.label)}</div>
              <div style="font-size:13px;color:#cbd5e1;font-weight:600;margin-top:4px;">${escape(m.value)}</div>
            </td><td style="width:10px;"></td>`,
              )
              .join("")}
          </tr>
        </table>`
      : "";

  return `<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escape(title)} ${escape(titleAccent)}</title>
</head>
<body style="margin:0;padding:0;background:#05070f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#eef2ff;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#05070f;">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <!-- Brand header (outside card) -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin-bottom:20px;">
        <tr>
          <td align="left" style="padding:0 4px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="padding-right:10px;vertical-align:middle;">
                <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);text-align:center;line-height:32px;color:#fff;font-weight:900;font-size:13px;letter-spacing:-0.02em;box-shadow:0 0 16px rgba(124,58,237,0.35);">U</div>
              </td>
              <td style="vertical-align:middle;">
                <div style="font-weight:800;font-size:15px;letter-spacing:-0.01em;color:#eef2ff;">Unifyo</div>
                <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;font-weight:600;margin-top:1px;">Neural OS</div>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>

      <!-- Card -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:rgba(10,12,24,0.96);border:1px solid rgba(99,102,241,0.22);border-radius:20px;overflow:hidden;">

        <!-- Top gradient hairline -->
        <tr><td style="height:1px;line-height:1px;font-size:0;background:linear-gradient(90deg,transparent,#8b5cf6,#06b6d4,transparent);">&nbsp;</td></tr>

        <!-- Content -->
        <tr>
          <td style="padding:36px 36px 8px;">
            <!-- Status pill -->
            <div style="display:inline-block;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:999px;padding:5px 12px;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#10b981;font-weight:700;margin-bottom:22px;">
              <span style="display:inline-block;width:6px;height:6px;background:#10b981;border-radius:50%;vertical-align:middle;margin-right:6px;box-shadow:0 0 8px #10b981;"></span>${escape(statusLabel)}
            </div>

            <h1 style="margin:0 0 14px;font-size:32px;line-height:1.1;letter-spacing:-0.02em;color:#eef2ff;font-weight:800;">
              ${escape(title)}
              <span style="background:linear-gradient(90deg,#a78bfa,#67e8f9);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;">${escape(titleAccent)}</span>
            </h1>

            <p style="margin:0;font-size:15px;line-height:1.65;color:#94a3b8;">${intro}</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 36px 8px;">
            <a href="${escape(cta.href)}"
               style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;letter-spacing:-0.01em;box-shadow:0 0 0 1px rgba(139,92,246,0.3),0 4px 24px rgba(124,58,237,0.4);">
              ${escape(cta.label)} →
            </a>
          </td>
        </tr>

        <!-- Meta chips -->
        ${metaHtml ? `<tr><td style="padding:0 36px;">${metaHtml}</td></tr>` : ""}

        <!-- Fallback link -->
        <tr>
          <td style="padding:24px 36px 28px;">
            <div style="font-size:11px;color:#64748b;line-height:1.6;">
              Tlačidlo nefunguje? Skopíruj tento odkaz do prehliadača:
            </div>
            <div style="margin-top:6px;font-size:11px;color:#8b5cf6;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">
              ${escape(cta.href)}
            </div>
          </td>
        </tr>

        <!-- Footer divider + note -->
        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid rgba(99,102,241,0.14);background:rgba(5,7,15,0.5);">
            <div style="font-size:12px;line-height:1.65;color:#64748b;">
              ${footerHtml}
            </div>
          </td>
        </tr>
      </table>

      <!-- Outer footer -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin-top:20px;">
        <tr>
          <td align="center" style="font-size:11px;color:#475569;line-height:1.6;">
            <div style="margin-bottom:4px;">
              <a href="${APP_URL}" style="color:#8b5cf6;text-decoration:none;font-weight:600;">unifyo.online</a>
              · AI pre slovenských podnikateľov
            </div>
            <div style="color:#334155;">
              🇸🇰 Made in Slovakia · Tento email ti posielame, lebo si si vytvoril účet na Unifyo.
            </div>
          </td>
        </tr>
      </table>

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
