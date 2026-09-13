import type { Metadata } from "next";
import { MonoLabel } from "@/components/v2/MonoLabel";
import { BackToHome } from "@/components/v2/BackToHome";

export const metadata: Metadata = {
  title: "Privacy — GlobalSource Africa",
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <BackToHome />
        <MonoLabel className="text-steel">LEGAL · PLACEHOLDER</MonoLabel>
        <h1 className="gsa-heading mt-3 text-3xl font-bold text-navy">Privacy Policy</h1>
        <p className="mt-4 text-sm text-steel">
          Placeholder policy — to be replaced with counsel-reviewed copy before launch.
        </p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy/80">
          <p>
            We collect the details you submit through our request and sample-report
            forms (such as name, company, email, WhatsApp and your enquiry) solely
            to respond to you and deliver the service you asked for.
          </p>
          <p>
            We do not sell your data. Information is stored securely and shared only
            with the people and accredited partners needed to fulfil your request.
          </p>
          <p>
            To access or delete your data, email{" "}
            <a href="mailto:info@globalsourceafrica.com" className="text-container hover:underline">
              info@globalsourceafrica.com
            </a>
            . Full policy to be finalised with counsel.
          </p>
        </div>
      </div>
    </section>
  );
}
