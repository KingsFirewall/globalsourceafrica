"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { MonoLabel } from "./MonoLabel";
import { submitInquiry } from "@/lib/v2/inquiries";

type Field = { name: string; label: string; type?: "text" | "textarea"; required?: boolean; placeholder?: string };

const SERVICE_OPTIONS = [
  { value: "verification", label: "Verify a supplier", hint: "Check one supplier you've found" },
  { value: "discovery", label: "Find suppliers", hint: "We source & shortlist for you" },
  { value: "inspection", label: "Coordinate inspection", hint: "Eyes at sampling & loading" },
  { value: "sourcing", label: "Full sourcing", hint: "Handle the whole deal" },
  { value: "unsure", label: "Not sure yet", hint: "Tell us what you need" },
] as const;

const FIELDS: Record<string, Field[]> = {
  verification: [
    { name: "supplier_name", label: "Supplier name", required: true },
    { name: "supplier_country", label: "Supplier country", required: true },
    { name: "supplier_contact", label: "Website / contact details" },
    { name: "their_claims", label: "What have they told you?", type: "textarea", placeholder: "Product, capacity, price, terms…" },
    { name: "deal_size", label: "Approximate deal size (USD)" },
  ],
  discovery: [
    { name: "product", label: "Product you need", required: true },
    { name: "quantity", label: "Quantity / volume", required: true },
    { name: "destination", label: "Destination country", required: true },
    { name: "quality_specs", label: "Quality specifications", type: "textarea" },
    { name: "timeline", label: "Timeline" },
    { name: "target_price", label: "Target price (optional)" },
  ],
  sourcing: [
    { name: "product", label: "Product you need", required: true },
    { name: "quantity", label: "Quantity / volume", required: true },
    { name: "destination", label: "Destination country", required: true },
    { name: "quality_specs", label: "Quality specifications", type: "textarea" },
    { name: "timeline", label: "Timeline" },
    { name: "target_price", label: "Budget / target landed cost (optional)" },
  ],
  inspection: [
    { name: "shipment_details", label: "Shipment details", type: "textarea", required: true, placeholder: "Product, quantity, incoterm…" },
    { name: "location", label: "Loading location", required: true },
    { name: "dates", label: "Expected dates" },
  ],
  unsure: [
    { name: "message", label: "What do you need help with?", type: "textarea", required: true },
  ],
};

const inputCls =
  "mt-1 w-full rounded-lg border border-steel/25 bg-white px-4 py-2.5 text-navy focus:border-container focus:outline-none";

export function IntakeForm({ initialService = "" }: { initialService?: string }) {
  const valid = SERVICE_OPTIONS.some((o) => o.value === initialService);
  const [step, setStep] = useState(valid ? 2 : 1);
  const [service, setService] = useState<string>(valid ? initialService : "");
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [buyer, setBuyer] = useState({ company: "", country: "", email: "", whatsapp: "" });
  const [fax, setFax] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);

  const fields = FIELDS[service] ?? [];
  const setP = (k: string, v: string) => setPayload((p) => ({ ...p, [k]: v }));

  function pickService(v: string) {
    setService(v);
    setPayload({});
    setStep(2);
  }

  function toStep3(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStep(3);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await submitInquiry({
      service_type: service as any,
      payload,
      company: buyer.company || null,
      country: buyer.country || null,
      email: buyer.email,
      whatsapp: buyer.whatsapp || null,
      fax,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setRef(res.ref);
  }

  if (ref) {
    return (
      <div className="rounded-2xl border border-steel/20 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-cleared" />
        <h2 className="gsa-heading mt-3 text-2xl font-bold text-navy">Request received</h2>
        <MonoLabel as="p" className="mt-3 justify-center text-container">REF: {ref}</MonoLabel>
        <p className="mt-3 text-steel">We reply within 48 hours (GMT to GMT+3).</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-steel/20 bg-white p-6 sm:p-8">
      {/* Step indicator */}
      <MonoLabel className="text-steel">STEP {step} OF 3</MonoLabel>

      {/* Step 1 — service */}
      {step === 1 && (
        <div className="mt-4">
          <h2 className="gsa-heading text-xl font-bold text-navy">What do you need?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SERVICE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => pickService(o.value)}
                className="rounded-xl border border-steel/25 bg-white p-4 text-left hover:border-container"
              >
                <span className="block font-semibold text-navy">{o.label}</span>
                <span className="block text-sm text-steel">{o.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — dynamic fields */}
      {step === 2 && (
        <form onSubmit={toStep3} className="mt-4">
          <h2 className="gsa-heading text-xl font-bold text-navy">Tell us the details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.name} className={f.type === "textarea" ? "block sm:col-span-2" : "block"}>
                <span className="text-sm font-medium text-navy">
                  {f.label}{f.required && " *"}
                </span>
                {f.type === "textarea" ? (
                  <textarea rows={3} required={f.required} placeholder={f.placeholder} value={payload[f.name] ?? ""} onChange={(e) => setP(f.name, e.target.value)} className={inputCls} />
                ) : (
                  <input required={f.required} placeholder={f.placeholder} value={payload[f.name] ?? ""} onChange={(e) => setP(f.name, e.target.value)} className={inputCls} />
                )}
              </label>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
              <ArrowLeft className="h-4 w-4" /> Change service
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 font-semibold text-white hover:bg-navy/90">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}

      {/* Step 3 — buyer details */}
      {step === 3 && (
        <form onSubmit={submit} className="mt-4">
          <h2 className="gsa-heading text-xl font-bold text-navy">Your details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-navy">Company</span>
              <input value={buyer.company} onChange={(e) => setBuyer((b) => ({ ...b, company: e.target.value }))} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy">Country</span>
              <input value={buyer.country} onChange={(e) => setBuyer((b) => ({ ...b, country: e.target.value }))} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy">Business email *</span>
              <input type="email" required value={buyer.email} onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))} className={inputCls} placeholder="you@company.com" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy">WhatsApp (optional)</span>
              <input value={buyer.whatsapp} onChange={(e) => setBuyer((b) => ({ ...b, whatsapp: e.target.value }))} className={inputCls} />
            </label>
          </div>

          {/* Honeypot — visually hidden, off-screen, not for humans */}
          <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label>Fax<input tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} /></label>
          </div>

          {error && <p className="mt-3 text-sm text-container">{error}</p>}

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-container px-6 py-3 font-semibold text-white hover:bg-container/90 disabled:opacity-50">
              {busy ? "Sending…" : "Submit request"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
