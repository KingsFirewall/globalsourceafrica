"use client";

import { useState } from "react";
import { User } from "lucide-react";

// Fade the bottom edge to transparent so the photo dissolves into the page
// instead of ending on a hard rectangle — smooth and subtle, and it blends
// with whatever background sits behind it (the cream CEO card).
const FADE_MASK =
  "linear-gradient(to bottom, #000 0%, #000 74%, rgba(0,0,0,0.45) 89%, transparent 100%)";

// Shows /ceo.jpg if present; falls back to a placeholder avatar if the file
// hasn't been added yet, so the About page never shows a broken image.
export function CeoPhoto({ src = "/ceo.jpg" }: { src?: string }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-greenSoft">
        <User className="h-16 w-16 text-green" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Kingsley Israel, CEO of GlobalSource Africa"
      onError={() => setBroken(true)}
      className="aspect-[4/3] w-full rounded-2xl object-cover object-top"
      style={{ WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK }}
    />
  );
}
