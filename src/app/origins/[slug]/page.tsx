import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { BackToHome } from "@/components/v2/BackToHome";
import { ORIGINS, getOrigin } from "@/lib/v2/origins";

export function generateStaticParams() {
  return ORIGINS.map((o) => ({ slug: o.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const o = getOrigin(params.slug);
  if (!o) return { title: "Origins — GlobalSource Africa" };
  return {
    title: `${o.name} — GlobalSource Africa`,
    description: `What we verify in ${o.name}: ${o.headline.toLowerCase()}. Registry checks, export licensing, site visits and inspection coordination.`,
  };
}

export default function OriginPage({ params }: { params: { slug: string } }) {
  const origin = getOrigin(params.slug);
  if (!origin) notFound();

  return (
    <>
      <section className="gsa-corrugation bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <BackToHome />
          <MonoLabel className="text-container">{origin.code}</MonoLabel>
          <h1 className="gsa-heading mt-3 text-4xl font-extrabold sm:text-5xl">
            {origin.tagline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">{origin.intro}</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <MonoLabel className="text-steel">PRODUCT FAMILIES</MonoLabel>
              <ul className="mt-4 space-y-2">
                {origin.products.map((p) => (
                  <li key={p} className="flex gap-2.5 text-navy/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cleared" /> {p}
                  </li>
                ))}
              </ul>
              <MonoLabel className="mt-8 text-steel">REGIONS</MonoLabel>
              <ul className="mt-4 space-y-2 font-mono text-sm uppercase tracking-wide text-navy/70">
                {origin.regions.map((r) => (
                  <li key={r.name}>
                    · {r.name} — {r.note}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <MonoLabel className="text-steel">WHAT WE VERIFY</MonoLabel>
              <ul className="mt-4 space-y-2">
                {origin.verify.map((v) => (
                  <li key={v} className="flex gap-2.5 text-navy/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-cleared" /> {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cross-links to the other origins, so a buyer comparing markets never
              hits a dead end on a country page. */}
          <div className="mt-14 border-t border-steel/15 pt-8">
            <MonoLabel className="text-steel">OTHER ORIGINS</MonoLabel>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {ORIGINS.filter((o) => o.slug !== origin.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/origins/${o.slug}`}
                  className="rounded-full border border-steel/25 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-container hover:text-container"
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-navy p-8 text-center text-white">
            <h2 className="gsa-heading text-2xl font-bold">Buying from {origin.name}?</h2>
            <p className="mx-auto mt-2 max-w-md text-white/70">
              Verify a supplier or ask us to source for you.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/services/verification" className="rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90">
                Verify a Supplier
              </Link>
              <Link href="/request" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 font-semibold text-white hover:bg-white/5">
                Request Sourcing <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
