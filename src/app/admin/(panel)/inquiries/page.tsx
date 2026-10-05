import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  INQUIRY_STATUSES,
  STATUS_STYLE,
  contactName,
  listInquiries,
  sourceLabel,
  summarize,
  type InquiryRow,
} from "@/lib/admin/inquiries";
import { FORMS } from "@/lib/v2/forms";

export const dynamic = "force-dynamic";

// Filter tabs: each share-link form, plus the general /request form.
const SOURCES = [
  { value: "", label: "All" },
  ...FORMS.map((f) => ({ value: f.slug, label: f.name })),
  { value: "request", label: "Website request" },
];

function matchesSource(row: InquiryRow, source: string) {
  if (!source) return true;
  if (source === "request") return !row.payload?.form;
  return row.payload?.form === FORMS.find((f) => f.slug === source)?.name;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: { source?: string; status?: string };
}) {
  const source = searchParams.source ?? "";
  const status = searchParams.status ?? "";

  let rows: InquiryRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await listInquiries();
  } catch (e: any) {
    loadError = e?.message ?? "Unknown error";
  }

  const shown = rows.filter((r) => matchesSource(r, source) && (!status || r.status === status));
  const href = (next: { source?: string; status?: string }) => {
    const q = new URLSearchParams();
    const s = next.source ?? source;
    const st = next.status ?? status;
    if (s) q.set("source", s);
    if (st) q.set("status", st);
    const qs = q.toString();
    return `/admin/inquiries${qs ? `?${qs}` : ""}`;
  };
  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Inquiries</h1>
      <p className="mt-1 text-sm text-sub">
        Everything buyers send through the website and the share-link forms — newest first.
        {newCount > 0 && <span className="font-medium text-orangeDark"> {newCount} new.</span>}
      </p>

      {loadError && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-orange/40 bg-orange/10 p-4 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orangeDark" />
          <div>
            <p className="font-semibold">Couldn&apos;t load inquiries from the database.</p>
            <p className="mt-1 text-sub">
              New inquiries still reach the team inbox by email (marked [NOT SAVED] while the database is down).
              Error: {loadError}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <Link
            key={s.value}
            href={href({ source: s.value })}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              source === s.value ? "bg-green text-white" : "border border-greenLine bg-white text-ink hover:border-green"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {["", ...INQUIRY_STATUSES].map((s) => (
          <Link
            key={s || "any"}
            href={href({ status: s })}
            className={`rounded-full px-2.5 py-1 capitalize ${
              status === s ? "bg-ink text-white" : "text-sub hover:bg-greenSoft"
            }`}
          >
            {s || "Any status"}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-greenLine bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-greenSoft text-left text-ink">
            <tr>
              <th className="px-4 py-3 font-medium">Buyer</th>
              <th className="px-4 py-3 font-medium">What they need</th>
              <th className="px-4 py-3 font-medium">Form</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-greenLine">
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sub">
                  {loadError ? "—" : "No inquiries match these filters yet."}
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id} className="hover:bg-cream">
                <td className="px-4 py-3">
                  <Link href={`/admin/inquiries/${r.ref}`} className="font-medium text-ink hover:text-green">
                    {r.company || contactName(r) || r.email}
                  </Link>
                  <div className="text-xs text-sub">
                    <span className="font-mono">{r.ref}</span>
                    {r.country ? ` · ${r.country}` : ""}
                  </div>
                </td>
                <td className="max-w-xs px-4 py-3 text-ink">
                  <span className="line-clamp-2">{summarize(r) || "—"}</span>
                </td>
                <td className="px-4 py-3 text-sub">{sourceLabel(r)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[r.status] ?? "bg-greenSoft text-sub"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sub">
                  {new Date(r.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
