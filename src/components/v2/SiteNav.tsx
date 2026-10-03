"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/origins", label: "Origins" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Admin / auth keep their own chrome; /inquiry share links are deliberately bare.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth") || pathname?.startsWith("/inquiry")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-steel/15 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/main_logo.png" alt="GlobalSource Africa" className="h-9 w-auto" />
            {/* Stacked lockup — "AFRICA" sits under the wordmark so the header
                stays narrow instead of running the brand out in one long line */}
            <span className="flex flex-col leading-none">
              <span className="gsa-heading text-lg font-extrabold uppercase tracking-tight text-navy">
                GlobalSource
              </span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.3em] text-container">
                Africa
              </span>
            </span>
          </Link>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname?.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-container" : "text-navy/70 hover:text-navy"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/services/verification"
            className="text-sm font-medium text-navy/70 hover:text-navy"
          >
            Verify a Supplier
          </Link>
          <Link
            href="/request"
            className="rounded-full bg-container px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-container/90"
          >
            Request Sourcing
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-navy md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-steel/15 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy/80 hover:bg-paper"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/services/verification"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy/80 hover:bg-paper"
            >
              Verify a Supplier
            </Link>
            <Link
              href="/request"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-container px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Request Sourcing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
