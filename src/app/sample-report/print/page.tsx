import type { Metadata } from "next";
import { PrintButton } from "@/components/v2/PrintButton";

// The full, print-ready sample verification report. Open this page and use the
// browser's "Save as PDF" to produce /public/sample-report.pdf, which the email
// gate on /sample-report serves.
//
// The subject is redacted throughout and the sheet is stamped SAMPLE on purpose:
// this is a format demonstration, never a record about a real company. noindex
// keeps it out of search — the marketing page at /sample-report is the front door.
export const metadata: Metadata = {
  title: "Sample Verification Report (print) — GlobalSource Africa",
  robots: { index: false, follow: false },
};

const META: [string, string][] = [
  ["Report reference", "GSA-2026-0147"],
  ["Service", "SVC-01 · Supplier Verification"],
  ["Subject", "[REDACTED] LIMITED"],
  ["Origin", "Nigeria · Kano State"],
  ["Product scope", "Sesame seed (hulled & natural), 2 × 20ft FCL"],
  ["Commissioned by", "[REDACTED] — EU importer"],
  ["Field work", "11–16 May 2026"],
  ["Issued", "19 May 2026"],
  ["Prepared by", "GlobalSource Africa · Lagos, Nigeria"],
  ["Version", "1.0 — final"],
];

type Result = "Verified" | "Partial" | "Flag";

const FINDINGS: { area: string; result: Result; detail: string }[] = [
  {
    area: "Legal entity",
    result: "Verified",
    detail:
      "Registered with the Corporate Affairs Commission. Status active, annual returns filed to date. Directors on file match the individuals we dealt with throughout.",
  },
  {
    area: "Registered address",
    result: "Flag",
    detail:
      "The CAC address is a residential plot, not the operating warehouse. Not unusual in this market, but it means the registry address gives you no practical recourse. Addressed in the conditions.",
  },
  {
    area: "Export licence",
    result: "Verified",
    detail:
      "NEPC exporter certificate current and covering the product class. Sighted in original; reference number recorded in the appendix.",
  },
  {
    area: "Product certification",
    result: "Partial",
    detail:
      "A phytosanitary process is in place. No third-party aflatoxin testing history was produced — the single most significant gap for an EU destination.",
  },
  {
    area: "Site and capacity",
    result: "Verified",
    detail:
      "Warehouse and cleaning line observed in operation. Throughput is consistent with the volume claimed, with headroom above the order size.",
  },
  {
    area: "Trade history",
    result: "Verified",
    detail:
      "Three prior export transactions evidenced by bills of lading. Two buyers reached by phone; both confirmed delivery and said they would trade again.",
  },
  {
    area: "Banking",
    result: "Flag",
    detail:
      "The account name is an abbreviated trading name, not the exact registered entity. Common locally, but it must be reconciled in writing before any transfer.",
  },
];

const CONDITIONS = [
  "Contract in the exact registered entity name as filed at CAC — not the trading name.",
  "Written confirmation from the supplier's bank that the account belongs to that entity.",
  "Independent aflatoxin and moisture testing at sampling, against EU maximum residue levels, before shipment.",
  "Independent inspection at container loading, with the seal number photographed and reported.",
  "Payment structured against documents and inspection release, not a full advance deposit.",
];

const DOCS = [
  "CAC certificate of incorporation and status report",
  "NEPC exporter registration certificate",
  "Two prior bills of lading (counterparties redacted)",
  "Warehouse tenancy agreement",
  "Bank account confirmation letter — requested, not yet supplied",
  "42 dated site photographs and a six-minute walkthrough video",
];

const BADGE: Record<Result, string> = {
  Verified: "border-cleared text-cleared",
  Partial: "border-gold text-goldDark",
  Flag: "border-container text-container",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-steel/15 py-1.5 text-[11px]">
      <span className="w-40 shrink-0 font-mono uppercase tracking-wider text-steel">{label}</span>
      <span className="text-navy">{value}</span>
    </div>
  );
}

function H({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="gsa-heading mt-7 flex items-baseline gap-2 text-[15px] font-bold text-navy">
      <span className="font-mono text-[11px] text-container">{n}</span>
      {children}
    </h2>
  );
}

