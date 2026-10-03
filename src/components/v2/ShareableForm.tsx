"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Copy, Mail, MessageCircle } from "lucide-react";
import { MonoLabel } from "./MonoLabel";
import { submitInquiry } from "@/lib/v2/inquiries";
import { CONTACT } from "@/lib/v2/contact";
import { isHeading, isVisible, type FormField, type FormValues as Values, type ShareableFormDef } from "@/lib/v2/forms/types";

const inputCls =
  "mt-1 w-full rounded-lg border border-steel/25 bg-white px-4 py-2.5 text-navy placeholder:text-steel/60 focus:border-container focus:outline-none focus:ring-2 focus:ring-container/15";

// Tick/radio tiles: the native input stays in the tab order (sr-only, not
// display:none) so keyboard users and native `required` validation still work.
const tileCls =
  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-steel/25 bg-white px-3.5 py-2.5 text-sm text-navy/85 transition-colors hover:border-container/60 has-[:checked]:border-container has-[:checked]:bg-container/5 has-[:checked]:font-semibold has-[:checked]:text-navy has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-container/30";

const fields = (def: ShareableFormDef) =>
  def.steps.flatMap((s) => s.items.filter((i): i is FormField => !isHeading(i)));

const asText = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : v ?? "");

// The confirm statement is a sentence, not a label — key it by what it is.
const answerLabel = (f: FormField) => (f.type === "confirm" ? "Buyer confirmation" : f.label);
const answerValue = (f: FormField, values: Values) =>
  f.type === "confirm" ? (values[f.key] ? "Confirmed" : "") : asText(values[f.key]);

/** Plain-text copy of the answers, for WhatsApp / email / clipboard. */
function buildSummary(def: ShareableFormDef, values: Values, ref?: string) {
  const lines = [`GLOBALSOURCE AFRICA — ${def.name.toUpperCase()}`];
  if (ref) lines.push(`Reference: ${ref}`);
  def.steps.forEach((step, i) => {
    const answered = step.items
      .filter((it): it is FormField => !isHeading(it) && isVisible(it, values))
      .map((f) => [answerLabel(f), answerValue(f, values)] as const)
      .filter(([, v]) => v);
    if (!answered.length) return;
    lines.push("", `${i + 1}. ${step.title.toUpperCase()}`);
    answered.forEach(([k, v]) => lines.push(`${k}: ${v}`));
  });
  return lines.join("\n");
}

