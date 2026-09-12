"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  emailConfigured,
  sendEmail,
  notifyInbox,
  shell,
  button,
  escapeHtml,
  siteUrl,
} from "./email";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  source: z.string().trim().max(60).default("sample_report"),
});

export type LeadResult = { ok: true } | { ok: false; error: string };

// Deliver the sample report and tell the team a lead came in. The gate UI
// promises "a copy is on its way to your inbox too", so this has to actually
// send — best-effort, since the lead row is already saved either way.
async function sendLeadEmails(email: string) {
  if (!emailConfigured()) return;
  const pdf = `${siteUrl()}/sample-report.pdf`;

  await Promise.allSettled([
    sendEmail({
      to: email,
      replyTo: notifyInbox(),
      subject: "Your sample verification report",
      html: shell(
        "Here is the sample report",
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#0B2239;">This is a real-format supplier verification report with the subject redacted &mdash; the same document a client receives, including the risk rating, the findings we could not close, and the conditions we would attach before any money moves.</p>
         <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#0B2239;">If you have a supplier you want checked, reply to this email and tell us who they are.</p>
         ${button(pdf, "Download the PDF")}`
      ),
      text: `Here is the sample verification report: ${pdf}\n\nIt is a real-format report with the subject redacted. If you have a supplier you want checked, just reply to this email.\n\n— GlobalSource Africa`,
    }),
    sendEmail({
      to: notifyInbox(),
      replyTo: email,
      subject: `Sample report downloaded · ${email}`,
      html: shell(
        "Someone downloaded the sample report",
        `<p style="margin:0;font-size:14px;line-height:1.6;color:#0B2239;">${escapeHtml(
          email
        )} requested the sample verification report. Reply to this email to reach them directly &mdash; they are as warm as a lead gets without filling in the full form.</p>`
      ),
      text: `${email} downloaded the sample verification report.`,
    }),
  ]);
}

// Captures an email for the gated sample report (Supabase `leads`). Writes via
// the service role so the table stays locked to anon.
export async function captureLead(raw: { email: string; source?: string }): Promise<LeadResult> {
  try {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
    }
    const db = createSupabaseAdminClient();
    const { error } = await db.from("leads").insert(parsed.data);
    if (error) return { ok: false, error: error.message };

    await sendLeadEmails(parsed.data.email);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message ?? "Something went wrong." };
  }
}