export default function SampleReportPrintPage() {
  return (
    <div className="mx-auto max-w-[820px] bg-white px-8 py-10 text-navy">
      <PrintButton />

      {/* Letterhead */}
      <header className="flex items-start justify-between border-b-2 border-navy pb-4">
        <div>
          <p className="gsa-heading text-xl font-extrabold uppercase tracking-tight text-navy">
            GlobalSource Africa
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-container">
            Verification &amp; Sourcing
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-steel">
            Supplier Verification Report
          </p>
          <p className="gsa-heading text-lg font-bold">GSA-2026-0147</p>
        </div>
      </header>

      <p className="mt-3 border border-dashed border-steel/40 bg-paper px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-steel">
        Sample · subject redacted · format demonstration only
      </p>

      <section className="mt-6">
        {META.map(([l, v]) => (
          <Row key={l} label={l} value={v} />
        ))}
      </section>

      {/* Verdict up front — a buyer reads this and nothing else if rushed. */}
      <section className="mt-6 break-inside-avoid rounded-lg border-2 border-gold bg-gold/5 p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-steel">Risk rating</p>
        <p className="gsa-heading mt-1 text-2xl font-extrabold text-navy">
          Medium — proceed with conditions
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-navy/80">
          The subject is a real, registered, licensed exporter with genuine capacity and
          a verifiable export history. We found nothing indicating fraud. Two issues — a
          registry address that does not match the operating site, and a bank account in
          an abbreviated name — are common in this market but must be closed in writing
          before money moves. The absence of any aflatoxin testing history is the main
          commercial risk for an EU destination.
        </p>
        <p className="mt-2 text-[12px] font-semibold text-navy">
          Recommendation: proceed, subject to the five conditions in section 6.
        </p>
      </section>

      <H n="1">Scope and method</H>
      <p className="mt-2 text-[12px] leading-relaxed text-navy/80">
        This report was commissioned to establish whether the subject is a legitimate,
        licensed exporter capable of fulfilling two 20ft containers of sesame seed to EU
        specification. Work comprised a registry search, licence verification, an
        unannounced site visit followed by a scheduled walkthrough, reference calls to
        prior buyers, and a documentary review. Field work was carried out by our own
        personnel in Kano over four working days. We did not conduct laboratory testing;
        where testing is required it is addressed in the conditions.
      </p>

      <H n="2">Findings</H>
      <div className="mt-3 space-y-2">
        {FINDINGS.map((f) => (
          <div key={f.area} className="break-inside-avoid rounded border border-steel/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="gsa-heading text-[13px] font-bold text-navy">{f.area}</p>
              <span
                className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${BADGE[f.result]}`}
              >
                {f.result}
              </span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-navy/80">{f.detail}</p>
          </div>
        ))}
      </div>

      <H n="3">Site visit</H>
      <p className="mt-2 text-[12px] leading-relaxed text-navy/80">
        Attended 13 May 2026 unannounced, then again on 15 May by arrangement. The
        warehouse is leased, secure and in active use. A destoner and gravity separator
        were observed running. Stock on hand at the time of the visit was consistent
        with a working exporter rather than a staged display. Photographs are timestamped
        and geotagged; the full set accompanies the delivered report.
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {["Warehouse exterior", "Cleaning line", "Stock on hand", "Loading bay"].map((c) => (
          <div key={c} className="break-inside-avoid rounded border border-steel/20 bg-paper p-2 text-center">
            <div className="flex aspect-[4/3] items-center justify-center rounded bg-navy/5 font-mono text-[8px] uppercase tracking-widest text-steel">
              Photo
            </div>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-steel">{c}</p>
          </div>
        ))}
      </div>

      <H n="4">References</H>
      <p className="mt-2 text-[12px] leading-relaxed text-navy/80">
        Three prior buyers were named; two were reached. A Turkish importer confirmed two
        shipments in 2025, both delivered on specification and on time, with one minor
        moisture dispute resolved by the supplier at their own cost. A Dubai trader
        confirmed a single 2024 shipment without issue. The third reference did not
        respond within the reporting window. Bills of lading corroborate both confirmed
        relationships.
      </p>

      <H n="5">What we could not establish</H>
      <p className="mt-2 text-[12px] leading-relaxed text-navy/80">
        We were not given sight of audited financial statements, and none are filed
        publicly. We therefore express no opinion on the subject&apos;s solvency or its
        ability to absorb a claim. No third-party aflatoxin testing history was produced.
        One of three references was unreachable. Stating these plainly is deliberate: a
        report that claims to have checked everything is not a report worth trusting.
      </p>

      <H n="6">Conditions to proceed</H>
      <ol className="mt-2 space-y-1.5">
        {CONDITIONS.map((c, i) => (
          <li key={c} className="flex gap-2.5 text-[12px] leading-relaxed text-navy/80">
            <span className="font-mono text-[11px] font-bold text-container">{i + 1}.</span>
            {c}
          </li>
        ))}
      </ol>

      <H n="7">Documents reviewed</H>
      <ul className="mt-2 space-y-1">
        {DOCS.map((d) => (
          <li key={d} className="text-[12px] text-navy/80">
            · {d}
          </li>
        ))}
      </ul>

      <H n="8">Limitations</H>
      <p className="mt-2 text-[11px] leading-relaxed text-steel">
        This report reflects information available to us during the stated field-work
        window and is prepared solely for the commissioning party. It is not a guarantee
        of future performance, not a credit opinion, and not a substitute for the
        buyer&apos;s own commercial judgement. Circumstances change: a supplier verified
        today may not merit the same rating in twelve months. Where findings rest on
        documents supplied by the subject, we state what we sighted and in what form.
      </p>

      <footer className="mt-8 flex items-end justify-between gap-4 border-t-2 border-navy pt-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-steel">Issued by</p>
          <p className="gsa-heading text-[13px] font-bold text-navy">GlobalSource Africa</p>
          <p className="text-[10px] text-steel">
            Registered in Nigeria · info@globalsourceafrica.com
          </p>
        </div>
        <p className="-rotate-2 shrink-0 rounded border-2 border-gold px-3 py-1 text-center font-mono text-[9px] uppercase leading-tight tracking-widest text-goldDark">
          Proceed with
          <br />
          conditions
        </p>
      </footer>
    </div>
  );
}