export function ShareableForm({ def }: { def: ShareableFormDef }) {
  const storageKey = `gsa_form_${def.slug}`;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(fields(def).filter((f) => f.defaultValue).map((f) => [f.key, f.defaultValue!]))
  );
  const [fax, setFax] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hydrated = useRef(false);
  const shownView = useRef("0|");

  // After mount (SSR-safe): restore an unfinished draft, then let the link
  // prefill anything still empty — /inquiry/charcoal?company=Acme&contact=Jane
  // — and default date fields to today.
  useEffect(() => {
    const restored: Values = {};
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved === "object") Object.assign(restored, saved);
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const today = new Date();
    const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    for (const f of fields(def)) {
      const p = params.get(f.key);
      if (p && !restored[f.key] && (!f.type || ["text", "email", "tel", "url", "textarea"].includes(f.type))) {
        restored[f.key] = p;
      }
      if (f.type === "date" && !restored[f.key]) restored[f.key] = iso;
    }
    setValues((v) => ({ ...v, ...restored }));
    hydrated.current = true;
  }, [def, storageKey]);

  // Keep a draft so a buyer who closes the tab mid-way doesn't start over.
  useEffect(() => {
    if (!hydrated.current || ref) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {}
  }, [values, ref, storageKey]);

  // Bring the new step into view and move focus to its heading for screen readers.
  useEffect(() => {
    const view = `${step}|${ref ?? ""}`;
    if (view === shownView.current) return;
    shownView.current = view;
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step, ref]);

  const set = (key: string, v: string | string[]) => setValues((p) => ({ ...p, [key]: v }));
  const toggle = (key: string, opt: string) => {
    const cur = Array.isArray(values[key]) ? (values[key] as string[]) : [];
    set(key, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
  };

  const total = def.steps.length;
  const last = step === total - 1;
  const summary = buildSummary(def, values, ref ?? undefined);
  const whatsappHref = `${CONTACT.whatsappHref}?text=${encodeURIComponent(summary)}`;
  const companyName = asText(values.company) || "Buyer";
  const emailHref = `${CONTACT.emailHref}?subject=${encodeURIComponent(
    `${def.name} — ${companyName}${ref ? ` (${ref})` : ""}`
  )}&body=${encodeURIComponent(summary)}`;
  // Answers carried into the follow-up form, so the buyer doesn't retype them.
  const nextPrefill = Object.fromEntries(
    (def.next?.carry ?? []).map((k) => [k, asText(values[k])]).filter(([, v]) => v)
  );
  const nextHref =
    def.next && ref ? `/inquiry/${def.next.slug}?${new URLSearchParams({ ref, ...nextPrefill })}` : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  async function onStepSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!last) return setStep((s) => s + 1);

    const all = fields(def);
    const mapped = (m: FormField["maps"]) => {
      const f = all.find((x) => x.maps === m);
      return f && isVisible(f, values) ? asText(values[f.key]) : "";
    };
    // Buyer columns travel separately; everything else goes in the payload,
    // keyed by its human label so the team email reads as-is.
    const payload: Record<string, string> = {};
    for (const f of all) {
      if (f.maps || !isVisible(f, values)) continue;
      const v = answerValue(f, values);
      if (v) payload[answerLabel(f)] = v;
    }

    setBusy(true);
    const res = await submitInquiry({
      service_type: "sourcing",
      source: def.name,
      payload,
      company: mapped("company") || null,
      country: mapped("country") || null,
      email: mapped("email"),
      whatsapp: mapped("whatsapp") || null,
      parent_ref: mapped("parent_ref") || null,
      next_form: def.next?.slug ?? null,
      next_prefill: nextPrefill,
      fax,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setRef(res.ref);
  }

  // --- Sent ------------------------------------------------------------------
  if (ref) {
    return (
      <div ref={topRef} className="scroll-mt-6 rounded-2xl border border-steel/20 bg-white p-6 shadow-sm sm:p-10">
        <CheckCircle2 className="h-11 w-11 text-cleared" />
        <h2 ref={headingRef} tabIndex={-1} className="gsa-heading mt-4 text-2xl font-bold text-navy outline-none">
          {def.doneTitle ?? "Inquiry received — thank you"}
        </h2>
        <MonoLabel as="p" className="mt-3 text-container">REF: {ref}</MonoLabel>
        <p className="mt-4 max-w-xl text-steel">
          Our team reviews every inquiry personally and replies within 48 hours (GMT to GMT+3). A confirmation
          is on its way to your inbox — just reply to it if anything changes.
        </p>
        {nextHref && def.next && (
          <div className="mt-6 rounded-xl border border-gold/50 bg-gold/10 p-5">
            <p className="flex items-center gap-2 font-semibold text-navy">
              <ClipboardList className="h-5 w-5 text-goldDark" /> {def.next.title}
            </p>
            <p className="mt-1.5 text-sm text-navy/75">{def.next.blurb}</p>
            <a href={nextHref} className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90">
              Add detailed specs <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
        <p className="mt-6 text-sm font-semibold text-navy">Want to reach us faster?</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f9d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1a8a4c]">
            <MessageCircle className="h-4 w-4" /> Follow up on WhatsApp
          </a>
          <button type="button" onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-full border border-steel/25 bg-white px-5 py-3 text-sm font-semibold text-navy hover:border-container">
            <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy your answers"}
          </button>
        </div>
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-semibold text-container">Review your answers</summary>
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-steel/15 bg-paper p-4 font-mono text-xs leading-relaxed text-navy/80" data-lenis-prevent>
            {summary}
          </pre>
        </details>
      </div>
    );
  }

  // --- Steps -----------------------------------------------------------------
  const current = def.steps[step];
  const pct = Math.round(((step + 1) / total) * 100);

  return (
    <div ref={topRef} className="scroll-mt-6 rounded-2xl border border-steel/20 bg-white shadow-sm">
      <div className="px-5 pt-6 sm:px-8">
        <div className="flex items-center justify-between">
          <MonoLabel>Step {step + 1} of {total}</MonoLabel>
          <MonoLabel>{pct}%</MonoLabel>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-steel/15" aria-hidden>
          <div className="h-full rounded-full bg-gold transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <form key={step} onSubmit={onStepSubmit} className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy font-mono text-sm font-semibold text-gold">
            {step + 1}
          </span>
          <h2 ref={headingRef} tabIndex={-1} className="gsa-heading text-lg font-bold text-navy outline-none sm:text-xl">
            {current.title}
          </h2>
        </div>
        {current.help && <p className="mt-3 text-sm text-steel">{current.help}</p>}

        <div className="mt-6 grid gap-x-4 gap-y-5 sm:grid-cols-2">
          {current.items.map((item, i) =>
            !isHeading(item) && !isVisible(item, values) ? null : isHeading(item) ? (
              <h3 key={`h${i}`} className="border-t border-steel/15 pt-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-container sm:col-span-2">
                {item.heading}
              </h3>
            ) : (
              <FieldInput key={item.key} f={item} value={values[item.key]} set={set} toggle={toggle} />
            )
          )}
        </div>

        {last && (
          <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label>Fax<input tabIndex={-1} autoComplete="off" value={fax} onChange={(e) => setFax(e.target.value)} /></label>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm text-navy">
            <p className="font-semibold">We couldn&apos;t submit that just now.</p>
            <p className="mt-1 text-navy/75">{error} Your answers are kept on this page — try again, or send them to us directly:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#1f9d58] px-4 py-2 font-semibold text-white">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href={emailHref} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 font-semibold text-white">
                <Mail className="h-4 w-4" /> Email
              </a>
              <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-steel/25 bg-white px-4 py-2 font-semibold text-navy">
                <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Sticky on phones so Continue is always in reach on long steps. */}
        <div className="sticky bottom-0 -mx-5 mt-8 flex items-center gap-3 border-t border-steel/15 bg-white px-5 py-4 sm:static sm:mx-0 sm:px-0 sm:pb-0">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-semibold text-steel hover:text-navy">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className={`ml-auto inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50 sm:flex-none ${
              last ? "bg-container hover:bg-container/90" : "bg-navy hover:bg-navy/90"
            }`}
          >
            {last ? (busy ? "Sending…" : def.submitLabel ?? "Submit inquiry") : "Continue"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {last && def.submitNote && <p className="mt-2 text-center text-xs text-steel sm:text-right">{def.submitNote}</p>}
      </form>
    </div>
  );
}

function FieldInput({
  f,
  value,
  set,
  toggle,
}: {
  f: FormField;
  value: string | string[] | undefined;
  set: (k: string, v: string | string[]) => void;
  toggle: (k: string, opt: string) => void;
}) {
  const id = `f_${f.key}`;
  const type = f.type ?? "text";
  const req = f.required ? <span className="text-container"> *</span> : null;

  if (type === "radio" || type === "checkboxes") {
    const checked = (o: string) => (type === "radio" ? value === o : Array.isArray(value) && value.includes(o));
    return (
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-medium text-navy">{f.label}{req}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {f.options!.map((o, i) => (
            <label key={o} className={tileCls}>
              <input
                type={type === "radio" ? "radio" : "checkbox"}
                name={f.key}
                value={o}
                required={type === "radio" && f.required && i === 0}
                checked={checked(o)}
                onChange={() => (type === "radio" ? set(f.key, o) : toggle(f.key, o))}
                className="h-4 w-4 shrink-0 accent-[#1B6B3F]"
              />
              {o}
            </label>
          ))}
        </div>
        {f.hint && <p className="mt-1.5 text-xs text-steel">{f.hint}</p>}
      </fieldset>
    );
  }

  if (type === "confirm") {
    return (
      <label className={`${tileCls} items-start sm:col-span-2`}>
        <input
          type="checkbox"
          required={f.required}
          checked={Boolean(value)}
          onChange={(e) => set(f.key, e.target.checked ? "yes" : "")}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#1B6B3F]"
        />
        <span>{f.label}{req}</span>
      </label>
    );
  }

  const common = {
    id,
    name: f.key,
    required: f.required,
    placeholder: f.placeholder,
    value: typeof value === "string" ? value : "",
    className: inputCls,
  };

  return (
    <div className={type === "textarea" || f.full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="text-sm font-medium text-navy">{f.label}{req}</label>
      {type === "textarea" ? (
        <textarea rows={3} {...common} onChange={(e) => set(f.key, e.target.value)} />
      ) : (
        <input
          type={type}
          autoComplete={f.maps === "email" ? "email" : f.maps === "whatsapp" ? "tel" : f.maps === "company" ? "organization" : undefined}
          {...common}
          onChange={(e) => set(f.key, e.target.value)}
        />
      )}
      {f.hint && <p className="mt-1.5 text-xs text-steel">{f.hint}</p>}
    </div>
  );
}
