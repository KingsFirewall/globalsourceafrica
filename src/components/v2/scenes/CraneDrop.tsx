"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Crane drop — as you scroll the last stretch of the page, a truck rolls in and
// a slim gantry frame STANDING BEHIND IT lowers a GSA container onto the empty
// bed. Four flat plates (yard, crane, container, trailer) plus cables drawn in
// code, because the cables have to GROW: baking them into the crane art would
// stretch them, and a stretched steel rope reads as rubber.
//
// GEOMETRY. Every number below is measured off the trimmed artwork in
// public/scenes, as a fraction of that asset's own width or height. The scene
// is then built around ONE anchor — the winch on the beam — so the container
// hangs true and lands dead on the deck at every viewport size, instead of
// being nudged into place per breakpoint. Re-measure if the art is regenerated:
//   trim to the alpha bounding box first, then read off the feature positions.
//
// Standing the frame BEHIND the truck is what keeps the truck the hero, and it
// also frees the sizing: nothing has to pass between the legs any more, so the
// frame can be narrower than the container and the truck is sized on its own
// terms. The trailer covers the feet of the legs, exactly as sketched.
// ---------------------------------------------------------------------------
const CRANE = {
  ratio: 1277 / 1042, // height / width — slim two-leg lifting frame
  winchX: 0.5, // hoist winch, x — dead centre of the beam
  cableY: 0.1245, // beam underside, y — where the ropes emerge
};
const CONTAINER = {
  ratio: 529 / 2009,
  lugL: 0.0562, // spreader lifting lugs, x — where the cables land
  lugR: 0.9428,
};
// The blank white decal panel painted on the container's side, as fractions of
// the container plate. The GSA mark is laid into exactly this rectangle.
const PANEL = { l: 0.3064, r: 0.7, t: 0.3828, b: 0.8172 };
const TRAILER = {
  ratio: 560 / 1934,
  deckY: 0.6214, // deck surface, y — the container's resting height
  deckR: 0.7606, // deck length as a fraction of the whole vehicle
};

// The scene is pinned while the container comes down, so it has to fit the
// viewport: this is the share of the window height it may occupy.
const SCENE_OF_VIEWPORT = 0.84;
// Truck width as a share of the page. The WHOLE vehicle is centred in the page
// — not its bed under the hook — so the cab can never run off the edge on a
// narrow screen, which is what was cropping it on phones.
const TRUCK_OF_WIDTH = { phone: 0.92, tablet: 0.72, desktop: 0.58 };
// Frame width as a share of the container's length. Under 1 on purpose: the
// legs land inside the container's span, so they read as standing behind it.
const CRANE_OF_CONTAINER = 0.68;
// How far up the ground plane the frame's feet sit relative to the truck's
// wheels, as a share of the scene height. Further away = higher up the frame.
const CRANE_DEPTH = 0.03;

type Layout = {
  w: number;
  vh: number;
  copyH: number;
  h: number;
  cx: number;
  ground: number;
  craneW: number;
  craneH: number;
  craneX: number;
  craneBottom: number;
  trailerW: number;
  trailerH: number;
  trailerX: number;
  contW: number;
  contH: number;
  contX: number;
  trolleyY: number;
  deckSurfaceY: number;
  hStart: number;
  hRest: number;
  cableX1L: number;
  cableX1R: number;
};

function computeLayout(w: number, vh: number, copyH: number): Layout {
  const phone = w < 640;
  const tablet = !phone && w < 1024;
  const pick = <T,>(t: { phone: T; tablet: T; desktop: T }) => (phone ? t.phone : tablet ? t.tablet : t.desktop);

  // The scene takes whatever height is left once the CTA copy has had its share
  // — the two are pinned together and must fit the window between them.
  const h = Math.max(vh * 0.45, Math.min(vh * SCENE_OF_VIEWPORT, vh - copyH - 16));
  const ground = h * 0.04;

  // The truck leads: it is centred in the page and sized on its own terms.
  const trailerW = w * pick(TRUCK_OF_WIDTH);
  const trailerH = trailerW * TRAILER.ratio;
  const trailerX = (w - trailerW) / 2;
  const trailerTop = h - ground - trailerH;
  const contW = TRAILER.deckR * trailerW;
  const contH = contW * CONTAINER.ratio;
  const deckSurfaceY = trailerTop + TRAILER.deckY * trailerH;

  // THE ANCHOR: the winch, centred over the middle of the bed. The frame is
  // then hung around it, clamped so a tall frame can never outgrow the scene.
  const hangX = trailerX + (TRAILER.deckR / 2) * trailerW;
  const craneW = Math.min(contW * CRANE_OF_CONTAINER, (h * 0.9) / CRANE.ratio);
  const craneH = craneW * CRANE.ratio;
  const craneBottom = ground + h * CRANE_DEPTH; // stands further back than the truck
  const winchY = h - craneBottom - craneH + CRANE.cableY * craneH;

  return {
    w,
    vh,
    copyH,
    h,
    cx: hangX,
    ground,
    craneW,
    craneH,
    craneBottom,
    craneX: hangX - CRANE.winchX * craneW,
    trailerW,
    trailerH,
    trailerX,
    contW,
    contH,
    contX: hangX - contW / 2,
    trolleyY: winchY,
    deckSurfaceY,
    hStart: contH + h * 0.03, // hoisted: box tucked right up under the beam
    hRest: deckSurfaceY - winchY, // landed: rope reaches the deck
    // Both ropes leave the same winch drum, so they run from the pendulum's top
    // centre out to the two spreader lugs.
    cableX1L: 50,
    cableX1R: 50,
  };
}

