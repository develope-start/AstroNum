"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { copyChartExport } from "@/lib/copyChartExport";

export default function ChartExportButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(event: React.MouseEvent<HTMLButtonElement>) {
    const root = event.currentTarget.closest<HTMLElement>("[data-chart-export-root]")
      ?? document.querySelector<HTMLElement>("[data-chart-export-root]");
    if (!root) return;
    try {
      await copyChartExport(root);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      data-copy-exclude="true"
      onClick={handleCopy}
      className={className}
      aria-label="ტექსტის, ცხრილებისა და სურათების კოპირება"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      <span>{copied ? "კოპირებულია!" : "ტექსტის კოპირება"}</span>
    </button>
  );
}
