"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MonoLabel } from "../MonoLabel";
import { SceneImg } from "./SceneImg";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: "01", t: "Submit your request", d: "Tell us the product, quantity, destination and specs — or name a supplier you want checked." },
  { n: "02", t: "We scope and quote our fee", d: "Flat fee confirmed upfront. You know the cost before anything starts." },
  { n: "03", t: "Ground work begins", d: "Registry checks, license verification, physical or video audit, reference calls." },
  { n: "04", t: "Inspection coordinated", d: "An independent accredited inspector at sampling and loading. You never ship blind." },
  { n: "05", t: "You receive the report / verified deal", d: "A decision-ready document, or a supplier you can transact with confidently." },
];

type Spine = { x: number; y: number; len: number; horizontal: boolean };

// How It Works — a scroll-driven progress spine "powers up" each step 01→05 as you
// read through, then a REAL truck drives across the section. PRD §4.2.
//
// Two things here are load-bearing and worth stating, because the obvious
// implementations of each are wrong for this layout:
//
// 1. ONE scrubbed trigger drives both the spine and the step activation, rather
//    than a trigger per step. On lg the steps are a horizontal row (grid-cols-5),
//    so all five circles share the same Y and would cross the viewport centre on
//    the same frame — per-step position triggers cannot sequence them. Mapping
//    section progress → active index sequences correctly in BOTH layouts, and
//    scrub makes the whole thing reverse on scroll-up for free.
//
// 2. The spine's geometry is MEASURED from the circles rather than hardcoded, and
//    its orientation is inferred from that measurement (same Y ⇒ horizontal row).
//    So it spans exactly first-circle-centre → last-circle-centre and genuinely
//    lands on each number, instead of overshooting to the container's edges.
export function CraneSection() {
  const section = useRef<HTMLElement>(null);
  const steps = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const truckWrap = useRef<HTMLDivElement>(null);
  const circles = useRef<(HTMLSpanElement | null)[]>([]);

  const [spine, setSpine] = useState<Spine | null>(null);

  // -1 = nothing powered up yet (resting). Reduced motion never leaves this state.
  const [active, setActive] = useState(-1);
  const activeRef = useRef(-1);

  useLayoutEffect(() => {
    const box = steps.current;
    if (!box) return;

    const measure = () => {
      const first = circles.current[0];
      const last = circles.current[STEPS.length - 1];
      if (!first || !last) return;

      const b = box.getBoundingClientRect();
      const f = first.getBoundingClientRect();
      const l = last.getBoundingClientRect();

      const fx = f.left + f.width / 2 - b.left;
      const fy = f.top + f.height / 2 - b.top;
      const lx = l.left + l.width / 2 - b.left;
      const ly = l.top + l.height / 2 - b.top;

      // A row puts every circle on the same baseline; a stack spreads them down.
      const isRow = Math.abs(ly - fy) < 4;
      setSpine((prev) =>
        prev && prev.x === fx && prev.y === fy && prev.horizontal === isRow && prev.len === (isRow ? lx - fx : ly - fy)
          ? prev // no-op: keeps the ResizeObserver from looping on identical geometry
          : { x: fx, y: fy, len: isRow ? lx - fx : ly - fy, horizontal: isRow }
      );
      ScrollTrigger.refresh();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  // Step reveals + truck. Mount-once; independent of the spine's geometry.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".gsa-step").forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: `top ${92 - i * 2}%` },
        });
      });

      // The user drives the truck across by scrolling (scrubbed).
      gsap.fromTo(
        truckWrap.current,
        { xPercent: -120 },
        {
          xPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: truckWrap.current,
            start: "top 92%",
            end: "top 40%",
            scrub: 1,
          },
        }
      );
    }, section);
    return () => ctx.revert();
  }, []);

  // The progress spine. Keyed on the measured geometry: the spine element does not
  // exist until measure() has run, so building the quickSetter on mount would bind
  // it to a null ref. Re-running on re-measure also rebuilds the trigger against
  // the new orientation when the layout crosses the lg breakpoint.
  const isRow = spine?.horizontal;
  useEffect(() => {
    if (isRow === undefined) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Transform-only write, hoisted out of the scroll callback.
      const setFill = gsap.quickSetter(fill.current, isRow ? "scaleX" : "scaleY");

      ScrollTrigger.create({
        trigger: steps.current,
        // Deliberately generous range. On lg the steps are a short horizontal row
        // (~230px), so a tight range would burn all five activations in ~390px of
        // scroll — roughly 78px per step, far too fast to actually guide the eye.
        // Anchoring to 85% → 25% of the viewport stretches the read to ~770px
        // (~155px per step) on desktop and ~1200px on the taller stacked layout.
        start: "top 85%",
        end: "bottom 25%",
        scrub: true,
        // Only fires while the block is in range, so this is inherently idle — no
        // callback and no layout reads — once the section leaves the viewport.
        onUpdate: (self) => {
          const p = self.progress;
          setFill(p);

          // The step the spine has reached. Guarded so we re-render only on the 5
          // frames where the index actually changes, not on every scroll tick.
          const i = p <= 0 ? -1 : Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
          if (i !== activeRef.current) {
            activeRef.current = i;
            setActive(i);
          }
        },
      });
    }, section);
    return () => ctx.revert();
  }, [isRow]);

  return (
    <section ref={section} className="overflow-hidden bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="text-center">
          <MonoLabel className="text-container">HOW IT WORKS</MonoLabel>
          <h2 className="gsa-heading mt-3 text-3xl font-bold text-navy sm:text-4xl">
            From request to verified deal
          </h2>
        </div>

        {/* Steps + progress spine.
            Stacked in ONE column below lg (was 2-up): a 2-column grid gives a
            vertical spine no single axis to run down, and the guided read only
            works if 01→05 is a straight line. lg keeps the 5-across row. */}
        <div ref={steps} className="relative mt-12">
          {spine && (
            <div
              aria-hidden
              className="absolute rounded-full bg-steel/20"
              style={{
                left: spine.horizontal ? spine.x : spine.x - 1,
                top: spine.horizontal ? spine.y - 1 : spine.y,
                width: spine.horizontal ? spine.len : 2,
                height: spine.horizontal ? 2 : spine.len,
              }}
            >
              {/* Filled portion. Starts at 0 and is scrubbed to 1; under
                  reduced-motion the scrub never runs, so the utility below paints
                  it as a plain solid connector instead of leaving an empty track. */}
              <div
                ref={fill}
                className={`h-full w-full rounded-full bg-brand ${
                  spine.horizontal
                    ? "origin-left scale-x-0 motion-reduce:scale-x-100"
                    : "origin-top scale-y-0 motion-reduce:scale-y-100"
                }`}
              />
            </div>
          )}

          {/* The number circle is deliberately OUTSIDE the white card — a row to the
              left when stacked, above the card on lg. If the circle stayed inside,
              the opaque card would occlude the rail behind it and the spine would
              only be visible in the gaps between cards. Lifting the circle out puts
              it ON the rail, which is the whole point: the line visibly reaches and
              powers up each number in turn. */}
          <ol className="grid gap-6 lg:grid-cols-5">
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <li key={s.n} className="gsa-step relative flex gap-5 lg:block">
                  <span
                    ref={(el) => {
                      circles.current[i] = el;
                    }}
                    data-active={on}
                    className="gsa-heading relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-sm font-bold text-container shadow-[inset_0_0_0_2px_rgba(27,107,63,0.25)] ring-4 ring-paper transition-[background-color,color,box-shadow] duration-500 ease-out data-[active=true]:bg-brand data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_2px_rgba(201,162,39,0.75),0_0_0_6px_rgba(201,162,39,0.16)]"
                  >
                    {s.n}
                  </span>

                  <div
                    data-active={on}
                    className="relative flex-1 overflow-hidden rounded-xl border border-steel/20 bg-white p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-500 ease-out data-[active=true]:scale-[1.02] data-[active=true]:border-steel/30 data-[active=true]:shadow-xl motion-reduce:transform-none motion-reduce:transition-none lg:mt-4"
                  >
                    {/* Gold "you are here" accent. Y-scale only, so activation stays
                        transform-only. */}
                    <span
                      aria-hidden
                      data-active={on}
                      className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-gold transition-transform duration-500 ease-out data-[active=true]:scale-y-100 motion-reduce:hidden"
                    />
                    <h3 className="text-sm font-semibold text-navy">{s.t}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-steel">{s.d}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Real truck drives across on scroll */}
        <div className="relative mt-10 h-32 sm:h-44">
          <div ref={truckWrap} className="absolute bottom-6 left-0 w-[70%] max-w-xl sm:w-[52%]">
            <SceneImg
              src="/scenes/truck.webp"
              alt="GlobalSource Africa container truck"
              className="h-auto w-full drop-shadow-xl"
              label="MISSING: /public/scenes/truck.webp"
            />
          </div>
          {/* road */}
          <div className="absolute bottom-4 left-0 right-0 h-0.5 bg-steel/25" />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-container hover:gap-2.5"
          >
            See the full process <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
