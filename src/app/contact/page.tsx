import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Linkedin, Clock, ArrowRight } from "lucide-react";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { BackToHome } from "@/components/v2/BackToHome";

export const metadata: Metadata = {
  title: "Contact — GlobalSource Africa",
  description: "Email, WhatsApp and LinkedIn. We reply within 48 hours across our five African origins.",
};

export default function ContactPage() {
  return (
    <>
      <section className="gsa-corrugation bg-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <BackToHome />
          <MonoLabel className="text-container">CONTACT</MonoLabel>
          <h1 className="gsa-heading mt-3 text-4xl font-extrabold sm:text-5xl">Talk to us</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/70">
            The fastest way to start is a request — but you can reach us directly too.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="grid gap-4 sm:grid-cols-2">
            <a href="mailto:hello@globalsourceafrica.com" className="flex items-center gap-3 rounded-xl border border-steel/20 bg-paper p-5 hover:border-container">
              <Mail className="h-5 w-5 text-container" />
              <span className="text-navy">hello@globalsourceafrica.com</span>
            </a>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-steel/20 bg-paper p-5 hover:border-container">
              <MessageCircle className="h-5 w-5 text-container" />
              <span className="text-navy">WhatsApp click-to-chat</span>
            </a>
            <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-steel/20 bg-paper p-5 hover:border-container">
              <Linkedin className="h-5 w-5 text-container" />
              <span className="text-navy">LinkedIn</span>
            </a>
            <div className="flex items-center gap-3 rounded-xl border border-steel/20 bg-paper p-5">
              <Clock className="h-5 w-5 text-container" />
              <span className="text-navy">Mon–Fri · GMT to GMT+3</span>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-navy p-8 text-center text-white">
            <h2 className="gsa-heading text-2xl font-bold">Ready to start?</h2>
            <p className="mx-auto mt-2 max-w-md text-white/70">Send the details — we reply within 48 hours.</p>
            <Link href="/request" className="mt-5 inline-flex items-center gap-2 rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90">
              Make a request <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
