import { charcoal } from "./charcoal";
import { charcoalSpecs } from "./charcoal-specs";
import type { ShareableFormDef } from "./types";

// Registry of shareable forms. Add a product: write its definition file and
// list it here — it is then live at /inquiry/<slug>.
export const FORMS: ShareableFormDef[] = [charcoal, charcoalSpecs];

export function getForm(slug: string): ShareableFormDef | undefined {
  return FORMS.find((f) => f.slug === slug);
}

/**
 * Links for sending a buyer the follow-up form `nextSlug` (e.g. the spec
 * sheet after the charcoal inquiry): the prefilled URL, and — when the buyer gave an
 * international number — a wa.me link with the message already written. Used by
 * the team notification email and the admin inquiry page.
 */
export function followUpFor(
  nextSlug: string | null | undefined,
  opts: { baseUrl: string; ref: string; prefill: Record<string, string>; whatsapp?: string | null }
) {
  const nextDef = nextSlug ? getForm(nextSlug) : undefined;
  if (!nextDef) return null;
  const link = `${opts.baseUrl}/inquiry/${nextDef.slug}?${new URLSearchParams({ ref: opts.ref, ...opts.prefill })}`;
  // wa.me wants digits only, in international format (the form asks for the country code).
  const digits = (opts.whatsapp || "").replace(/\D/g, "").replace(/^00/, "");
  const message =
    `Hi ${opts.prefill.contact || "there"}, thank you for your inquiry with GlobalSource Africa (${opts.ref}). ` +
    `So we can match the right suppliers and quote accurately, could you fill in our ${nextDef.name.toLowerCase()}? ` +
    `The form takes about 5 minutes to fill in, and your details are already entered: ${link}`;
  return {
    nextDef,
    link,
    whatsappHref: digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null,
  };
}

/** Lines for the chat assistant's prompt: each form it may hand out, and when. */
export function formsForChat(baseUrl: string): string {
  return FORMS.filter((f) => f.chat)
    .map((f) => `- ${f.name}: ${baseUrl}/inquiry/${f.slug}\n  ${f.chat}`)
    .join("\n");
}
