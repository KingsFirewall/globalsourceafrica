import { MonoLabel } from "./MonoLabel";

// Mono "manifest" strip of trust signals, dot-separated.
// e.g. <TrustStrip items={["ACCREDITED INSPECTION", "48H RESPONSE", "FLAT-FEE REPORTS"]} />
export function TrustStrip({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  return (
    <MonoLabel as="div" className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden className="text-steel/50">·</span>}
          {item}
        </span>
      ))}
    </MonoLabel>
  );
}
