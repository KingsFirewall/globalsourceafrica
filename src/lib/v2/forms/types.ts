// Shareable buyer forms — one data file per product, rendered by
// components/v2/ShareableForm and served at /inquiry/<slug>. Answers go through
// the same submitInquiry pipeline as /request, so they land in the `inquiries`
// table and the team inbox with a GSA reference.

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "date"
  | "textarea"
  | "radio" // one of `options`
  | "checkboxes" // any of `options`
  | "confirm"; // single tick-box; `label` is the statement being confirmed

export type FormField = {
  key: string;
  label: string;
  type?: FieldType; // default "text"
  required?: boolean;
  options?: string[];
  placeholder?: string;
  hint?: string;
  full?: boolean; // span both columns (radio/checkbox/textarea/confirm always do)
  defaultValue?: string;
  // Only shown (and only submitted) while another field holds one of these
  // values — e.g. "Who referred you?" appears once "Referral" is picked.
  showIf?: { key: string; equals: string[] };
  // Lifts the answer into the inquiry's top-level buyer columns, so the email
  // and Supabase row carry company/email/etc. like a /request submission.
  // parent_ref ties a follow-up form to the inquiry that came before it.
  maps?: "company" | "country" | "email" | "whatsapp" | "parent_ref";
};

export type FormItem = FormField | { heading: string };

export type FormStep = {
  title: string;
  help?: string;
  items: FormItem[];
};

export type ShareableFormDef = {
  slug: string;
  name: string; // "Charcoal import inquiry" — used in the email subject and payload
  label: string; // short mono label on the page header, e.g. "CHARCOAL IMPORT"
  title: string;
  intro: string;
  metaDescription: string;
  note: string; // one line above the form card
  submitLabel?: string; // default "Submit inquiry"
  submitNote?: string; // small print beside the final submit button
  doneTitle?: string; // default "Inquiry received — thank you"
  steps: FormStep[];
  // A follow-up form offered after this one is sent: on the thank-you screen,
  // in the buyer's confirmation email, and as a ready-to-send WhatsApp link in
  // the team's notification. `carry` lists answers (by key) prefilled into it;
  // the new reference always travels as ?ref=.
  next?: { slug: string; carry: string[]; title: string; blurb: string };
};

export const isHeading = (i: FormItem): i is { heading: string } => "heading" in i;

export type FormValues = Record<string, string | string[]>;

export const isVisible = (f: FormField, values: FormValues) =>
  !f.showIf || f.showIf.equals.includes(String(values[f.showIf.key] ?? ""));
