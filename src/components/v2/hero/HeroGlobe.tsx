"use client";

import { useEffect, useRef } from "react";
import { geoEquirectangular, geoInterpolate, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";

// ---------------------------------------------------------------------------
// Hero globe — a halftone-dot Earth held with Africa in focus, with trade lines
// arcing out of our five origins to the buyer markets. Plain 2D canvas: the
// sphere is an orthographic projection we do by hand (a few thousand dots +
// a handful of arcs per frame), so no WebGL and it runs on every phone.
//
// d3-geo is only used once, at load: to rasterise the country shapes into a
// small equirectangular mask we sample for dot positions, and to interpolate
// great-circle routes.
// ---------------------------------------------------------------------------

type LonLat = [number, number];

// A deep navy planet so the globe reads from across the room on the white hero:
// pale dots for the world, bright leaf green for Africa, gold for our origins
// and the routes. The routes also cross the white page past the limb, so the
// gold is kept deep enough to hold there too.
const COLORS = {
  land: "214, 226, 238", // pale steel-white
  africa: "92, 199, 106", // bright leaf green
  origin: "242, 196, 64", // gold
  arc: "230, 176, 34", // route gold
  head: "255, 226, 130", // hot gold tip
  halo: "11, 34, 57", // navy — the page's own ink, so the glow stays neutral
};

// The five GSA origins (see lib/v2/origins.ts) — where every route starts.
const ORIGINS: LonLat[] = [
  [3.38, 6.52], // Lagos
  [-0.19, 5.6], // Accra
  [31.24, 30.04], // Cairo
  [38.74, 9.03], // Addis Ababa
  [39.21, -6.79], // Dar es Salaam
];
const ORIGIN_IDS = new Set(["566", "288", "818", "231", "834"]);

// Buyer markets the lines run to.
const MARKETS: LonLat[] = [
  [4.48, 51.92], // Rotterdam
  [-0.13, 51.51], // London
  [9.99, 53.55], // Hamburg
  [2.35, 48.86], // Paris
  [-74.0, 40.71], // New York
  [-79.38, 43.65], // Toronto
  [-95.37, 29.76], // Houston
  [-46.63, -23.55], // São Paulo
  [55.27, 25.2], // Dubai
  [72.88, 19.08], // Mumbai
  [103.82, 1.35], // Singapore
  [121.47, 31.23], // Shanghai
  [139.65, 35.68], // Tokyo
  [37.62, 55.75], // Moscow
];

// ISO 3166 numeric ids of African countries in world-atlas (Somaliland has no id).
const AFRICA_IDS = new Set(
  "012 024 072 108 120 132 140 148 174 178 180 204 226 231 232 262 266 270 288 324 384 404 426 430 434 450 454 466 478 480 504 508 516 562 566 624 646 678 686 690 694 706 710 716 728 729 732 748 768 788 800 818 834 854 894".split(" ")
);

// View: centred on Africa, drifting slowly either side so the Americas and
// Asia take turns rising over the limb. VIEW_LAT is the latitude we hold in the
// middle of the VISIBLE slice, not the projection's centre — see `baseLat`.
const VIEW_LON = 17;
const VIEW_LAT = 4;
const SWAY_LON = 32;
const SWAY_LAT = 5;

const DOT_STEP = 0.9; // degrees between dots
const MAX_PEAK = 0.13; // tallest an arc rises above the surface, in radii
const MAX_ARCS = 7;
const RAD = Math.PI / 180;

type Dot = { lon: number; cosLat: number; sinLat: number; kind: 0 | 1 | 2 };
type ArcSample = { lon: number; cosLat: number; sinLat: number; h: number };
type Arc = { samples: ArcSample[]; start: number; draw: number; hold: number; retract: number; to: LonLat; pinged: boolean };
type Ping = { at: LonLat; start: number };

function buildDots(countries: Feature<Geometry, { name: string }>[]): Dot[] {
  const W = 720;
  const H = 360;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const path = geoPath(geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]), ctx);

  // Paint each country in a pure channel: red = rest of world, green = Africa,
  // blue = one of our origins. Borders anti-alias, so we read the max channel.
  for (const f of countries) {
    const id = String(f.id ?? "");
    ctx.fillStyle = ORIGIN_IDS.has(id)
      ? "#0000ff"
      : AFRICA_IDS.has(id) || f.properties?.name === "Somaliland"
        ? "#00ff00"
        : "#ff0000";
    ctx.beginPath();
    path(f);
    ctx.fill();
  }
  const px = ctx.getImageData(0, 0, W, H).data;

  const dots: Dot[] = [];
  for (let lat = -84; lat <= 84; lat += DOT_STEP) {
    const cosLat = Math.cos(lat * RAD);
    const step = DOT_STEP / Math.max(cosLat, 0.15);
    // offset alternate rows for a honeycomb rather than a grid
    const offset = (Math.round(lat / DOT_STEP) % 2) * step * 0.5;
    for (let lon = -180 + offset; lon < 180; lon += step) {
      const x = Math.floor(((lon + 180) / 360) * W);
      const y = Math.floor(((90 - lat) / 180) * H);
      const i = (y * W + x) * 4;
      const r = px[i];
      const g = px[i + 1];
      const b = px[i + 2];
      const m = Math.max(r, g, b);
      if (m < 128) continue;
      dots.push({ lon: lon * RAD, cosLat, sinLat: Math.sin(lat * RAD), kind: m === b ? 2 : m === g ? 1 : 0 });
    }
  }
  return dots;
}

