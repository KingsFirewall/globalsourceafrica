import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { ShareableForm } from "@/components/v2/ShareableForm";
import { FORMS, getForm } from "@/lib/v2/forms";
import { CONTACT } from "@/lib/v2/contact";

// Shareable buyer forms: a link we send customers directly, so it is deliberately
// focused — no site nav, footer or chat launcher (see SiteNav/SiteFooter/ChatWidget),
// just the brand, the form and our contact lines.

export function generateStaticParams() {
  return FORMS.map((f) => ({ slug: f.slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const def = getForm(params.slug);
  if (!def) return {};
  const title = `${def.name} — GlobalSource Africa`;
  return {
    title,
    description: def.metaDescription,
    // What WhatsApp / LinkedIn / email clients show when the link is pasted.
    openGraph: { title, description: def.metaDescription, url: `/inquiry/${def.slug}` },
    twitter: { title, description: def.metaDescription },
  };
}

export default function InquiryFormPage({ params }: { params: { slug: string } }) {
  const def = getForm(params.slug);
  if (!def) notFound();

  return (
    <div className="min-h-screen bg-paper">
      <section className="gsa-corrugation border-b-4 border-gold bg-navy text-white">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/main_logo.png" alt="GlobalSource Africa" className="h-10 w-auto" />
              <span className="flex flex-col leading-none">
                <span className="gsa-heading text-lg font-extrabold uppercase tracking-tight">GlobalSource</span>
                <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.3em] text-gold">Africa</span>
              </span>
            </Link>
            <span className="hidden items-center gap-1.5 text-xs text-white/60 sm:flex">
              <ShieldCheck className="h-4 w-4 text-gold" /> RC 9851214 · Nigeria
            </span>
          </div>

          <MonoLabel as="p" className="mt-10 text-gold">{def.label}</MonoLabel>
          <h1 className="gsa-heading mt-3 text-3xl font-extrabold sm:text-4xl">{def.title}</h1>
          <p className="mt-4 max-w-2xl text-white/70">{def.intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <p className="mb-5 text-sm text-steel">{def.note}</p>

        <ShareableForm def={def} />

        <div className="mt-8 flex flex-col items-center gap-3 text-center text-sm text-steel">
          <p>Prefer to talk first?</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-navy hover:text-container">
              <MessageCircle className="h-4 w-4" /> {CONTACT.whatsappDisplay}
            </a>
            <a href={CONTACT.emailHref} className="inline-flex items-center gap-1.5 font-semibold text-navy hover:text-container">
              <Mail className="h-4 w-4" /> {CONTACT.email}
            </a>
          </div>
          <p className="mt-4 text-xs text-steel/80">
            Your answers are sent only to GlobalSource Africa and used to prepare your proposal.{" "}
            <Link href="/legal/privacy" className="underline hover:text-navy">Privacy</Link>
            {" · "}
            <Link href="/" className="underline hover:text-navy">globalsourceafrica.com</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
