"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailConfigured, sendEmail, notifyInbox, shell, rows, button, escapeHtml, siteUrl } from "./email";
import { followUpFor } from "./forms";

const schema = z.object({
  service_type: z.enum(["verification", "discovery", "inspection", "sourcing", "unsure"]),
  payload: z.record(z.string(), z.string()).default({}),
  company: z.string().trim().max(200).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email("Enter a valid email."),
  whatsapp: z.string().trim().max(40).optional().nullable(),
  // Which shareable form (/inquiry/<slug>) sent it, e.g. "Charcoal import
  // inquiry". Absent for /request.
  source: z.string().trim().max(120).optional().nullable(),
  // A follow-up form submission (spec sheet) names the inquiry it belongs to.
  parent_ref: z.string().trim().max(40).optional().nullable(),
  // The follow-up form to offer, and the answers to prefill into it. Only a
  // slug registered in lib/v2/forms is honoured.
  next_form: z.string().max(60).optional().nullable(),
  next_prefill: z.record(z.string(), z.string().max(300)).optional().default({}),
  // Honeypot — must stay empty. Bots fill hidden fields.
  fax: z.string().max(0).optional().default(""),
});

export type InquiryInput = z.input<typeof schema>;
export type InquiryResult = { ok: true; ref: string } | { ok: false; error: string };

// What visitors see when something breaks on our side. The real cause goes to
// the server log — never to the page (a raw "supabaseUrl is required" once
// reached a buyer's screen).
const FRIENDLY_ERROR = "Something went wrong on our side.";

async function nextRef(db: ReturnType<typeof createSupabaseAdminClient>): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db
    .from("inquiries")
    .select("id", { count: "exact", head: true });
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `GSA-${year}-${seq}`;
}

// Reference for a lead the database couldn't take. Still unique and quotable
// by the buyer; the E marks it as email-only when it turns up later.
function emailOnlyRef(): string {
  return `GSA-${new Date().getFullYear()}-E${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

// Notify the team and acknowledge the buyer. Returns whether the TEAM email
// went out: when the database write failed, that email is the only copy of the
// lead, so the caller needs to know. `unsaved` carries the database error into
// the team email so nobody assumes it is in Supabase.
async function sendEmails(
  ref: string,
  input: z.infer<typeof schema>,
  unsaved: string | null
): Promise<boolean> {
  if (!emailConfigured()) return false;

  // Follow-up form link (e.g. the spec sheet), prefilled with this reference
  // and the buyer's details, plus a one-tap WhatsApp send for the team.
  const follow = followUpFor(input.next_form, {
    baseUrl: siteUrl(),
    ref,
    prefill: input.next_prefill,
    whatsapp: input.whatsapp,
  });
  const followUpHtml = follow
    ? `<div style="margin:20px 0 0;padding:16px;border:1px solid #e4e1da;border-radius:10px;background:#F6F4EF;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0B2239;">Send the ${escapeHtml(follow.nextDef.name.toLowerCase())}</p>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6B7683;">Once you've qualified this buyer, send them the detailed form — prefilled with this reference and their details.</p>
        ${follow.whatsappHref ? button(escapeHtml(follow.whatsappHref), "Send on WhatsApp") : ""}
        <p style="margin:10px 0 0;font-size:12px;color:#6B7683;word-break:break-all;">Or copy the link: ${escapeHtml(follow.link)}</p>
      </div>`
    : "";
  const unsavedHtml = unsaved
    ? `<div style="margin:0 0 16px;padding:12px 14px;border-radius:8px;background:#FDECEA;color:#8A1C12;font-size:13px;line-height:1.5;">
        <strong>Not saved to the database</strong> — this email is the only copy, keep it. Reason: ${escapeHtml(unsaved)}
      </div>`
    : "";

  const detail: [string, string][] = [
    ["Reference", ref],
    ["Service", input.service_type],
    ...(input.source ? [["Form", input.source] as [string, string]] : []),
    ...(input.parent_ref ? [["Follows inquiry", input.parent_ref] as [string, string]] : []),
    ["Email", input.email],
    ["Company", input.company || "—"],
    ["Country", input.country || "—"],
    ["WhatsApp", input.whatsapp || "—"],
    ...Object.entries(input.payload).map(
      ([k, v]) => [k.replace(/_/g, " "), v] as [string, string]
    ),
  ];
  const plain = detail.map(([k, v]) => `${k}: ${v}`).join("\n");

  // sendEmail never rejects, so Promise.all is safe and gives us the results.
  const [team] = await Promise.all([
    // replyTo is the buyer, so hitting Reply in the inbox answers them directly
    // instead of copy-pasting the address out of the body.
    sendEmail({
      to: notifyInbox(),
      replyTo: input.email,
      subject: `${unsaved ? "[NOT SAVED] " : ""}New inquiry ${ref} · ${input.source || input.service_type}${
        input.parent_ref ? ` · follows ${input.parent_ref}` : ""
      }`,
      html: shell(
        input.source ? `New ${escapeHtml(input.source.toLowerCase())}` : `New ${input.service_type} inquiry`,
        unsavedHtml +
          rows(detail) +
          `<p style="margin:16px 0 0;font-size:13px;color:#6B7683;">Reply to this email to answer ${escapeHtml(
            input.email
          )} directly.</p>` +
          followUpHtml
      ),
      text:
        (unsaved ? `NOT SAVED TO THE DATABASE — this email is the only copy. Reason: ${unsaved}\n\n` : "") +
        plain +
        (follow ? `\n\nSend the ${follow.nextDef.name.toLowerCase()}: ${follow.link}` : ""),
    }),
    sendEmail({
      to: input.email,
      replyTo: notifyInbox(),
      subject: `We received your request · ${ref}`,
      html: shell(
        "Thanks — we have your request",
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#0B2239;">Your reference is <strong>${escapeHtml(
          ref
        )}</strong>. Someone on our team reviews every request personally and replies within 48 hours (GMT to GMT+3).</p>
         <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#0B2239;">If anything changes in the meantime, just reply to this email.</p>
         ${
           follow
             ? `<p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#0B2239;"><strong>Have your detailed specs ready?</strong> Adding them now helps us quote faster — optional, the form takes about 5 minutes to fill in, and your details are already entered.</p>
                ${button(escapeHtml(follow.link), "Add detailed specs")}`
             : button(siteUrl() + "/sample-report", "See a sample report")
         }`
      ),
      text:
        `Thanks for contacting GlobalSource Africa.\n\n` +
        `Your reference is ${ref}. We review every request and reply within 48 hours (GMT to GMT+3).\n` +
        (follow
          ? `\nHave your detailed specs ready? Adding them helps us quote faster (optional — the form takes about 5 minutes to fill in):\n${follow.link}\n`
          : "") +
        `\n— GlobalSource Africa`,
    }),
  ]);
  return team;
}

