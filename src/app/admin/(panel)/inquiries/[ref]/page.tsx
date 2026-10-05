import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ClipboardList, Link2, Mail, MessageCircle } from "lucide-react";
import {
  STATUS_STYLE,
  answerSections,
  contactName,
  followUpPrefill,
  formOf,
  getInquiryByRef,
  listFollowUps,
  sourceLabel,
} from "@/lib/admin/inquiries";
import { followUpFor } from "@/lib/v2/forms";
import { siteUrl } from "@/lib/v2/email";
import { InquiryStatusControl } from "@/components/admin/InquiryStatusControl";

export const dynamic = "force-dynamic";

export default async function AdminInquiryPage({ params }: { params: { ref: string } }) {
  const ref = decodeURIComponent(params.ref);
  const row = await getInquiryByRef(ref);
  if (!row) notFound();

  const def = formOf(row);
  const name = contactName(row);
  const parentRef = row.payload?.["Follows inquiry"];
  const followUps = await listFollowUps(row.ref);
  const follow = followUpFor(def?.next?.slug, {
    baseUrl: siteUrl(),
    ref: row.ref,
    prefill: followUpPrefill(row),
    whatsapp: row.whatsapp,
  });
  const waDigits = (row.whatsapp || "").replace(/\D/g, "").replace(/^00/, "");
  const replyHref = `mailto:${row.email}?subject=${encodeURIComponent(`Your inquiry ${row.ref} — GlobalSource Africa`)}`;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm text-sub hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Inquiries
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-sub">{row.ref}</p>
          <h1 className="font-display text-2xl font-semibold text-ink">{row.company || name || row.email}</h1>
          <p className="text-sm text-sub">
            {sourceLabel(row)} · {new Date(row.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[row.status] ?? "bg-greenSoft text-sub"}`}>
            {row.status}
          </span>
          <InquiryStatusControl inquiryRef={row.ref} status={row.status} />
        </div>
      </div>

      {parentRef && (
        <Link
          href={`/admin/inquiries/${encodeURIComponent(parentRef)}`}
          className="mt-4 flex items-center gap-2 rounded-xl border border-greenLine bg-greenSoft px-4 py-3 text-sm text-green hover:underline"
        >
          <Link2 className="h-4 w-4" /> Detailed specs for inquiry {parentRef} — open the original
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card title="Buyer">
          {name && <Row label="Name" value={name} />}
          {row.company && <Row label="Company" value={row.company} />}
          {row.country && <Row label="Country" value={row.country} />}
          <Row label="Email" value={row.email} />
          {row.whatsapp && <Row label="WhatsApp" value={row.whatsapp} />}
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={replyHref} className="inline-flex items-center gap-1.5 rounded-full bg-green px-3.5 py-2 text-sm font-medium text-white hover:bg-green/90">
              <Mail className="h-4 w-4" /> Reply by email
            </a>
            {waDigits.length >= 8 && (
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1f9d58] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1a8a4c]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        </Card>

        <Card title="Follow-up">
          {follow ? (
            <>
              <p className="text-sm text-sub">
                Send the {follow.nextDef.name.toLowerCase()}, prefilled with this reference and their details.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {follow.whatsappHref && (
                  <a
                    href={follow.whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1f9d58] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1a8a4c]"
                  >
                    <ClipboardList className="h-4 w-4" /> Send on WhatsApp
                  </a>
                )}
                <a href={follow.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-greenLine px-3.5 py-2 text-sm font-medium text-ink hover:border-green">
                  <Link2 className="h-4 w-4" /> Open link
                </a>
              </div>
              <p className="mt-2 select-all break-all rounded-lg bg-cream p-2 font-mono text-[11px] text-sub">{follow.link}</p>
            </>
          ) : (
            <p className="text-sm text-sub">No follow-up form for this kind of inquiry.</p>
          )}
          {followUps.length > 0 && (
            <div className="mt-4 border-t border-greenLine pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-sub">Received</p>
              {followUps.map((f) => (
                <Link key={f.id} href={`/admin/inquiries/${encodeURIComponent(f.ref)}`} className="mt-1 block text-sm font-medium text-green hover:underline">
                  {sourceLabel(f)} · {f.ref} · {new Date(f.created_at).toLocaleDateString()}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {answerSections(row).map((s) => (
        <div key={s.title} className="mt-4 rounded-2xl border border-greenLine bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
          <dl className="mt-3 divide-y divide-greenLine">
            {s.rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4">
                <dt className="text-sub">{k}</dt>
                <dd className="whitespace-pre-line font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-greenLine bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-sub">{label}</span>
      <span className="break-all text-right font-medium text-ink">{value}</span>
    </div>
  );
}
