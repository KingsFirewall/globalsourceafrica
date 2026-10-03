"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailConfigured, sendEmail, notifyInbox, shell, rows, button, escapeHtml, siteUrl } from "./email";
import { getForm } from "./forms";

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

async function nextRef(db: ReturnType<typeof createSupabaseAdminClient>): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db
    .from("inquiries")
    .select("id", { count: "exact", head: true });
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `GSA-${year}-${seq}`;
}

// Notify the team and acknowledge the buyer. Best-effort by design: the inquiry
// is already in the database by this point, so a mail failure must never surface
// to the visitor as a form error.
async function sendEmails(ref: string, input: z.infer<typeof schema>) {
  if (!emailConfigured()) return;

  // Follow-up form link, prefilled with this reference and the buyer's details.
  const nextDef = input.next_form ? getForm(input.next_form) : undefined;
  const nextLink = nextDef
    ? `${siteUrl()}/inquiry/${nextDef.slug}?${new URLSearchParams({ ref, ...input.next_prefill })}`
    : null;

  // One tap for the team to send that link to the buyer on WhatsApp once
  // they've qualified the lead. Needs an international number (the form asks
  // for the country code); wa.me wants digits only.
  const buyerDigits = (input.whatsapp || "").replace(/\D/g, "").replace(/^00/, "");
  const sendSpecsHref =
    nextDef && nextLink && buyerDigits.length >= 8
      ? `https://wa.me/${buyerDigits}?text=${encodeURIComponent(
          `Hi ${input.next_prefill.contact || "there"}, thank you for your inquiry with GlobalSource Africa (${ref}). ` +
            `So we can match the right suppliers and quote accurately, could you fill in our ${nextDef.name.toLowerCase()}? ` +
            `It takes about 5 minutes and your details are already filled in: ${nextLink}`
        )}`
      : null;
  const followUpHtml = nextLink
    ? `<div style="margin:20px 0 0;padding:16px;border:1px solid #e4e1da;border-radius:10px;background:#F6F4EF;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0B2239;">Send the ${escapeHtml(nextDef!.name.toLowerCase())}</p>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#6B7683;">Once you've qualified this buyer, send them the detailed form — prefilled with this reference and their details.</p>
        ${sendSpecsHref ? button(escapeHtml(sendSpecsHref), "Send on WhatsApp") : ""}
        <p style="margin:10px 0 0;font-size:12px;color:#6B7683;word-break:break-all;">Or copy the link: ${escapeHtml(nextLink)}</p>
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

  await Promise.allSettled([
    // replyTo is the buyer, so hitting Reply in the inbox answers them directly
    // instead of copy-pasting the address out of the body.
    sendEmail({
      to: notifyInbox(),
      replyTo: input.email,
      subject: `New inquiry ${ref} · ${input.source || input.service_type}${
        input.parent_ref ? ` · follows ${input.parent_ref}` : ""
      }`,
      html: shell(
        input.source ? `New ${escapeHtml(input.source.toLowerCase())}` : `New ${input.service_type} inquiry`,
        rows(detail) +
          `<p style="margin:16px 0 0;font-size:13px;color:#6B7683;">Reply to this email to answer ${escapeHtml(
            input.email
          )} directly.</p>` +
          followUpHtml
      ),
      text: plain + (nextLink ? `\n\nSend the ${nextDef!.name.toLowerCase()}: ${nextLink}` : ""),
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
           nextLink
             ? `<p style="margin:0 0 4px;font-size:14px;line-height:1.6;color:#0B2239;"><strong>Have your detailed specs ready?</strong> Adding them now helps us quote faster — optional, about 5 minutes, and your details are already filled in.</p>
                ${button(escapeHtml(nextLink), "Add detailed specs")}`
             : button(siteUrl() + "/sample-report", "See a sample report")
         }`
      ),
      text: `Thanks for contacting GlobalSource Africa.

Your reference is ${ref}. We review every request and reply within 48 hours (GMT to GMT+3).
${nextLink ? `
Have your detailed specs ready? Adding them helps us quote faster (optional, about 5 minutes):
${nextLink}
` : ""}
— GlobalSource Africa`,
    }),
  ]);
}

export async function submitInquiry(raw: InquiryInput): Promise<InquiryResult> {
  try {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      // Silently drop honeypot hits (pretend success to the bot).
      if (parsed.error.issues.some((i) => i.path[0] === "fax")) {
        return { ok: true, ref: "GSA-0000-0000" };
      }
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
    }
    const input = parsed.data;

    const db = createSupabaseAdminClient();
    const ref = await nextRef(db);
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
    if (error) return { ok: false, error: error.message };

    await sendEmails(ref, input);
    return { ok: true, ref };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Failed to submit. Please try again." };
  }
}
