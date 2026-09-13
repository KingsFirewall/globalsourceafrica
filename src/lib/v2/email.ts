import "server-only";

// Single place email leaves the app. Both the inquiry flow (/request) and the
// sample-report gate use this.
//
// Everything degrades to a no-op when RESEND_API_KEY is absent, so forms keep
// working before email is wired — but note that a no-op means a lead lands in
// Supabase with nobody alerted, so "configured" is not optional in production.

const ENDPOINT = "https://api.resend.com/emails";

/** Whether outbound email is wired up at all. */
export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// The sending identity must sit on the domain verified in Resend. We verified the
// SUBDOMAIN mail.globalsourceafrica.com (the recommended setup — a bounce problem
// on marketing mail can't then damage the root domain's reputation), so the From
// address lives there and NOT on the bare root, which Resend would reject.
//
// Replies are a separate matter: every message sets replyTo to a real monitored
// inbox, so recipients answer to info@globalsourceafrica.com and never see this
// address. Override with NOTIFY_FROM.
function sender(): string {
  return process.env.NOTIFY_FROM || "GlobalSource Africa <info@mail.globalsourceafrica.com>";
}

/** Where founder notifications go. Falls back to the public inbox. */
export function notifyInbox(): string {
  return process.env.NOTIFY_EMAIL || "info@globalsourceafrica.com";
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string; // always send a plaintext part — some clients prefer it, and it keeps us out of spam folders
  replyTo?: string;
};

/**
 * Never throws and never rejects: a mail failure must not lose the inquiry that
 * has already been written to the database. Returns whether it went out so the
 * caller can log, not so it can fail.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender(),
        to,
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] resend rejected:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

// --- shared shell -----------------------------------------------------------
// Inline styles only: Gmail and Outlook strip <style> blocks.

const NAVY = "#0B2239";
const GREEN = "#1B6B3F";
const STEEL = "#6B7683";
const PAPER = "#F6F4EF";

export function shell(heading: string, bodyHtml: string): string {
  return `<div style="margin:0;padding:24px;background:${PAPER};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e1da;border-radius:12px;overflow:hidden;">
    <div style="background:${NAVY};padding:18px 24px;">
      <div style="color:#fff;font-size:17px;font-weight:800;letter-spacing:-0.01em;">GlobalSource Africa</div>
      <div style="color:${GREEN};font-size:10px;letter-spacing:.28em;text-transform:uppercase;margin-top:3px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">Verification &amp; Sourcing</div>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 14px;font-size:18px;line-height:1.3;color:${NAVY};">${heading}</h1>
      ${bodyHtml}
    </div>
    <div style="border-top:1px solid #e4e1da;padding:14px 24px;color:${STEEL};font-size:11px;line-height:1.5;">
      Global Source Africa Limited · RC 9851214 · Nigeria<br>
      Nigeria · Ghana · Egypt · Ethiopia · Tanzania
    </div>
  </div>
</div>`;
}

/** Label/value rows for the founder notification. */
export function rows(pairs: [string, string][]): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;">${pairs
    .map(
      ([k, v]) =>
        `<tr>
      <td style="padding:6px 12px 6px 0;color:${STEEL};white-space:nowrap;vertical-align:top;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(k)}</td>
      <td style="padding:6px 0;color:${NAVY};vertical-align:top;">${escapeHtml(v)}</td>
    </tr>`
    )
    .join("")}</table>`;
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:8px;background:${GREEN};color:#fff;text-decoration:none;padding:11px 22px;border-radius:999px;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>`;
}

// Inquiry fields are attacker-controlled and land in the founder's inbox, so
// everything interpolated into HTML is escaped.
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://globalsourceafrica.com")
  );
}
