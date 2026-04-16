"use client";

import { Download } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.print();
      }}
      className="inline-flex items-center gap-2 rounded-lg bg-[#e6f4ec] px-3 py-2 text-xs font-semibold text-[#176844]"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      Print / Download Report
    </button>
  );
}
