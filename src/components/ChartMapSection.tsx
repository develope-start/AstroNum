"use client";

import { ChevronDown } from "lucide-react";
import ChartWheel, { type WheelFixedStar, type WheelPlanet } from "./ChartWheel";
import ChartDetails from "./ChartDetails";
import type { AspectHit } from "@/lib/astro/aspects";

export default function ChartMapSection({
  title = "რუკის მთავარი სურათი",
  subtitle,
  className = "",
  planets,
  ascendant,
  mc,
  houseCusps,
  aspects,
  fixedStars,
  planetHouses,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  planets: WheelPlanet[];
  ascendant: number;
  mc: number;
  houseCusps: number[];
  aspects: AspectHit[];
  fixedStars: WheelFixedStar[];
  planetHouses: Record<string, number>;
}) {
  return (
    <details open className={`chart-map-section overflow-hidden rounded-2xl border border-amber-500/30 bg-[#0d0626]/95 shadow-2xl ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-amber-500/20 px-3 py-3 text-left outline-none sm:px-6 sm:py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-base font-black text-amber-300 sm:text-xl">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs font-semibold text-slate-300">{subtitle}</span>}
        </span>
        <ChevronDown className="chart-map-section-chevron h-5 w-5 shrink-0 text-amber-300 transition-transform" aria-hidden="true" />
      </summary>
      <div className="p-2 text-center sm:p-6">
        <ChartWheel
          ascendant={ascendant}
          mc={mc}
          cusps={houseCusps}
          planets={planets}
          aspects={aspects}
          fixedStars={fixedStars}
          size={620}
        />
        <ChartDetails
          planets={planets}
          planetHouses={planetHouses}
          houseCusps={houseCusps}
          aspects={aspects}
          fixedStars={fixedStars}
          ascendant={ascendant}
          mc={mc}
        />
      </div>
    </details>
  );
}
