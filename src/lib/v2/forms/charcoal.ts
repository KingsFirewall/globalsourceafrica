import type { ShareableFormDef } from "./types";

// First contact: just enough to qualify the lead and start sourcing. Detailed
// specs live in charcoal-specs.ts, offered once this is sent.
export const charcoal: ShareableFormDef = {
  slug: "charcoal",
  name: "Charcoal import inquiry",
  label: "Charcoal import · Buyer inquiry",
  title: "Tell us what you need",
  intro:
    "Tell us what you're looking for and we'll match you with verified Nigerian charcoal suppliers. The form takes about 2 minutes to fill in.",
  metaDescription:
    "Tell us what charcoal you need — we match international buyers with verified Nigerian suppliers. The form takes about 2 minutes to fill in, and we reply within 48 hours.",
  note: "Fields marked * are required. Not sure about something? Leave it blank — we'll go through it with you.",
  submitNote: "This is an inquiry, not an order — no commitment.",
  chat:
    "We source charcoal from Nigeria for international buyers — hardwood lump, briquettes and coconut-shell, for BBQ/restaurant, shisha, industrial or retail resale. Give this link whenever someone wants to buy, import, get a quote or a price for charcoal, or asks for the charcoal form. The form takes about 2 minutes to fill in and asks what they need (type, use, quantity, destination port) and who they are. If you mention the time, make clear it is the time to fill in the form — the team replies within 48 hours, so never suggest a quote comes back in minutes.",
  steps: [
    {
      title: "What you need",
      items: [
        {
          key: "format",
          label: "Charcoal type",
          type: "radio",
          required: true,
          options: ["Hardwood lump charcoal", "Charcoal briquettes", "Coconut-shell charcoal", "Other"],
        },
        {
          key: "use",
          label: "Intended use",
          type: "radio",
          required: true,
          options: ["BBQ / restaurant", "Shisha / hookah", "Industrial", "Retail resale"],
        },
        { key: "initial_qty", label: "First order quantity", required: true, placeholder: "e.g. 1 × 40ft container or 25 MT" },
        { key: "recurring_qty", label: "Expected monthly volume", placeholder: "e.g. 2 containers / month" },
        { key: "port", label: "Destination port and country", required: true, placeholder: "e.g. Rotterdam, Netherlands" },
        { key: "arrival", label: "When do you need it?", placeholder: "e.g. March 2027" },
        {
          key: "requirements",
          label: "Specs or anything else we should know",
          type: "textarea",
          hint: "Optional — moisture, ash, size, packaging, whatever you already know.",
        },
      ],
    },
    {
      title: "About you",
      items: [
        { key: "company", label: "Company name", required: true, maps: "company" },
        { key: "contact", label: "Your name", required: true },
        { key: "email", label: "Business email", type: "email", required: true, maps: "email", placeholder: "you@company.com" },
        { key: "phone", label: "WhatsApp / phone", type: "tel", required: true, maps: "whatsapp", placeholder: "Include country code, e.g. +31…" },
        { key: "country", label: "Country", required: true, maps: "country" },
        {
          key: "role",
          label: "Your role",
          type: "radio",
          required: true,
          options: ["Importer / end buyer", "Distributor / wholesaler", "Broker / intermediary", "Other"],
        },
        {
          key: "experience",
          label: "Have you imported charcoal before?",
          type: "radio",
          required: true,
          options: ["Yes", "No — this would be my first time"],
        },
        {
          key: "found_us",
          label: "How did you hear about us?",
          type: "radio",
          required: true,
          options: ["Referral", "LinkedIn", "Instagram", "Google / web search", "Other"],
        },
        { key: "referrer", label: "Who referred you?", full: true, showIf: { key: "found_us", equals: ["Referral"] } },
        { key: "source_details", label: "Where did you find us?", full: true, showIf: { key: "found_us", equals: ["Other"] } },
      ],
    },
  ],
  next: {
    slug: "charcoal-specs",
    carry: ["company", "contact", "email", "phone"],
    title: "Have your detailed specs ready?",
    blurb:
      "Add quality limits, packaging and delivery terms now and we can quote faster. Optional — the form takes about 5 minutes to fill in, and your contact details are already entered.",
  },
};
