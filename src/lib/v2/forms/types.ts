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
  // Lifts the answer into the inquiry's top-level buyer columns, so the email
  // and Supabase row carry company/email/etc. like a /request submission.
  maps?: "company" | "country" | "email" | "whatsapp";
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
  steps: FormStep[];
};

export const isHeading = (i: FormItem): i is { heading: string } => "heading" in i;
