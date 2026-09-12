"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailConfigured, sendEmail, notifyInbox, shell, rows, button, escapeHtml, siteUrl } from "./email";

const schema = z.object({
  service_type: z.enum(["verification", "discovery", "inspection", "sourcing", "unsure"]),
  payload: z.record(z.string(), z.string()).default({}),
  company: z.string().trim().max(200).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email("Enter a valid email."),
  whatsapp: z.string().trim().max(40).optional().nullable(),
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

  const detail: [string, string][] = [
    ["Reference", ref],
    ["Service", input.service_type],
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
      subject: `New inquiry ${ref} · ${input.service_type}`,
      html: shell(
        `New ${input.service_type} inquiry`,
        rows(detail) +
          `<p style="margin:16px 0 0;font-size:13px;color:#6B7683;">Reply to this email to answer ${escapeHtml(
            input.email
          )} directly.</p>`
      ),
      text: plain,
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
         ${button(siteUrl() + "/sample-report", "See a sample report")}`
      ),
      text: `Thanks for contacting GlobalSource Africa.

Your reference is ${ref}. We review every request and reply within 48 hours (GMT to GMT+3).

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
      payload: input.payload,
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
