"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MessageCircle, Linkedin } from "lucide-react";
import { MonoLabel } from "./MonoLabel";

// v2 footer — contact channels, entity line (Nigeria), and a mono
// container-plate easter egg. Hidden on admin/auth.
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;

  return (
    <footer className="gsa-corrugation border-t border-white/10 bg-navy text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/main_logo.png" alt="GlobalSource Africa" className="h-10 w-auto" />
            <span className="flex items-baseline gap-2">
              <span className="gsa-heading text-lg font-extrabold uppercase tracking-tight text-white">
                GlobalSource
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold">
                Africa
              </span>
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
            Your verification and sourcing partner on the ground in Africa. We
            find, verify, inspect and manage suppliers so you never ship blind.
          </p>
        </div>

        <div>
          <MonoLabel className="text-white/50">Services</MonoLabel>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/services/verification" className="hover:text-white">Supplier Verification</Link></li>
            <li><Link href="/services/discovery" className="hover:text-white">Supplier Discovery</Link></li>
            <li><Link href="/services/inspection" className="hover:text-white">Inspection Coordination</Link></li>
            <li><Link href="/services/sourcing" className="hover:text-white">Full Sourcing</Link></li>
          </ul>
        </div>

        <div>
          <MonoLabel className="text-white/50">Company</MonoLabel>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
            <li><Link href="/origins" className="hover:text-white">Origins</Link></li>
            <li><Link href="/sample-report" className="hover:text-white">Sample Report</Link></li>
            <li><Link href="/resources" className="hover:text-white">Resources</Link></li>
            <li><Link href="/about" className="hover:text-white">About</Link></li>
          </ul>
        </div>

        <div>
          <MonoLabel className="text-white/50">Contact</MonoLabel>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a href="mailto:hello@globalsourceafrica.com" className="flex items-center gap-2 hover:text-white">
                <Mail className="h-4 w-4" /> hello@globalsourceafrica.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </li>
            <li>
              <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            </li>
          </ul>
          <MonoLabel className="mt-4 block text-white/40">
            RESPONSE WITHIN 48 HOURS · 5 AFRICAN ORIGINS
          </MonoLabel>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GlobalSource Africa. On-ground sourcing &amp; verification.</p>
          {/* Entity line — real registered name + RC. We sell 'check the registry', so
              publishing our own number is the cheapest proof we practise it. */}
          <p className="font-mono uppercase tracking-[0.15em]">
            GLOBAL SOURCE AFRICA LIMITED · RC 9851214 · NIGERIA
          </p>
        </div>
      </div>
    </footer>
  );
}
