import { SERVICES, getService } from "./services";
import { ORIGINS, getOrigin } from "./origins";
import { ARTICLES } from "./articles";

// Turns the visitor's current URL into a briefing for the assistant, so
// "what do I do on this page?" gets a real answer instead of the company pitch.
//
// Each description says three things, because that is what people actually ask:
// what this page IS, what they can DO here, and what the sensible NEXT step is.
// Keep them short — this is prepended to every request.

function serviceLine(slug: string): string | null {
  const s = getService(slug);
  if (!s) return null;
  return `The ${s.name} service page (${s.priceLabel}, ${s.timeline}). ${s.tagline}
Deliverable: ${s.deliverable}
To start this service they need: ${s.weNeed.join("; ")}.
The page lists what is included, a FAQ, and buttons to request this service.
NEXT STEP: send them to "Request this service" (which opens /request pre-filled with ${s.slug}), or answer a scope/price question first.`;
}

function originLine(slug: string): string | null {
  const o = getOrigin(slug);
  if (!o) return null;
  return `The ${o.name} origin page. ${o.blurb}
Regions we cover: ${o.regions.map((r) => `${r.name} (${r.note})`).join(", ")}.
Products: ${o.products.join(", ")}.
What we check there: ${o.verify.slice(0, 2).join("; ")}.
NEXT STEP: if they are buying from ${o.name}, offer to start a verification or sourcing request.`;
}

export function describePage(rawPath: string | undefined | null): string {
  if (!rawPath) return "";
  // strip query/hash and trailing slash
  const path = rawPath.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  const seg = path.split("/").filter(Boolean);

  // --- dynamic routes first ---
  if (seg[0] === "services" && seg[1]) {
    const line = serviceLine(seg[1]);
    if (line) return line;
  }
  if (seg[0] === "origins" && seg[1]) {
    const line = originLine(seg[1]);
    if (line) return line;
  }
  if (seg[0] === "resources" && seg[1]) {
    const a = ARTICLES.find((x) => x.slug === seg[1]);
    if (a) {
      return `A buyer guide: "${a.title}" (${a.readMins} min read). ${a.excerpt}
It covers: ${a.body.map((b) => b.heading).join("; ")}.
NEXT STEP: answer questions about the article's subject. If they are facing this problem for real, offer to start a request.`;
    }
  }

  const MAP: Record<string, string> = {
    "/": `The home page. It explains the problem (fake exporters, forged documents, shipments that never load), lists the four services, how it works, the sample report, our five origins, and who runs the company.
NEXT STEP: find out what they actually need — a specific supplier checked, suppliers found, an inspection, or the whole deal managed — and point them at that service.`,

    "/services": `The services index, listing all four: ${SERVICES.map(
      (s) => `${s.name} (${s.priceLabel})`
    ).join(", ")}.
NEXT STEP: help them pick. Rough rule — they already found a supplier: Verification. They need suppliers found: Discovery. Goods are being loaded: Inspection. They want the whole thing handled: Full Sourcing.`,

    "/how-it-works": `The process page: submit a request, we scope and quote a flat fee, ground work begins (registry, licences, site visit, references), inspection is coordinated at sampling and loading, then the report or verified deal is delivered.
NEXT STEP: answer process/timeline questions, then offer to start a request.`,

    "/origins": `The origins index. We have people on the ground in ${ORIGINS.map((o) => o.name).join(
      ", "
    )}, and each country page lists its regions, products and the registry/licence bodies we check.
NEXT STEP: ask which country they are buying from and open that origin page, or start a request.`,

    "/resources": `The buyer guides index — articles on verifying suppliers before paying a deposit, why EU shipments get rejected, export documentation, and more.
NEXT STEP: point them at the guide matching their problem, or offer to start a request if they need it done rather than explained.`,

    "/sample-report": `The sample report page. It shows a real-format, fully redacted supplier verification report — registry findings, licence checks, site-visit photos, references, a risk rating and a recommendation. There is an email box that sends the full PDF.
NEXT STEP: if they want the full PDF, tell them to drop their email in the box on this page. Answer questions about what the report contains.`,

    "/request": `The request form — this is where a visitor actually starts work with us. THREE STEPS:
  Step 1: choose what they need (verify a supplier / find suppliers / coordinate inspection / full sourcing / not sure yet).
  Step 2: details for that choice. Verifying a supplier asks supplier name, supplier country, their website or contact, what the supplier has told them (product, capacity, price, terms) and rough deal size. Sourcing or discovery asks product, quantity, destination country, quality specs, timeline and target price. Inspection asks shipment details, loading location and dates.
  Step 3: their own contact — company, country, email, WhatsApp.
No login and no obligation. After submitting they get a reference number (like GSA-2026-0001) and we confirm scope and a flat fee within 48 hours, before any work begins.
NEXT STEP: if they are unsure what to put in a field, tell them plainly and say that a rough answer is fine — we confirm scope afterwards. "Not sure yet" is a valid choice at step 1. Only fields marked * are required.`,

    "/about": `The about page: why we exist, how we work, and who runs the company — Kingsley Israel, founder, based in Lagos, Nigeria. It also carries the registered entity, Global Source Africa Limited, RC 9851214.
NEXT STEP: answer questions about who we are and our independence (we are paid by the buyer, never by suppliers).`,

    "/contact": `The contact page: email info@globalsourceafrica.com, WhatsApp, LinkedIn, and our hours. We reply within 48 hours.
NEXT STEP: they may prefer a human — give the email, and offer to take their request here instead.`,

    "/legal/privacy": `The privacy policy. It covers what we collect from the request and sample-report forms and how it is used.
NEXT STEP: answer plainly. For anything legally specific, point them to info@globalsourceafrica.com.`,

    "/legal/terms": `The terms page, covering that our deliverable is information and coordination, that findings reflect what was available at the time, and that fees are agreed before work begins.
NEXT STEP: answer plainly. For anything legally specific, point them to info@globalsourceafrica.com.`,
  };

  return MAP[path] ?? "";
}
