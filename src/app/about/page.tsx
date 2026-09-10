import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { BackToHome } from "@/components/v2/BackToHome";

export const metadata: Metadata = {
  title: "About — GlobalSource Africa",
  description:
    "Who's on the ground, and where. GlobalSource Africa is a sourcing and verification service run by real people, in-country, who put their name to every report.",
};

export default function AboutPage() {
  return (
    <>
      <section className="gsa-corrugation bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <BackToHome />
          <MonoLabel className="text-container">ABOUT</MonoLabel>
          <h1 className="gsa-heading mt-3 text-4xl font-extrabold sm:text-5xl">
            Trust services can&apos;t be anonymous
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            GlobalSource Africa is a sourcing and verification service. We never
            hold inventory and we never take title. We sell trust and ground
            presence — your professional eyes and hands in Africa.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-steel/20 bg-paper p-6">
              <h2 className="gsa-heading text-lg font-bold text-navy">Why we exist</h2>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                International buyers get burned by fake exporters, forged
                documents and shipments that never load. We put people on the
                ground to make those risks checkable — before your money moves.
              </p>
            </div>
            <div className="rounded-2xl border border-steel/20 bg-paper p-6">
              <h2 className="gsa-heading text-lg font-bold text-navy">How we work</h2>
              <p className="mt-2 text-sm leading-relaxed text-steel">
                Flat, published fees. Registry checks, license verification,
                physical audits and accredited inspection. A decision-ready report,
                or a verified supplier you can transact with confidently.
              </p>
            </div>
          </div>

          {/* Founder */}
          <div className="mt-12 flex flex-col items-center gap-8 rounded-2xl border border-steel/20 bg-white p-8 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ceo.jpg"
              alt="Isreal Kingsley, founder of GlobalSource Africa"
              className="h-44 w-44 shrink-0 rounded-2xl object-cover object-top"
            />
            <div>
              <MonoLabel className="text-steel">WHO&apos;S ON THE GROUND</MonoLabel>
              <h2 className="gsa-heading mt-2 text-2xl font-bold text-navy">Isreal Kingsley</h2>
              <p className="font-mono text-xs uppercase tracking-wider text-steel">
                Founder · Accra / Kumasi, Ghana
              </p>
              <p className="mt-4 text-steel">
                &ldquo;When we tell you a supplier checks out, we&apos;ve stood in front
                of it. Every report carries our name — that&apos;s the whole point of a
                verification business.&rdquo;
              </p>
            </div>
          </div>

          {/* Entity */}
          <div className="mt-8 rounded-xl border border-steel/20 bg-paper p-6">
            <MonoLabel className="text-steel">ENTITY</MonoLabel>
            <p className="mt-2 text-sm text-navy/80">
              GlobalSource Africa — registered trade services entity operating across Nigeria, Ghana, Egypt, Ethiopia and Tanzania.
              <span className="font-mono text-xs uppercase tracking-wider text-steel"> · Registration details to be confirmed.</span>
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link href="/request" className="inline-flex items-center gap-2 rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90">
              Work with us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
