import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { BackToHome } from "@/components/v2/BackToHome";

export const metadata: Metadata = {
  title: "How it works — GlobalSource Africa",
  description:
    "From your request to a verified deal in five steps: submit, scope & quote, ground work, inspection, and your report or verified supplier.",
};

const STEPS = [
  { n: "01", t: "Submit your request", d: "Tell us the product, quantity, destination and specs — or name a supplier you want checked. No login, no obligation. It takes a couple of minutes." },
  { n: "02", t: "We scope and quote our fee", d: "We confirm exactly what we'll do and a flat fee, upfront. Any pass-through cost (an accredited inspector, travel to a remote region) is quoted before it's incurred. You approve before we start." },
  { n: "03", t: "Ground work begins", d: "Our people in-country run the checks: company registry and legal-entity confirmation, export licenses and permits, a physical or video site visit with dated photos, and reference and trade-history calls." },
  { n: "04", t: "Inspection coordinated", d: "Where you're buying, we engage an independent accredited inspector — the SGS / Cotecna tier — at sampling and at loading. You see the goods and the sealed container before anything sails — you never ship blind." },
  { n: "05", t: "You receive the report / verified deal", d: "A decision-ready verification report with findings, evidence, a risk rating and our recommendation — or, for sourcing, a supplier you can transact with confidently and a deal we've helped manage end to end." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="gsa-corrugation bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <BackToHome />
          <MonoLabel className="text-container">HOW IT WORKS</MonoLabel>
          <h1 className="gsa-heading mt-3 text-4xl font-extrabold sm:text-5xl">
            From request to verified deal
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            One clear process, whether you need a single supplier checked or the
            whole deal managed. You&apos;re in control at every decision point.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <ol className="space-y-10">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-5">
                <span className="gsa-heading shrink-0 font-mono text-2xl font-bold text-container">{s.n}</span>
                <div>
                  <h2 className="gsa-heading text-xl font-bold text-navy">{s.t}</h2>
                  <p className="mt-2 leading-relaxed text-steel">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-14 rounded-2xl bg-navy p-8 text-center text-white">
            <h2 className="gsa-heading text-2xl font-bold">Start with a request</h2>
            <p className="mx-auto mt-2 max-w-md text-white/70">We reply within 48 hours with scope and a flat fee.</p>
            <Link href="/request" className="mt-5 inline-flex items-center gap-2 rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90">
              Request Sourcing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
