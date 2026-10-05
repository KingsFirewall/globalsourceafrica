import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FORMS } from "@/lib/v2/forms";
import { isHeading, type FormField, type ShareableFormDef } from "@/lib/v2/forms/types";

// Admin reads for the v2 `inquiries` table — everything submitted through
// /request and the /inquiry/<slug> share-link forms. Only called from inside
// the staff-gated /admin panel.

export type InquiryRow = {
  id: string;
  ref: string;
  service_type: string;
  payload: Record<string, string>;
  company: string | null;
  country: string | null;
  email: string;
  whatsapp: string | null;
  status: string;
  created_at: string;
};

// Pipeline stages, as documented on the table in migration 0012.
export const INQUIRY_STATUSES = ["new", "scoped", "quoted", "active", "delivered", "closed"] as const;

export const STATUS_STYLE: Record<string, string> = {
  new: "bg-orange/10 text-orangeDark",
  scoped: "bg-greenSoft text-green",
  quoted: "bg-green/15 text-green",
  active: "bg-green text-white",
  delivered: "bg-ink text-white",
  closed: "bg-greenSoft text-sub",
};

const SELECT = "id, ref, service_type, payload, company, country, email, whatsapp, status, created_at";

export async function listInquiries(): Promise<InquiryRow[]> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("inquiries")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as InquiryRow[];
}

export async function getInquiryByRef(ref: string): Promise<InquiryRow | null> {
  const db = createSupabaseAdminClient();
  const { data, error } = await db.from("inquiries").select(SELECT).eq("ref", ref).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as InquiryRow) ?? null;
}

/** Follow-up submissions (spec sheets) that name this inquiry. */
export async function listFollowUps(ref: string): Promise<InquiryRow[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from("inquiries")
    .select(SELECT)
    .contains("payload", { "Follows inquiry": ref })
    .order("created_at", { ascending: false });
  return (data ?? []) as InquiryRow[];
}

// Resilient so the dashboard never 500s if the table or database is missing.
export async function getNewInquiryCount(): Promise<number> {
  try {
    const db = createSupabaseAdminClient();
    const { count } = await db
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0;
  }
}

// --- presentation helpers ----------------------------------------------------

export const formFields = (def: ShareableFormDef) =>
  def.steps.flatMap((s) => s.items.filter((i): i is FormField => !isHeading(i)));

// Matches ShareableForm: the confirm statement is stored as "Buyer confirmation".
const answerLabel = (f: FormField) => (f.type === "confirm" ? "Buyer confirmation" : f.label);

/** The share-link form a row came from, if any (payload.form holds its name). */
export function formOf(row: InquiryRow): ShareableFormDef | undefined {
  return FORMS.find((f) => f.name === row.payload?.form);
}

export function sourceLabel(row: InquiryRow): string {
  return row.payload?.form || `Website request · ${row.service_type}`;
}

/** The buyer's name, wherever this row's form kept it. */
export function contactName(row: InquiryRow): string | null {
  const def = formOf(row);
  const f = def && formFields(def).find((x) => x.key === "contact");
  return (f && row.payload[answerLabel(f)]) || null;
}

/** One line of "what they want" for the list view. */
export function summarize(row: InquiryRow): string {
  const p = row.payload ?? {};
  if (p["Follows inquiry"]) return `Detailed specs for ${p["Follows inquiry"]}`;
  return [
    p["Charcoal type"] ?? p.product ?? p.supplier_name ?? p.shipment_details ?? p.message,
    p["First order quantity"] ?? p.quantity,
    p["Destination port and country"] ?? p.destination ?? p.location,
  ]
    .filter(Boolean)
    .join(" · ");
}

const HIDDEN_KEYS = new Set(["form", "Follows inquiry"]);
const humanize = (k: string) => (k.includes("_") ? k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : k);

/**
 * Answers grouped the way the buyer saw them. jsonb doesn't keep key order, so
 * share-link answers are re-ordered by their form's steps; anything the form
 * doesn't know (e.g. /request fields) lands under "Details".
 */
export function answerSections(row: InquiryRow): { title: string; rows: [string, string][] }[] {
  const payload = row.payload ?? {};
  const used = new Set<string>(HIDDEN_KEYS);
  const sections: { title: string; rows: [string, string][] }[] = [];
  const def = formOf(row);
  if (def) {
    for (const step of def.steps) {
      const rows: [string, string][] = [];
      for (const it of step.items) {
        if (isHeading(it)) continue;
        const label = answerLabel(it);
        if (payload[label]) {
          rows.push([label, payload[label]]);
          used.add(label);
        }
      }
      if (rows.length) sections.push({ title: step.title, rows });
    }
  }
  const rest = Object.entries(payload)
    .filter(([k, v]) => !used.has(k) && v)
    .map(([k, v]) => [humanize(k), v] as [string, string]);
  if (rest.length) sections.push({ title: "Details", rows: rest });
  return sections;
}

/** Values to prefill into this row's follow-up form, from what was stored. */
export function followUpPrefill(row: InquiryRow): Record<string, string> {
  const def = formOf(row);
  if (!def?.next) return {};
  const fields = formFields(def);
  const column: Record<string, string | null> = {
    company: row.company,
    country: row.country,
    email: row.email,
    whatsapp: row.whatsapp,
  };
  const out: Record<string, string> = {};
  for (const key of def.next.carry) {
    const f = fields.find((x) => x.key === key);
    if (!f) continue;
    const v = f.maps ? column[f.maps] : row.payload[answerLabel(f)];
    if (v) out[key] = v;
  }
  return out;
}