function makeArc(now: number): Arc {
  const from = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
  const to = MARKETS[Math.floor(Math.random() * MARKETS.length)];
  const interp = geoInterpolate(from, to);
  const dist = Math.acos(
    Math.sin(from[1] * RAD) * Math.sin(to[1] * RAD) +
      Math.cos(from[1] * RAD) * Math.cos(to[1] * RAD) * Math.cos((to[0] - from[0]) * RAD)
  );
  // Capped at MAX_PEAK: the layout reserves exactly that much clear sky above
  // the dome, so no route can ever be clipped by the copy above.
  const peak = Math.min(MAX_PEAK, Math.max(0.04, dist * 0.11));
  const N = 64;
  const samples: ArcSample[] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const [lon, lat] = interp(s);
    samples.push({ lon: lon * RAD, cosLat: Math.cos(lat * RAD), sinLat: Math.sin(lat * RAD), h: peak * Math.sin(Math.PI * s) });
  }
  return {
    samples,
    start: now,
    draw: 1.4 + dist * 1.3,
    hold: 0.5,
    retract: 0.9 + dist * 0.6,
    to,
    pinged: false,
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function HeroGlobe({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let disposed = false;
    const arcs: Arc[] = [];
    const pings: Ping[] = [];
    let nextSpawn = 0;

    // drag-to-spin: the offset springs back so Africa always returns to centre
    let dragging = false;
    let lastX = 0;
    let dragLon = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = r.width;
      height = r.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (reduced) frame(performance.now());
    };

    const frame = (nowMs: number) => {
      const now = nowMs / 1000;
      if (!width || !dots.length) return;

      // A planet rising out of the section below: everything under the hero's
      // floor is simply not drawn — the next section covers it.
      //
      // Two things have to hold at once, and they pull against each other:
      //   · CLEAR SKY. The tallest an arc can reach is cy - R(1 + MAX_PEAK), and
      //     that has to stay inside the canvas, or routes get chopped off by the
      //     copy above. `head` reserves exactly that much room over the dome.
      //   · SIDE MARGINS. At the cut line the sphere should span the page but
      //     stop short of the edges, so it reads as sitting on the page rather
      //     than bleeding off it.
      // A smaller sphere sits higher and satisfies the first while failing the
      // second, so rather than pick one radius and hope, start at the smallest
      // sensible sphere and grow it until the chord reaches that target width.
      // The widest point ON SCREEN is the cut-line chord when the sphere's
      // equator falls below the hero floor, and the full radius when it doesn't
      // (short bands on phones) — measuring only the chord let the globe run off
      // the sides there. Grow the sphere while that stays inside the margins.
      const cx = width / 2;
      const gutter = Math.min(width * 0.07, 120);
      const halfSpan = width / 2 - gutter;
      const visibleHalf = (r: number) => {
        const d = r * (1 + MAX_PEAK) + 44 - height; // centre-to-cut distance
        return d >= 0 ? Math.sqrt(Math.max(0, r * r - d * d)) : r;
      };
      let R = halfSpan * 0.5;
      for (let i = 0; i < 80 && visibleHalf(R * 1.02) <= halfSpan; i++) R *= 1.02;
      const cy = R * (1 + MAX_PEAK) + 44;

      const t = reduced ? 0 : now;
      // Only a slice of the sphere is on screen, so the view latitude is DERIVED
      // rather than fixed: tilt the globe by however much it takes to land
      // Africa in the middle of that slice, whatever the crop turns out to be.
      const midY = Math.max(-0.98, Math.min(0.98, (cy - height / 2) / R));
      const baseLat = VIEW_LAT - (Math.asin(midY) * 180) / Math.PI;
      const lon0 = (VIEW_LON + SWAY_LON * Math.sin((t * 2 * Math.PI) / 50) - dragLon) * RAD;
      const lat0 = (baseLat + SWAY_LAT * Math.sin((t * 2 * Math.PI) / 33)) * RAD;
      const sinLat0 = Math.sin(lat0);
      const cosLat0 = Math.cos(lat0);
      if (!dragging) dragLon *= 0.97;

      // Orthographic: rotate the point so (lon0, lat0) faces the viewer.
      // Returns screen x, y and depth z (z > 0 is the near hemisphere).
      const out = { x: 0, y: 0, z: 0 };
      const project = (lon: number, cosLat: number, sinLat: number, h = 0) => {
        const l = lon - lon0;
        const X = cosLat * Math.sin(l);
        const Z0 = cosLat * Math.cos(l);
        const Y = sinLat * cosLat0 - Z0 * sinLat0;
        const Z = sinLat * sinLat0 + Z0 * cosLat0;
        const k = R * (1 + h);
        out.x = cx + X * k;
        out.y = cy - Y * k;
        out.z = Z;
        // hidden only when behind the globe AND inside its silhouette
        return Z > 0 || (X * X + Y * Y) * (1 + h) * (1 + h) > 1;
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Neutral atmosphere: a breath of the hero's own navy, never a colour of
      // its own — a tinted halo made the white around the globe look like a
      // different white from the rest of the page.
      const halo = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.16);
      halo.addColorStop(0, `rgba(${COLORS.halo}, 0.12)`);
      halo.addColorStop(1, `rgba(${COLORS.halo}, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      // sphere body — deep navy ocean, lit from the upper left
      const body = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.45, R * 0.05, cx, cy, R);
      body.addColorStop(0, "#2a5b86");
      body.addColorStop(0.45, "#12365a");
      body.addColorStop(0.85, "#0b2239");
      body.addColorStop(1, "#06172a");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      // faint graticule for structure (front hemisphere only)
      ctx.strokeStyle = "rgba(214, 226, 238, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const traceLine = (pts: [number, number][]) => {
        let pen = false;
        for (const [lo, la] of pts) {
          project(lo * RAD, Math.cos(la * RAD), Math.sin(la * RAD));
          if (out.z <= 0) { pen = false; continue; }
          if (pen) ctx.lineTo(out.x, out.y);
          else ctx.moveTo(out.x, out.y);
          pen = true;
        }
      };
      for (let lo = -180; lo < 180; lo += 20) {
        const m: [number, number][] = [];
        for (let la = -80; la <= 80; la += 5) m.push([lo, la]);
        traceLine(m);
      }
      for (let la = -60; la <= 60; la += 20) {
        const p: [number, number][] = [];
        for (let lo = -180; lo <= 180; lo += 5) p.push([lo, la]);
        traceLine(p);
      }
      ctx.stroke();

      // land dots, bucketed by kind and depth so each bucket is a single fill
      const BANDS = 4;
      const buckets: number[][] = Array.from({ length: 3 * BANDS }, () => []);
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        project(d.lon, d.cosLat, d.sinLat);
        if (out.z <= 0.02) continue;
        const band = Math.min(BANDS - 1, Math.floor(out.z * BANDS));
        buckets[d.kind * BANDS + band].push(out.x, out.y);
      }
      const dotBase = Math.max(1.3, Math.min(R / 170, 5));
      const kinds = [COLORS.land, COLORS.africa, COLORS.origin];
      const alphas = [
        [0.18, 0.32, 0.46, 0.58],
        [0.45, 0.7, 0.9, 1],
        [0.38, 0.56, 0.72, 0.82],
      ];
      for (let k = 0; k < 3; k++) {
        const size = k === 0 ? dotBase : dotBase * 1.15;
        for (let b = 0; b < BANDS; b++) {
          const pts = buckets[k * BANDS + b];
          if (!pts.length) continue;
          const s = size * (0.6 + 0.4 * ((b + 1) / BANDS));
          ctx.fillStyle = `rgba(${kinds[k]}, ${alphas[k][b]})`;
          ctx.beginPath();
          for (let j = 0; j < pts.length; j += 2) ctx.rect(pts[j] - s / 2, pts[j + 1] - s / 2, s, s);
          ctx.fill();
        }
      }

      // rim light — a cool pale edge that lifts the planet off the page
      const rim = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R);
      rim.addColorStop(0, `rgba(${COLORS.land}, 0)`);
      rim.addColorStop(1, `rgba(${COLORS.land}, 0.16)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // spawn / retire arcs
      if (reduced) {
        if (!arcs.length) {
          for (let i = 0; i < MAX_ARCS; i++) {
            const a = makeArc(0);
            a.start = -a.draw; // fully drawn, frozen
            arcs.push(a);
          }
        }
      } else {
        for (let i = arcs.length - 1; i >= 0; i--) {
          const a = arcs[i];
          if (now - a.start > a.draw + a.hold + a.retract) arcs.splice(i, 1);
        }
        if (arcs.length < MAX_ARCS && now >= nextSpawn) {
          arcs.push(makeArc(now));
          nextSpawn = now + 0.35 + Math.random() * 0.6;
        }
      }

      // arcs: faint full route, then a bright trail from tail to head
      ctx.lineCap = "round";
      // Route weight is capped: R is huge on wide screens (the sphere overflows
      // the viewport), and a width that tracked it would draw ropes, not routes.
      const lineW = Math.max(1.5, Math.min(R / 260, 3.4));
      for (const a of arcs) {
        const el = reduced ? a.draw : now - a.start;
        const head = easeInOut(Math.min(1, el / a.draw));
        const tail = reduced ? 0 : easeInOut(Math.max(0, Math.min(1, (el - a.draw - a.hold) / a.retract)));
        const N = a.samples.length - 1;
        const pts: { x: number; y: number; vis: boolean }[] = a.samples.map((s) => {
          const vis = project(s.lon, s.cosLat, s.sinLat, s.h);
          return { x: out.x, y: out.y, vis };
        });

        ctx.lineWidth = lineW * 0.6;
        ctx.strokeStyle = `rgba(${COLORS.arc}, ${0.22 * (1 - tail)})`;
        ctx.beginPath();
        let pen = false;
        for (const p of pts) {
          if (!p.vis) { pen = false; continue; }
          if (pen) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
          pen = true;
        }
        ctx.stroke();

        const i0 = Math.floor(tail * N);
        const i1 = Math.ceil(head * N);
        for (let i = i0; i < i1; i++) {
          const p = pts[i];
          const q = pts[i + 1];
          if (!p.vis || !q.vis) continue;
          const f = Math.max(0, (i / N - tail) / Math.max(head - tail, 1e-3));
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          // wide soft glow under a crisp core
          ctx.lineWidth = lineW * 3.2;
          ctx.strokeStyle = `rgba(${COLORS.arc}, ${0.12 * f})`;
          ctx.stroke();
          ctx.lineWidth = lineW;
          ctx.strokeStyle = `rgba(${COLORS.arc}, ${0.3 + 0.7 * f})`;
          ctx.stroke();
        }

        // glowing head while the line is still travelling
        if (head < 1) {
          const hp = pts[Math.min(N, Math.round(head * N))];
          if (hp.vis) {
            const g = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, lineW * 7);
            g.addColorStop(0, "rgba(255, 255, 255, 1)");
            g.addColorStop(0.2, `rgba(${COLORS.head}, 0.95)`);
            g.addColorStop(0.5, `rgba(${COLORS.arc}, 0.35)`);
            g.addColorStop(1, `rgba(${COLORS.arc}, 0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, lineW * 7, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (!a.pinged) {
          a.pinged = true;
          if (!reduced) pings.push({ at: a.to, start: now });
        }
      }

      // arrival pings at the markets
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        const k = (now - p.start) / 1.4;
        if (k >= 1) { pings.splice(i, 1); continue; }
        if (!project(p.at[0] * RAD, Math.cos(p.at[1] * RAD), Math.sin(p.at[1] * RAD)) || out.z <= 0) continue;
        ctx.strokeStyle = `rgba(${COLORS.head}, ${0.9 * (1 - k)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 2 + k * Math.min(R * 0.09, 34), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - k})`;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // origins: steady gold beacons with a breathing ring
      for (let i = 0; i < ORIGINS.length; i++) {
        const [lon, lat] = ORIGINS[i];
        project(lon * RAD, Math.cos(lat * RAD), Math.sin(lat * RAD));
        if (out.z <= 0) continue;
        const k = reduced ? 0.5 : ((now * 0.6 + i * 0.37) % 1);
        ctx.strokeStyle = `rgba(${COLORS.origin}, ${0.9 * (1 - k)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(out.x, out.y, 3 + k * Math.min(R * 0.08, 30), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgb(${COLORS.origin})`;
        ctx.beginPath();
        ctx.arc(out.x, out.y, Math.max(2.5, Math.min(R / 150, 6)), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const loop = (ms: number) => {
      frame(ms);
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (!reduced && !raf && visible && !document.hidden && dots.length) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // Only animate while the hero is on screen.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      start();
    });
    io.observe(wrap);
    const onVisibility = () => start();
    document.addEventListener("visibilitychange", onVisibility);

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      dragLon += (e.clientX - lastX) * 0.35;
      dragLon = Math.max(-120, Math.min(120, dragLon));
      lastX = e.clientX;
      if (reduced) frame(performance.now());
    };
    const onUp = () => { dragging = false; };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    import("world-atlas/countries-110m.json").then((mod) => {
      if (disposed) return;
      const topo = mod.default as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
      const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;
      dots = buildDots(fc.features);
      frame(performance.now());
      wrap.style.opacity = "1";
      start();
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={`relative select-none opacity-0 transition-opacity duration-1000 ${className}`}
    >
      {/* touch-action pan-y: horizontal drags spin the globe, vertical still scrolls the page */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing" />
    </div>
  );
}
