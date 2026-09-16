import Link from "next/link";
import { MonoLabel } from "../MonoLabel";
import { CraneDrop } from "./CraneDrop";

// Closing CTA band: copy and buttons, then the crane set piece welded to the
// foot of the page — a container lowered onto a waiting trailer, paid out by
// the reader's own scrolling.
export function LandingCTA() {
  return (
    <section className="gsa-corrugation overflow-hidden bg-navy text-white">
      {/* Tight padding on purpose: the copy and the scene below are pinned
          together and have to fit one screen, so every pixel the copy gives
          back is a bigger truck. */}
      <div className="mx-auto max-w-5xl px-4 pb-5 pt-9 text-center sm:pt-11">
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

      </div>

      {/* Closing set piece, full-bleed under the copy: the gantry lowers a
          container onto the waiting trailer as you scroll out the page. */}
      <CraneDrop />
    </section>
  );
}
