"use client";

import InterpretationText, { type InterpretationViewMetadata } from "@/components/InterpretationText";
import ChartExportButton from "@/components/ChartExportButton";
import ChartMapSection from "@/components/ChartMapSection";
import { type WheelFixedStar, type WheelPlanet } from "@/components/ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import ElementBalanceGuide from "@/components/ElementBalanceGuide";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";
import { useEffect } from "react";
import { X, Calendar, Clock, MapPin } from "lucide-react";

export type CalculationViewData = {
  mapNumber?: string | null;
  type: string;
  name1: string;
  name2: string | null;
  date1: string;
  time1: string;
  place1: string;
  date2: string | null;
  time2: string | null;
  place2: string | null;
  transitDate: string | null;
  houseSystem: string;
  createdAt: string;
  result: unknown;
  interpretation: string | null;
  viewMetadata?: InterpretationViewMetadata | null;
};

type WheelData = {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
  aspects: AspectHit[];
  fixedStars: WheelFixedStar[];
  planetHouses: Record<string, number>;
};

const TYPE_LABEL: Record<string, string> = {
  NATAL: "ნატალური რუკა",
  SYNASTRY: "სინასტრიული რუკა",
  TRANSIT: "ტრანზიტული რუკა",
};

function wheelFromResult(result: unknown): WheelData | null {
  if (!result || typeof result !== "object") return null;
  const candidate = result as Record<string, unknown>;
  const source = candidate.ascendant !== undefined
    ? candidate
    : candidate.natalChart && typeof candidate.natalChart === "object"
      ? candidate.natalChart as Record<string, unknown>
      : candidate.chartA && typeof candidate.chartA === "object"
        ? candidate.chartA as Record<string, unknown>
        : null;
  if (!source || typeof source.ascendant !== "number" || !Array.isArray(source.planets) || !Array.isArray(source.houseCusps)) return null;
  return {
    ascendant: source.ascendant,
    mc: typeof source.mc === "number" ? source.mc : 0,
    houseCusps: source.houseCusps as number[],
    planets: source.planets as WheelPlanet[],
    aspects: Array.isArray(source.aspects) ? source.aspects as AspectHit[] : [],
    fixedStars: source.advanced && typeof source.advanced === "object" && Array.isArray((source.advanced as Record<string, unknown>).fixedStarContacts)
      ? (source.advanced as Record<string, unknown>).fixedStarContacts as WheelFixedStar[]
      : [],
    planetHouses: source.planetHouses && typeof source.planetHouses === "object" ? source.planetHouses as Record<string, number> : {},
  };
}

export default function AdminCalculationViewer({
  calculation,
  onClose,
}: {
  calculation: CalculationViewData;
  onClose: () => void;
}) {
  const wheel = wheelFromResult(calculation.result);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.documentElement.classList.add("chart-reader-open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.documentElement.classList.remove("chart-reader-open");
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="admin-calculation-viewer fixed inset-0 z-50 flex h-[100dvh] w-full items-stretch justify-center overflow-hidden overscroll-contain bg-[#060813]/95 backdrop-blur-2xl p-0">
      <div data-chart-export-root="true" className="admin-calculation-dialog relative min-h-0 min-w-0 h-full w-full overflow-y-auto overscroll-contain p-3 sm:p-8">
        
        {/* Top-Right Close Button */}
        <div className="interpretation-close-row">
          <button
            type="button"
            onClick={onClose}
            className="interpretation-close-button pointer-events-auto group"
            title="ფანჯრის დახურვა"
          >
            <span className="interpretation-close-icon"><X className="h-4 w-4" /></span>
            <span className="interpretation-close-label">
              დახურვა
            </span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto space-y-6 pt-10 pb-16">
          {/* Header Row */}
          <div className="flex flex-col items-center gap-2 border-b border-white/10 pb-5 text-center">
            <div className="telemetry-badge inline-flex items-center gap-2">
              <span className="live-beacon"></span>
              <span className="telemetry-badge-text">{TYPE_LABEL[calculation.type] ?? calculation.type}</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              {TYPE_LABEL[calculation.type] ?? `${calculation.type} რუკა`} — {calculation.name1}{calculation.name2 ? ` & ${calculation.name2}` : ""}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
              <span className="text-sky-300 bg-sky-500/10 border border-sky-400/25 px-3 py-1 rounded-full">
                რუკის ნომერი: {calculation.mapNumber ?? "—"}
              </span>
              <span className="text-slate-400">
                შედგენის დრო: {new Date(calculation.createdAt).toLocaleString("ka-GE")}
              </span>
            </div>
          </div>

          {/* Full Chart Details */}
          <div className="admin-calculation-details grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-200 sm:grid-cols-2 sm:p-5 backdrop-blur-md">
            <p><span className="text-slate-400">პირველი პროფილი:</span> <strong className="text-white ml-1">{calculation.name1}</strong></p>
            <p><span className="text-slate-400">დაბადება:</span> <strong className="text-sky-300 ml-1">{formatWideDateDisplay(calculation.date1)} {calculation.time1}</strong></p>
            <p><span className="text-slate-400">ადგილი:</span> <strong className="text-slate-200 ml-1">{calculation.place1}</strong></p>
            {calculation.name2 && <p><span className="text-slate-400">მეორე პროფილი:</span> <strong className="text-white ml-1">{calculation.name2}</strong></p>}
            {calculation.date2 && <p><span className="text-slate-400">მეორე დაბადება:</span> <strong className="text-sky-300 ml-1">{formatWideDateDisplay(calculation.date2)} {calculation.time2}</strong></p>}
            {calculation.place2 && <p><span className="text-slate-400">მეორე ადგილი:</span> <strong className="text-slate-200 ml-1">{calculation.place2}</strong></p>}
            {calculation.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი:</span> <strong className="text-purple-300 ml-1">{formatWideDateDisplay(calculation.transitDate)}</strong></p>}
            <p><span className="text-slate-400">სახლთა სისტემა:</span> <strong className="text-slate-200 ml-1">{calculation.houseSystem}</strong></p>
          </div>

          {/* Export Action */}
          <div className="flex justify-end pt-2">
            <ChartExportButton className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-5 py-2.5 text-xs font-bold text-sky-200 hover:bg-sky-400 hover:text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.2)]" />
          </div>

          {wheel && (
            <ChartMapSection
              className="admin-calculation-wheel mx-auto my-4 min-w-0 w-full max-w-3xl"
              ascendant={wheel.ascendant}
              mc={wheel.mc}
              houseCusps={wheel.houseCusps}
              planets={wheel.planets}
              aspects={wheel.aspects}
              fixedStars={wheel.fixedStars}
              planetHouses={wheel.planetHouses}
            />
          )}

          {wheel && (
            <ElementBalanceGuide
              planets={wheel.planets}
              ascendant={wheel.ascendant}
            />
          )}

          <div className="admin-calculation-interpretation min-w-0 border-t border-white/10 pt-6">
            <h3 className="font-display mb-4 border-b border-white/10 pb-3 text-center text-xl font-bold text-white sm:text-2xl">
              ასტროლოგიური <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">ინტერპრეტაცია &amp; ანალიზი</span>
            </h3>
            {calculation.interpretation ? (
              <InterpretationText text={calculation.interpretation} viewMetadata={calculation.viewMetadata ?? undefined} />
            ) : <p className="text-sm text-slate-400 text-center py-6">ამ ჩანაწერისთვის ინტერპრეტაცია ვერ მოიძებნა.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
