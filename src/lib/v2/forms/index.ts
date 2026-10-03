import { charcoal } from "./charcoal";
import { charcoalSpecs } from "./charcoal-specs";
import type { ShareableFormDef } from "./types";

// Registry of shareable forms. Add a product: write its definition file and
// list it here — it is then live at /inquiry/<slug>.
export const FORMS: ShareableFormDef[] = [charcoal, charcoalSpecs];

export function getForm(slug: string): ShareableFormDef | undefined {
  return FORMS.find((f) => f.slug === slug);
}

/** Lines for the chat assistant's prompt: each form it may hand out, and when. */
export function formsForChat(baseUrl: string): string {
  return FORMS.filter((f) => f.chat)
    .map((f) => `- ${f.name}: ${baseUrl}/inquiry/${f.slug}\n  ${f.chat}`)
    .join("\n");
}
