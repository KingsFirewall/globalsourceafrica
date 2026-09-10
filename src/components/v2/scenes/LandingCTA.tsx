import Link from "next/link";
import { MonoLabel } from "../MonoLabel";
import { SceneImg } from "./SceneImg";

// Closing CTA band. The animated crane/flatbed set piece was replaced by a
// single still image (drop it at /public/scenes/landing.webp) per request —
// simpler and photoreal. Just copy + a static hero image, no scroll animation.
export function LandingCTA() {
  return (
    <section className="gsa-corrugation overflow-hidden bg-navy text-white">
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-14 text-center sm:pt-16">
        <MonoLabel className="text-gold">THE DEAL, DELIVERED</MonoLabel>
        <h2 className="gsa-heading mx-auto mt-4 max-w-3xl text-3xl font-extrabold sm:text-4xl lg:text-5xl">
          Ready to source from Africa without the risk?
        </h2>

        <div className="mt-8">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/services/verification"
              className="rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90"
            >
              Verify a Supplier — from $400
            </Link>
            <Link
              href="/request"
              className="rounded-full border border-white/25 px-6 py-3 font-semibold text-white hover:bg-white/5"
            >
              Talk to a Sourcing Specialist
            </Link>
          </div>
          <MonoLabel as="p" className="mt-5 text-center text-white/50">
            RESPONSE WITHIN 48 HOURS · 5 AFRICAN ORIGINS
          </MonoLabel>
        </div>

        {/* Static closing image — no card chrome: a soft elliptical mask
            feathers every edge into the navy section so the photo's sky
            dissolves into the background instead of sitting in a framed card.
            Centre biased toward the truck so it stays fully opaque while the
            outer sky/ground melt away. */}
        <div className="mx-auto mt-8 w-full max-w-5xl">
          <SceneImg
            src="/scenes/landing.webp"
            alt="GlobalSource Africa branded truck at the container yard"
            className="mx-auto h-auto w-full"
            style={{
              maskImage:
                "radial-gradient(78% 82% at 52% 58%, #000 52%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "radial-gradient(78% 82% at 52% 58%, #000 52%, rgba(0,0,0,0) 100%)",
            }}
            label="MISSING: /public/scenes/landing.webp"
          />
        </div>
      </div>
    </section>
  );
}
