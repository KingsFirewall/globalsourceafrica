import type { ShareableFormDef } from "./types";

// Second stage, for buyers already in conversation with us: the full spec
// sheet. Reached from the charcoal.ts thank-you screen / confirmation email, or
// sent by the team from the inquiry notification — those links prefill the
// reference and contact details via the query string.
export const charcoalSpecs: ShareableFormDef = {
  slug: "charcoal-specs",
  name: "Charcoal specification sheet",
  label: "Charcoal import · Specification sheet",
  title: "Your detailed requirements",
  intro:
    "The detail that lets us match the right suppliers and quote accurately. Fill in what you know — anything else can be confirmed through samples and inspection.",
  metaDescription: "Send GlobalSource Africa your detailed charcoal specifications, packaging and delivery terms.",
  note: "Fields marked * are required. Unsure about a technical detail? Leave it blank or write “To be advised”.",
  submitLabel: "Send specifications",
  doneTitle: "Specifications received — thank you",
  chat:
    "The detailed charcoal spec sheet (moisture, ash, fixed carbon, packaging, incoterms, payment terms). Only for buyers who have already sent the charcoal inquiry, or who say they have full specs ready — otherwise give the quick charcoal inquiry first.",
  steps: [
    {
      title: "Your inquiry",
      items: [
        {
          key: "ref",
          label: "Inquiry reference",
          maps: "parent_ref",
          placeholder: "GSA-2026-…",
          hint: "From your confirmation email — leave blank if you don't have one.",
        },
        { key: "company", label: "Company name", required: true, maps: "company" },
        { key: "contact", label: "Your name", required: true },
        { key: "email", label: "Business email", type: "email", required: true, maps: "email" },
        { key: "phone", label: "WhatsApp / phone", type: "tel", maps: "whatsapp" },
      ],
    },
    {
      title: "Quality specifications",
      items: [
        { key: "size", label: "Lump / briquette size" },
        { key: "moisture", label: "Moisture — maximum %" },
        { key: "ash", label: "Ash content — maximum %" },
        { key: "fixed_carbon", label: "Fixed carbon — minimum %" },
        { key: "volatile", label: "Volatile matter %" },
        { key: "calorific", label: "Calorific value" },
        { key: "burn_time", label: "Minimum burn time" },
        { key: "fines", label: "Permitted dust / fines %" },
        {
          key: "performance",
          label: "Performance preferences",
          type: "checkboxes",
          options: ["Low smoke", "Low sparking", "Low odor", "Long burning"],
        },
        { key: "description", label: "Wood species, raw material or shape", type: "textarea" },
        { key: "other_specs", label: "Other specifications or acceptance criteria", type: "textarea" },
      ],
    },
    {
      title: "Packaging and delivery",
      items: [
        { key: "bag_weight", label: "Net weight per bag / carton" },
        { key: "pack_material", label: "Preferred packaging material" },
        {
          key: "branding",
          label: "Branding",
          type: "radio",
          options: ["Supplier standard packaging", "Plain / unbranded", "Private label / buyer brand"],
        },
        { key: "pack_details", label: "Printing, barcode or pallet instructions", type: "textarea" },
        { heading: "Shipping" },
        { key: "container", label: "Container / shipment size" },
        { key: "frequency", label: "Purchase frequency" },
        {
          key: "incoterm",
          label: "Preferred quotation term",
          type: "radio",
          options: ["EXW", "FOB", "CFR", "CIF", "Not sure — please advise"],
        },
        { key: "forwarder", label: "Freight forwarder / customs broker" },
        { key: "documents", label: "Required certificates / documents" },
      ],
    },
    {
      title: "Commercial terms",
      items: [
        { key: "currency", label: "Quotation currency", defaultValue: "USD" },
        { key: "target_price", label: "Target price / budget" },
        {
          key: "payment",
          label: "Preferred payment method",
          type: "radio",
          options: ["Letter of Credit", "Bank transfer", "Cash against documents", "To be discussed"],
        },
        {
          key: "verification",
          label: "Quality verification",
          type: "checkboxes",
          options: ["Pre-order sample required", "Third-party inspection required", "Supplier report acceptable"],
        },
        { key: "notes", label: "Additional terms or comments", type: "textarea" },
        { heading: "Confirmation" },
        { key: "auth_name", label: "Authorized representative", required: true },
        { key: "auth_title", label: "Position / title" },
        {
          key: "confirmed",
          label:
            "I confirm this information is accurate and understand this is a sourcing inquiry, not a purchase order or final contract.",
          type: "confirm",
          required: true,
        },
      ],
    },
  ],
};
