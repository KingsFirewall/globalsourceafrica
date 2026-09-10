// The five origins where GSA has ground presence. Single source of truth for the
// home page strip, /origins, and /origins/[slug] — same pattern as services.ts.
//
// Region and authority names are real and checkable on purpose (PRD §2: "every
// claim must be checkable"). If our actual presence in a region changes, edit it
// HERE and every page follows.

export type Origin = {
  slug: string;
  name: string;
  code: string; // "ORIGINS · GHANA"
  headline: string; // one-line commodity summary, used on the home strip
  tagline: string; // <h1> on the detail page
  blurb: string; // card copy on /origins
  intro: string; // hero paragraph on the detail page
  regions: { name: string; note: string }[];
  products: string[];
  verify: string[]; // country-specific registries and licensing bodies
};

// Shared checks that apply in every origin; each country adds its own registry
// and export-licensing bodies on top.
const COMMON_VERIFY = [
  "Physical site and warehouse visits with dated photos",
  "Capacity and trade-history references",
  "Inspection coordination at sampling and loading",
];

export const ORIGINS: Origin[] = [
  {
    slug: "nigeria",
    name: "Nigeria",
    code: "ORIGINS · NIGERIA",
    headline: "Sesame · hibiscus · cocoa · ginger",
    tagline: "West Africa's largest supply base",
    blurb:
      "Huge volumes and huge variance in who you're dealing with. Nigeria rewards buyers who verify — and punishes those who don't.",
    intro:
      "Nigeria is our home market — the company is registered here and our founder is based in Lagos. It offers the deepest supply pool in West Africa across sesame, hibiscus, cocoa and ginger, and also the widest gap between real exporters and intermediaries, which is precisely why on-ground verification pays for itself here.",
    regions: [
      { name: "Kano", note: "Sesame & hibiscus" },
      { name: "Benue", note: "Sesame & soya" },
      { name: "Kaduna", note: "Ginger" },
      { name: "Ondo / Cross River", note: "Cocoa" },
    ],
    products: [
      "Sesame seed",
      "Hibiscus (zobo) flower",
      "Raw cashew nuts",
      "Cocoa beans",
      "Dried split ginger",
    ],
    verify: [
      "Corporate Affairs Commission (CAC) registration & status",
      "Nigerian Export Promotion Council (NEPC) exporter certificate",
      ...COMMON_VERIFY,
    ],
  },
  {
    slug: "ghana",
    name: "Ghana",
    code: "ORIGINS · GHANA",
    headline: "Cocoa · shea · cashew",
    tagline: "Africa's lowest-friction origin",
    blurb:
      "English-speaking, politically stable, and a long-established exporter of cocoa, shea and cashew.",
    intro:
      "Ghana is one of the most straightforward origins on the continent to buy from: English-speaking, politically stable, with a long and well-documented export history in cocoa, shea and cashew.",
    regions: [
      { name: "Ashanti", note: "Cocoa, processing & export" },
      { name: "Northern", note: "Shea & botanicals" },
      { name: "Bono", note: "Cashew" },
    ],
    products: [
      "Cocoa beans & products",
      "Shea nuts & butter",
      "Raw cashew nuts",
      "Dried botanicals & herbs",
    ],
    verify: [
      "Registrar-General's Department registration & status",
      "Ghana Export Promotion Authority / COCOBOD licensing where relevant",
      ...COMMON_VERIFY,
    ],
  },
  {
    slug: "egypt",
    name: "Egypt",
    code: "ORIGINS · EGYPT",
    headline: "Herbs · spices · citrus · dates",
    tagline: "The herb and botanical capital of the region",
    blurb:
      "Dried herbs, spices and Nile Delta crops, with established freight links into the EU and the Gulf.",
    intro:
      "Egypt is the region's strongest origin for dried herbs, spices and botanicals, backed by mature processing capacity and short shipping routes into Europe and the Gulf.",
    regions: [
      { name: "Fayoum", note: "Herbs & botanicals" },
      { name: "Nile Delta", note: "Citrus & vegetables" },
      { name: "Upper Egypt", note: "Aromatic & medicinal crops" },
    ],
    products: [
      "Dried herbs & spices",
      "Hibiscus flower",
      "Citrus",
      "Dates",
      "Aromatic & essential oils",
    ],
    verify: [
      "Commercial Register & GAFI company status",
      "GOEIC exporter registration and product clearance",
      ...COMMON_VERIFY,
    ],
  },
  {
    slug: "ethiopia",
    name: "Ethiopia",
    code: "ORIGINS · ETHIOPIA",
    headline: "Coffee · sesame · pulses",
    tagline: "Origin coffee, at origin prices",
    blurb:
      "Specialty green coffee, sesame and pulses — an origin where traceability and grading discipline matter more than anywhere.",
    intro:
      "Ethiopia is the birthplace of arabica and a major sesame and pulse exporter. Its licensing and auction structures are unusual, so knowing who may legally export what is the single most valuable check we run here.",
    regions: [
      { name: "Sidama & Yirgacheffe", note: "Specialty coffee" },
      { name: "Humera & Gondar", note: "Sesame" },
      { name: "Oromia", note: "Coffee & oilseeds" },
    ],
    products: [
      "Green coffee (washed & natural)",
      "Sesame seed",
      "Niger seed",
      "Pulses — chickpea, faba bean",
      "Spices",
    ],
    verify: [
      "Ministry of Trade & Regional Integration business licence",
      "Ethiopian Coffee & Tea Authority export competence, where relevant",
      ...COMMON_VERIFY,
    ],
  },
  {
    slug: "tanzania",
    name: "Tanzania",
    code: "ORIGINS · TANZANIA",
    headline: "Cashew · coffee · cloves · pulses",
    tagline: "East Africa's cashew and spice gateway",
    blurb:
      "Raw cashew, arabica, cloves and pulses, moving through Dar es Salaam into Asian and European markets.",
    intro:
      "Tanzania is a leading raw-cashew origin with strong coffee and spice sectors alongside it. Much of the crop moves through regulated board and warehouse-receipt systems, so confirming a supplier's standing within those systems is essential before any deposit.",
    regions: [
      { name: "Mtwara & Lindi", note: "Raw cashew" },
      { name: "Kilimanjaro & Mbeya", note: "Arabica coffee" },
      { name: "Zanzibar", note: "Cloves & spices" },
    ],
    products: [
      "Raw cashew nuts",
      "Arabica coffee",
      "Cloves & spices",
      "Sesame seed",
      "Pulses — pigeon pea, green gram",
    ],
    verify: [
      "BRELA company registration & status",
      "Tanzania Bureau of Standards and relevant crop-board clearance",
      ...COMMON_VERIFY,
    ],
  },
];

export function getOrigin(slug: string): Origin | undefined {
  return ORIGINS.find((o) => o.slug === slug);
}