export function CraneDrop() {
  const wrap = useRef<HTMLDivElement>(null);
  const pendulum = useRef<HTMLDivElement>(null);
  const cableL = useRef<SVGLineElement>(null);
  const cableR = useRef<SVGLineElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const truck = useRef<HTMLImageElement>(null);
  const [L, setL] = useState<Layout | null>(null);
  const panelH = L ? (PANEL.b - PANEL.t) * L.contH : 0;

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      const vh = window.innerHeight;
      // Everything in the band that ISN'T the scene — the CTA copy and buttons.
      // They are pinned along with the scene, so they eat into its height.
      const section = el.parentElement;
      const copyH = section ? Math.max(0, section.offsetHeight - el.offsetHeight) : 0;
      if (w > 0) {
        setL((prev) =>
          prev && Math.abs(prev.w - w) < 1 && Math.abs(prev.vh - vh) < 1 && Math.abs(prev.copyH - copyH) < 2
            ? prev
            : computeLayout(w, vh, copyH)
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  useEffect(() => {
    if (!L) return;

    // One writer for the whole rig, driven by a single 0→1 value.
    //
    // The scroll is spent in two acts, because this gantry is deliberately low:
    // there is only about one container-height of rope to pay out, which alone
    // would be a hop rather than a drop. So the truck ROLLS IN under the
    // hanging load first (act one), then the container comes down (act two) —
    // which is also the order it happens in a real yard.
    const DRIVE_END = 0.42;
    const DROP_START = 0.46;

    const apply = (p: number) => {
      const drive = Math.min(1, p / DRIVE_END);
      const driveEased = 1 - Math.pow(1 - drive, 3); // rolls in and eases to a stop
      if (truck.current) {
        const from = L.w - L.trailerX + L.trailerW * 0.1; // just off the right edge
        truck.current.style.transform = `translateX(${from * (1 - driveEased)}px)`;
      }

      const d = Math.max(0, (p - DROP_START) / (1 - DROP_START));
      const eased = 1 - Math.pow(1 - d, 2); // steady pay-out, gentle touchdown
      let hgt = L.hStart + (L.hRest - L.hStart) * eased;
      // touchdown bounce — the box settles onto the twistlocks
      if (d > 0.9) hgt -= Math.sin(((d - 0.9) / 0.1) * Math.PI) * L.h * 0.012;

      // A real load swings under the trolley and the swing dies out as it is
      // paid out, so the angle is damped by how far down it has travelled.
      const sway = 2.2 * Math.pow(1 - d, 1.6) * Math.sin(p * 9);

      if (pendulum.current) {
        pendulum.current.style.height = `${hgt}px`;
        pendulum.current.style.transform = `rotate(${sway}deg)`;
      }
      const y2 = (1 - L.contH / hgt) * 100;
      cableL.current?.setAttribute("y2", String(y2));
      cableR.current?.setAttribute("y2", String(y2));

      if (shadow.current) {
        const k = Math.pow(d, 2);
        shadow.current.style.opacity = String(0.12 + 0.38 * k);
        shadow.current.style.transform = `translateX(-50%) scaleX(${0.55 + 0.45 * k})`;
      }
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(1);
      return;
    }

    const ctx = gsap.context(() => {
      const proxy = { p: 0 };
      apply(0);
      gsap.to(proxy, {
        p: 1,
        ease: "none",
        onUpdate: () => apply(proxy.p),
        scrollTrigger: {
          // Pin the whole band — copy AND scene — so the headline and buttons
          // stay on screen while the container comes down, instead of the
          // reader watching a crane under an empty strip of navy.
          trigger: wrap.current?.parentElement ?? wrap.current,
          // PINNED, and this is the whole point: the scene locks to the screen
          // the moment it is fully visible, and the container comes down over
          // the next screenful of scrolling. Without the pin the scene is still
          // sliding up while the load descends, the two cancel out, and you
          // never see the drop — only the box already sitting on the bed.
          start: "bottom bottom",
          end: `+=${Math.round(L.vh * 0.9)}`,
          pin: true,
          anticipatePin: 1,
          scrub: 0.5,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [L]);

  return (
    <div
      ref={wrap}
      aria-hidden
      className="relative w-full select-none overflow-hidden"
      style={{ height: L?.h ?? 380 }}
    >
      {/* Yard backdrop. object-bottom keeps the concrete lane on the floor of
          the scene at every aspect; the sky is faded out by the scrim below so
          the photo dissolves into the navy band instead of sitting in a box. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scenes/yard.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-bottom"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, #0B2239 0%, rgba(11,34,57,0.6) 10%, rgba(11,34,57,0.18) 24%, rgba(11,34,57,0) 38%), linear-gradient(to right, #0B2239 0%, rgba(11,34,57,0) 12%, rgba(11,34,57,0) 88%, #0B2239 100%)",
        }}
      />

      {L && (
        <>
          {/* The frame stands BEHIND the lane: drawn first, with its feet a
              little higher up the ground plane than the truck's wheels, so the
              trailer covers the bottom of the legs and it reads as depth. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scenes/crane.webp"
            alt=""
            loading="lazy"
            className="absolute"
            style={{ left: L.craneX, width: L.craneW, bottom: L.craneBottom }}
          />

          {/* Contact shadow on the deck: tightens and darkens on approach. */}
          <div
            ref={shadow}
            className="absolute rounded-[50%] bg-black/70 blur-md"
            style={{
              left: L.cx,
              top: L.deckSurfaceY - L.h * 0.006,
              width: L.contW * 0.92,
              height: L.h * 0.02,
              opacity: 0.12,
              transform: "translateX(-50%) scaleX(0.55)",
            }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={truck}
            src="/scenes/trailer.webp"
            alt=""
            loading="lazy"
            className="absolute"
            style={{ left: L.trailerX, width: L.trailerW, bottom: L.ground }}
          />

          {/* The pendulum: cables + container swing together about the trolley,
              so the wrapper's TOP edge is the pivot and its height IS the cable
              length. Growing the wrapper lowers the load. */}
          <div
            ref={pendulum}
            className="absolute origin-top"
            style={{ left: L.contX, top: L.trolleyY, width: L.contW, height: L.hStart }}
          >
            {/* preserveAspectRatio=none lets the viewBox act as percentages;
                non-scaling-stroke keeps the ropes one weight as it stretches. */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {[cableL, cableR].map((ref, i) => (
                <line
                  key={i}
                  ref={ref}
                  x1={i === 0 ? L.cableX1L : L.cableX1R}
                  y1="0"
                  x2={(i === 0 ? CONTAINER.lugL : CONTAINER.lugR) * 100}
                  y2="50"
                  stroke="#1b2430"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            <div className="absolute bottom-0 left-0 w-full" style={{ height: L.contH }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/scenes/container-hang.webp" alt="" loading="lazy" className="h-full w-full" />
              {/* Real branding, laid into the blank decal panel the render left
                  for it — image generators mangle logos, so the art carries an
                  empty white rectangle and the mark goes on here, crisp. PANEL
                  is that rectangle, measured off the asset. */}
              <div
                className="absolute flex items-center"
                style={{
                  left: `${PANEL.l * 100}%`,
                  top: `${PANEL.t * 100}%`,
                  width: `${(PANEL.r - PANEL.l) * 100}%`,
                  height: `${(PANEL.b - PANEL.t) * 100}%`,
                  gap: panelH * 0.1,
                  paddingLeft: panelH * 0.12,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/scenes/logo_mark.png"
                  alt=""
                  loading="lazy"
                  style={{ height: panelH * 0.62, width: "auto" }}
                />
                <div className="leading-none">
                  <div
                    className="gsa-heading font-extrabold uppercase text-navy"
                    style={{ fontSize: panelH * 0.3, letterSpacing: "-0.02em" }}
                  >
                    GlobalSource
                  </div>
                  <div
                    className="font-mono uppercase text-container"
                    style={{ fontSize: panelH * 0.15, letterSpacing: "0.3em", marginTop: panelH * 0.07 }}
                  >
                    Africa
                  </div>
                </div>
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
