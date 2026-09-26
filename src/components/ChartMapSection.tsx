"use client";

import { ChevronDown } from "lucide-react";
import ChartWheel, { type WheelFixedStar, type WheelPlanet } from "./ChartWheel";
import ChartDetails from "./ChartDetails";
import type { AspectHit } from "@/lib/astro/aspects";

export default function ChartMapSection({
  title = "ზოდიაქალური წრე",
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
    <details open className={`chart-map-section overflow-hidden rounded-2xl border border-slate-300/30 bg-[#0d0626]/95 shadow-2xl ${className}`}>
      <summary className="relative flex cursor-pointer list-none items-center justify-center gap-3 border-b border-slate-300/20 px-10 py-3 text-center outline-none sm:px-14 sm:py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-black text-amber-300 sm:text-3xl">{title}</span>
          {subtitle && <span className="mt-1 block text-sm font-semibold text-amber-100 sm:text-base">{subtitle}</span>}
        </span>
        <ChevronDown className="chart-map-section-chevron absolute right-3 h-5 w-5 shrink-0 text-amber-300 transition-transform sm:right-6" aria-hidden="true" />
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
