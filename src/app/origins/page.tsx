import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { BackToHome } from "@/components/v2/BackToHome";
import { ORIGINS } from "@/lib/v2/origins";

export const metadata: Metadata = {
  title: "Origins — GlobalSource Africa",
  description:
    "Five origins with people on the ground: Nigeria, Ghana, Egypt, Ethiopia and Tanzania — coffee, cocoa, cashew, sesame, shea, herbs and spices.",
};

export default function OriginsPage() {
  return (
    <>
      <section className="gsa-corrugation bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <BackToHome />
          <MonoLabel className="text-container">ORIGINS</MonoLabel>
          <h1 className="gsa-heading mt-3 text-4xl font-extrabold sm:text-5xl">
            Where we&apos;re on the ground
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            Five origins, each with our own people in-country — not agents on the
            end of a phone. We name the regions and the licensing bodies we check,
            so you can hold us to it.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ORIGINS.map((o) => (
              <div key={o.slug} className="flex flex-col rounded-xl border border-container bg-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-container" />
                    <h2 className="gsa-heading text-xl font-bold text-navy">{o.name}</h2>
                  </div>
                  <span className="rounded-full bg-cleared/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cleared">
                    Live
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-steel">{o.blurb}</p>
                <ul className="mt-4 space-y-1.5 font-mono text-xs uppercase tracking-wide text-navy/70">
                  {o.regions.map((r) => (
                    <li key={r.name}>
                      · {r.name} — {r.note}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/origins/${o.slug}`}
                  className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-container hover:gap-2.5"
                >
                  What we verify in {o.name} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