export async function submitInquiry(raw: InquiryInput): Promise<InquiryResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    // Silently drop honeypot hits (pretend success to the bot).
    if (parsed.error.issues.some((i) => i.path[0] === "fax")) {
      return { ok: true, ref: "GSA-0000-0000" };
    }
    // Validation messages are written for the visitor ("Enter a valid email.").
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const input = parsed.data;

  // 1. Save it. A failure here (missing env, paused project, outage) must not
  //    lose the lead — fall through to email with an email-only reference.
  let ref = "";
  let dbError: string | null = null;
  try {
    const db = createSupabaseAdminClient();
    ref = await nextRef(db);
    const { error } = await db.from("inquiries").insert({
      ref,
      service_type: input.service_type,
      // No dedicated column for the source form; keep it with the answers.
      payload: {
        ...(input.source ? { form: input.source } : {}),
        ...(input.parent_ref ? { "Follows inquiry": input.parent_ref } : {}),
        ...input.payload,
      },
      company: input.company || null,
      country: input.country || null,
      email: input.email,
      whatsapp: input.whatsapp || null,
      status: "new",
    });
    if (error) dbError = error.message;
  } catch (e: any) {
    dbError = e?.message ?? String(e);
  }
  if (dbError) {
    console.error("[inquiries] database write failed:", dbError);
    ref = emailOnlyRef();
  }

  // 2. Tell the team (and the buyer). If it was saved, email is a bonus; if it
  //    wasn't, the team email is the lead — success only if it went out.
  let teamEmailed = false;
  try {
    teamEmailed = await sendEmails(ref, input, dbError);
  } catch (e) {
    console.error("[inquiries] email failed:", e);
  }

  if (!dbError || teamEmailed) return { ok: true, ref };
  console.error("[inquiries] lead not saved AND not emailed:", { email: input.email, company: input.company });
  return { ok: false, error: FRIENDLY_ERROR };
}
