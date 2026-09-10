"use client";

import { Printer } from "lucide-react";

// Screen-only control on the print-ready report. Hidden by print:hidden so it
// never appears in the exported PDF.
export function PrintButton() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-steel/25 bg-paper px-4 py-3 print:hidden">
      <p className="text-xs leading-relaxed text-steel">
        Print this page and choose <strong className="text-navy">Save as PDF</strong>,
        then drop the file at <code className="font-mono text-navy">/public/sample-report.pdf</code>.
      </p>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-container px-5 py-2 text-sm font-semibold text-white hover:bg-brand"
      >
        <Printer className="h-4 w-4" /> Print / Save as PDF
      </button>
    </div>
  );
}
