"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

// Fire notification + auto-ack emails via Resend when configured; otherwise a
// graceful no-op so the form works before email is wired (RESEND_API_KEY +
// verified domain, NOTIFY_EMAIL for the founder inbox).
async function sendEmails(ref: string, input: z.infer<typeof schema>) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM || "GlobalSource Africa <onboarding@resend.dev>";
  const notify = process.env.NOTIFY_EMAIL;
  if (!key) return;

  const send = (to: string, subject: string, text: string) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    }).catch(() => {});

  const summary = `${ref} · ${input.service_type}\nEmail: ${input.email}\nCompany: ${input.company ?? "—"} (${input.country ?? "—"})\nWhatsApp: ${input.whatsapp ?? "—"}\n\n${Object.entries(input.payload).map(([k, v]) => `${k}: ${v}`).join("\n")}`;

  const jobs: Promise<unknown>[] = [];
  if (notify) jobs.push(send(notify, `New inquiry ${ref} (${input.service_type})`, summary));
  jobs.push(
    send(
      input.email,
      `We received your request · ${ref}`,
      `Thanks for contacting GlobalSource Africa.\n\nYour reference is ${ref}. Our team reviews every request and replies within 48 hours (GMT to GMT+3).\n\n— GlobalSource Africa`
    )
  );
  await Promise.allSettled(jobs);
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
