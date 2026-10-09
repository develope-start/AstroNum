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
    <details open className={`chart-map-section overflow-hidden rounded-2xl sm:rounded-[28px] border border-white/10 bg-[#090d1e]/90 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.15)] ${className}`}>
      <summary className="relative flex cursor-pointer list-none items-center justify-center gap-3 border-b border-white/10 px-10 py-3.5 text-center outline-none sm:px-14 sm:py-4.5 [&::-webkit-details-marker]:hidden transition hover:bg-white/[0.02]">
        <span className="min-w-0 flex-1">
          <span className="block text-xl font-bold text-white tracking-normal sm:text-2xl">{title}</span>
          {subtitle && <span className="mt-1 block text-xs font-medium text-slate-400 sm:text-sm">{subtitle}</span>}
        </span>
        <ChevronDown className="chart-map-section-chevron absolute right-3 h-5 w-5 shrink-0 text-slate-400 transition-transform sm:right-6" aria-hidden="true" />
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
