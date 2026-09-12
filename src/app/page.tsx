import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { TrustStrip } from "@/components/v2/TrustStrip";
import { HeroVisual } from "@/components/v2/hero/HeroVisual";
import { ServiceCard } from "@/components/v2/ServiceCard";
import { CraneSection } from "@/components/v2/scenes/CraneSection";
import { LandingCTA } from "@/components/v2/scenes/LandingCTA";
import { SERVICES } from "@/lib/v2/services";
import { ORIGINS } from "@/lib/v2/origins";

export const metadata = {
  title: "GlobalSource Africa — supplier verification & sourcing in Africa",
};

const ARTICLES = [
  { slug: "verify-african-supplier-before-deposit", title: "How to verify an African supplier before paying a deposit" },
  { slug: "why-africa-shipments-rejected-eu", title: "Why shipments from Africa get rejected in the EU (and how to prevent it)" },
  { slug: "africa-export-documentation-buyers-guide", title: "Export documentation: what buyers should ask for" },
];

export default function HomePage() {
  return (
    <>
      {/* 1 · HERO — single column on every screen: H1 on top, container below */}
      <section className="gsa-corrugation relative overflow-hidden bg-white text-navy">
        {/* Earth backdrop — transparent-sky PNG, globe anchored low and
            stretched full-bleed edge to edge, so the falling container reads
            as tumbling down toward the planet. Wider than the viewport on
            phones (so the globe is a real planet, not a thin band).
            On desktop the image is full-bleed, so its HEIGHT (and therefore
            how high the bright rim arcs) grows with the viewport width — a
            fixed offset would clear the copy at 1440 and swallow it at 1920.
            The vw-based offset sinks the globe in proportion to its own size,
            so the rim always lands just below the trust strip at any width.
            aria-hidden: pure decoration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/scenes/earth.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 z-0 max-w-none -translate-x-1/2 select-none -bottom-8 w-[145%] sm:-bottom-24 sm:w-[130%] lg:w-full lg:[bottom:calc(460px_-_44.7vw)]"
        />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-0 pt-6 text-center lg:pt-8">
          <MonoLabel className="text-container">ON-GROUND SINCE 2026 · 5 AFRICAN ORIGINS</MonoLabel>
          <h1 className="gsa-heading mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-navy sm:text-5xl lg:text-6xl">
            Your verification and sourcing partner on the ground in Africa
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel">
            We help international buyers find, verify and buy from African
            suppliers safely — before you send a single dollar.
          </p>
          {/* Side by side on every screen (kept on one row on phones) */}
          <div className="mt-8 flex justify-center gap-2 sm:gap-3">
            <Link href="/request" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-container px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand sm:px-6 sm:py-3 sm:text-base">
              Request Sourcing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/services/verification" className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-navy/20 px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-paper sm:px-6 sm:py-3 sm:text-base">
              <ShieldCheck className="h-4 w-4" /> Verify a Supplier
            </Link>
          </div>
          <TrustStrip className="mt-8 justify-center text-steel" items={["SGS-COORDINATED", "5 ORIGINS", "48H RESPONSE", "FLAT-FEE REPORTS"]} />

          {/* Container under the headline — fixed pose rolls in place, so the
              column stays tight instead of reserving sweep room */}
          <div className="mt-2 w-full max-w-md sm:max-w-lg lg:max-w-3xl">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* 2 · PROBLEM STRIP — tight top padding: the hero container above sits
          almost directly on these headings. The section's bottom padding is
          sized to exactly seat the full-bleed field band below, so the closing
          line reads as standing on the field without ever being overlapped. */}
      {/* --field-h    : rendered height of the field band.
          --field-sink : how far the heading's bottom sinks BELOW the image's top
                         edge.

          Both are DERIVED from the asset, not taste — re-measure if it is ever
          replaced again. object-cover scales the image by width, so a source row
          y lands at (y / 1536) * 100vw below the band's top.

          field.webp is 1536x1024 and fades from transparent sky into the field
          gradually (25% opaque at row 371, 90% at row 614) rather than at a hard
          horizon. Row 371 -> 24.2vw is where it starts genuinely occluding, so the
          heading sinks to just past there: the letters' feet go into the fade and
          the farmers, while their bodies stay clear against the paper.

          --field-h keeps roughly the same depth of field visible below the horizon
          as the previous asset did (~18vw), hence 24 + 18 = 42vw. */}
      <section
        className="relative overflow-hidden bg-paper pb-[calc(var(--field-h)_-_var(--field-sink))]"
        style={
          {
            "--field-h": "clamp(230px, 42vw, 740px)",
            "--field-sink": "calc(24vw + 20px)",
          } as React.CSSProperties
        }
      >
        <div className="relative z-0 mx-auto max-w-7xl px-4 pb-0 pt-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { h: "Fake exporters", d: "Companies that don't exist, or can't actually export, take your deposit and vanish." },
              { h: "Photoshopped documents", d: "Licenses, certificates and bank details that look real until your money is gone." },
              { h: "Shipments that never load", d: "Containers short-loaded, swapped, or never packed — discovered only on arrival." },
            ].map((c) => (
              <div key={c.h}>
                <h3 className="gsa-heading text-lg font-bold text-navy">{c.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{c.d}</p>
              </div>
            ))}
          </div>
          <h2 className="gsa-heading mt-8 text-center text-4xl font-extrabold leading-[0.95] tracking-[-0.03em] text-brand sm:text-6xl lg:text-7xl">
            This is why we exist.
          </h2>
        </div>

        {/* Full-bleed field band welded to the section floor, painted OVER the
            heading (z-10 vs the copy's z-0) so the farmers and the crop line occlude
            the letters — the type reads as standing in the field, not above it.

            This only works because the asset keeps its alpha: the source sky is
            genuinely transparent (rows 0-576 are alpha 0), so bg-paper shows straight
            through it and the heading behind stays legible, while the opaque farmers
            and soil cut across the letters' feet. The alpha ramp at the horizon is
            also what dissolves the photo into #F6F4EF — no CSS mask needed, and
            flattening this asset onto a solid colour would destroy both effects.

            object-top keeps that transparent headroom and the farmers in frame at
            every width, cropping the near-foreground soil off the bottom instead. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/scenes/field.webp"
          alt=""
          aria-hidden
          loading="lazy"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[var(--field-h)] w-full select-none object-cover object-top"
        />
      </section>

      {/* 3 · SERVICES GRID */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-10">
          <MonoLabel className="text-steel">WHAT WE DO</MonoLabel>
          <h2 className="gsa-heading mt-3 text-3xl font-bold text-navy sm:text-4xl">
            Four ways we protect your Africa deal
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <ServiceCard key={s.slug} service={s} />
            ))}
          </div>
        </div>
      </section>

      {/* 4 · HOW IT WORKS — crane + scroll-driven truck set piece (PRD §4.2) */}
      <CraneSection />

      {/* 5 · SAMPLE REPORT TEASER */}
      <section className="bg-paper">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 lg:grid-cols-2">
          <div className="relative h-64 sm:h-80">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute h-full w-48 rounded-md border border-steel/20 bg-white shadow-lg sm:w-56"
                style={{ left: `${i * 3.5}rem`, top: `${i * 0.75}rem`, transform: `rotate(${(i - 1) * 3}deg)`, zIndex: 3 - i }}
              >
                <div className="border-b border-steel/15 p-3">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-steel">GSA-2026-0147 · VERIFICATION</div>
                  <div className="mt-1 h-2 w-3/4 rounded bg-navy/80" />
                </div>
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, r) => (
                    <div key={r} className="h-1.5 rounded bg-steel/15" style={{ width: `${90 - r * 8}%` }} />
                  ))}
                  <div className="mt-3 inline-block -rotate-2 rounded border-2 border-cleared px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-cleared">
                    Cleared
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div>
            <MonoLabel className="text-steel">BEFORE YOU PAY</MonoLabel>
            <h2 className="gsa-heading mt-3 text-3xl font-bold text-navy sm:text-4xl">
              See exactly what you get before you pay
            </h2>
            <p className="mt-4 max-w-lg text-steel">
              A real-format, fully redacted verification report — registry
              findings, license checks, site-visit photos, reference summary, a
              risk rating and our recommendation. No surprises about the
              deliverable.
            </p>
            <Link href="/sample-report" className="mt-6 inline-flex items-center gap-2 rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90">
              View a sample report <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6 · ORIGINS — FIVE COUNTRIES */}
      <section className="gsa-corrugation bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <MonoLabel className="text-gold">ORIGINS</MonoLabel>
            <h2 className="gsa-heading mt-3 text-3xl font-bold sm:text-4xl">
              Five origins. Our own people in each.
            </h2>
            <p className="mt-4 max-w-lg text-white/70">
              <span className="text-white">Nigeria, Ghana, Egypt, Ethiopia and Tanzania</span> — coffee,
              cocoa, cashew, sesame, shea, herbs and spices. In every one of them we
              have people in-country, not agents on the end of a phone.
            </p>
            <p className="mt-3 max-w-lg text-white/60">
              We name the regions we work in and the licensing bodies we check, so
              you can hold us to it. That is the whole point of a trust service.
            </p>
            <Link href="/origins" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:gap-2.5">
              Explore origins <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-3">
            {ORIGINS.map((o) => (
              <Link
                key={o.slug}
                href={`/origins/${o.slug}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-gold/50 hover:bg-white/[0.06]"
              >
                <MapPin className="h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">{o.name}</p>
                  <p className="font-mono text-xs uppercase tracking-wider text-white/50">{o.headline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7 · WHO'S ON THE GROUND */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-14 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ceo.jpg"
            alt="Kingsley Israel, founder of GlobalSource Africa"
            className="h-40 w-40 shrink-0 rounded-2xl object-cover object-top"
          />
          <div>
            <MonoLabel className="text-steel">WHO&apos;S ON THE GROUND</MonoLabel>
            <h2 className="gsa-heading mt-3 text-2xl font-bold text-navy">Kingsley Israel</h2>
            <p className="font-mono text-xs uppercase tracking-wider text-steel">Founder · Lagos, Nigeria</p>
            <p className="mt-4 max-w-xl text-steel">
              Trust services can&apos;t be anonymous. GlobalSource Africa is run by
              real people, in-country, who put their name to every report. When we
              tell you a supplier checks out, we&apos;ve stood in front of it.
            </p>
            <Link href="/about" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-container hover:gap-2.5">
              About us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 8 · RESOURCES TEASER */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex items-end justify-between">
            <div>
              <MonoLabel className="text-steel">RESOURCES</MonoLabel>
              <h2 className="gsa-heading mt-3 text-3xl font-bold text-navy sm:text-4xl">
                Buyer guides from the ground
              </h2>
            </div>
            <Link href="/resources" className="hidden text-sm font-semibold text-container hover:underline sm:block">
              All resources →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {ARTICLES.map((a) => (
              <Link key={a.slug} href={`/resources/${a.slug}`} className="group rounded-xl border border-steel/20 bg-white p-6 transition-colors hover:border-container">
                <MonoLabel className="text-steel">GUIDE</MonoLabel>
                <h3 className="gsa-heading mt-3 text-lg font-bold leading-snug text-navy group-hover:text-container">
                  {a.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9 · CTA BAND — container lands on the waiting trailer (PRD §4.3) */}
      <LandingCTA />
    </>
  );
}
