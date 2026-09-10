// The four GSA services — single source of truth for the home grid, the service
// pages (/services/[slug]), and the /request service selector. Prices are
// published on purpose: hiding fees reads broker, showing fees reads firm.

export type Service = {
  slug: "verification" | "discovery" | "inspection" | "sourcing";
  code: string; // SVC-01 · VERIFICATION
  name: string;
  tagline: string;
  priceLabel: string; // "from $400"
  timeline: string;
  intro: string;
  scope: string[]; // what you get
  deliverable: string; // the document/outcome
  weNeed: string[]; // what we need from you
  protectsFrom: string; // stamp box copy
  faq: { q: string; a: string }[];
};

export const SERVICES: Service[] = [
  {
    slug: "verification",
    code: "SVC-01 · VERIFICATION",
    name: "Supplier Verification Report",
    tagline: "Confirm a supplier is real, registered and capable — before you pay a deposit.",
    priceLabel: "from $400",
    timeline: "5–7 business days",
    intro:
      "You found a supplier — or one found you. Before money moves, we confirm they exist, are properly registered, hold the right licenses, and can actually deliver what they claim.",
    scope: [
      "Company registry & legal-entity check (registration number, status, directors)",
      "Export license and relevant permits confirmed",
      "Physical or video site visit with dated photos",
      "Reference and trade-history calls",
      "Red-flag review (address mismatches, shell-company signals)",
      "Plain-English risk rating and recommendation",
    ],
    deliverable:
      "A decision-ready PDF verification report with findings, evidence, a risk rating, and a clear recommendation.",
    weNeed: [
      "The supplier's name, country and any contact details you have",
      "What they've told you (product, capacity, price, terms)",
      "Approximate deal size so we scope the depth of checks",
    ],
    protectsFrom:
      "Paying a deposit to a company that doesn't exist, can't export, or isn't who they claim to be.",
    faq: [
      {
        q: "What if the supplier turns out to be fake?",
        a: "You get the report either way — a 'do not proceed' is exactly the outcome that just saved you the deposit. That is the point of the service.",
      },
      {
        q: "Do you need the supplier's cooperation?",
        a: "Registry and license checks don't require it. A site visit is stronger with cooperation, but we can still assess from public records and a discreet visit.",
      },
      {
        q: "Is the fee really flat?",
        a: "Yes. We confirm the fee before we start. Inspector or travel costs for remote regions, if any, are quoted upfront and never surprise you.",
      },
    ],
  },
  {
    slug: "discovery",
    code: "SVC-02 · DISCOVERY",
    name: "Supplier Discovery",
    tagline: "We find and shortlist real, vetted suppliers for the product you need.",
    priceLabel: "from $600",
    timeline: "10–15 business days",
    intro:
      "Tell us the product and specs. We identify suppliers on the ground, screen them, and hand you a shortlist you can actually transact with — not a list of unverified web contacts.",
    scope: [
      "Sourcing brief built from your product, specs and volumes",
      "On-ground identification of candidate suppliers",
      "First-pass screening (registration, capacity, export ability)",
      "Shortlist of 3–5 vetted suppliers with profiles",
      "Indicative pricing and MOQ where available",
      "Introduction to your chosen supplier(s)",
    ],
    deliverable:
      "A shortlist document of vetted suppliers with profiles, capacity notes and indicative pricing.",
    weNeed: [
      "Product and quality specifications",
      "Target quantity and destination country",
      "Timeline and, optionally, a target price",
    ],
    protectsFrom:
      "Wasting weeks on unqualified web leads and 'suppliers' who are really just brokers.",
    faq: [
      {
        q: "Are the shortlisted suppliers verified?",
        a: "They pass a first-pass screen. For a full verification report on your chosen supplier, we roll straight into SVC-01 at a bundled rate.",
      },
      {
        q: "Do you take a commission from suppliers?",
        a: "No. We're paid by you, not them — so our shortlist answers to your interests, not a kickback.",
      },
    ],
  },
  {
    slug: "inspection",
    code: "SVC-03 · INSPECTION",
    name: "Inspection Coordination",
    tagline: "Independent eyes at sampling and loading, so you never ship blind.",
    priceLabel: "from $300 + inspector cost",
    timeline: "Scheduled to your shipment",
    intro:
      "We engage an independent, internationally accredited inspection firm — the SGS / Cotecna / Bureau Veritas tier — at sampling and at loading, and make sure you see the goods and the container before it sails.",
    scope: [
      "Inspection scope defined to your product and contract",
      "Independent accredited inspector engaged on your behalf and briefed to your spec",
      "Attendance at sampling and/or container loading",
      "Photo and video evidence of goods, quantity and seal",
      "Inspection report reviewed and explained to you",
    ],
    deliverable:
      "The independent inspection report plus loading evidence, reviewed and summarised so you can release payment with confidence.",
    weNeed: [
      "Shipment details (product, quantity, incoterm)",
      "Loading location and expected dates",
      "Your quality acceptance criteria",
    ],
    protectsFrom:
      "Paying against documents for a container that was short-loaded, swapped, or never packed as agreed.",
    faq: [
      {
        q: "Is the inspector cost included?",
        a: "Our coordination fee is flat; the accredited inspector's own fee is passed through at cost and quoted upfront.",
      },
      {
        q: "Can you inspect outside your five origins?",
        a: "Yes — inspection coordination travels with your shipment. We have our own people in Nigeria, Ghana, Egypt, Ethiopia and Tanzania; elsewhere we arrange accredited inspectors as needed.",
      },
    ],
  },
  {
    slug: "sourcing",
    code: "SVC-04 · SOURCING",
    name: "Full Sourcing Management",
    tagline: "End-to-end: we find, verify, negotiate, inspect and manage the deal for you.",
    priceLabel: "3–7% of order value, or a fixed retainer",
    timeline: "Per programme",
    intro:
      "For buyers who want the whole thing handled. We run discovery, verification, negotiation support, inspection and shipment coordination as one managed programme — your sourcing desk on the ground.",
    scope: [
      "Everything in Discovery, Verification and Inspection",
      "Negotiation support on price, terms and contract",
      "Sample coordination and approval",
      "Production and loading oversight",
      "Documentation and shipment coordination",
      "One point of contact managing the whole deal",
    ],
    deliverable:
      "A managed, verified transaction — goods sourced, checked and shipped, with you in control at every decision point.",
    weNeed: [
      "Product, specs, quantity and destination",
      "Budget or target landed cost",
      "Your timeline and any compliance requirements",
    ],
    protectsFrom:
      "Managing a first Africa deal alone across time zones, languages and unfamiliar trade rules.",
    faq: [
      {
        q: "Retainer or percentage?",
        a: "Whichever fits the programme. Recurring or large volumes usually suit a retainer; one-off deals suit a percentage. We agree it before any work begins.",
      },
      {
        q: "Do you hold the goods or take title?",
        a: "No. We never hold inventory or take title — you buy from the verified supplier directly. We manage and protect the transaction; you own it.",
      },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
