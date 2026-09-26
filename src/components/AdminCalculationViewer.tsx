"use client";

import InterpretationText, { type InterpretationViewMetadata } from "@/components/InterpretationText";
import ChartExportButton from "@/components/ChartExportButton";
import ChartMapSection from "@/components/ChartMapSection";
import { type WheelFixedStar, type WheelPlanet } from "@/components/ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import ElementBalanceGuide from "@/components/ElementBalanceGuide";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";
import { useEffect } from "react";

import { X } from "lucide-react";

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

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="admin-calculation-viewer fixed inset-0 z-50 flex h-[100dvh] w-full items-stretch justify-center overflow-hidden overscroll-contain bg-black/85 p-0">
      <div data-chart-export-root="true" className="admin-calculation-dialog relative min-h-0 min-w-0 h-full w-full overflow-y-auto overscroll-contain border border-slate-400/50 bg-[#0d0a18] p-3 shadow-[0_0_35px_rgba(148,163,184,0.28)] sm:p-8">
        
        {/* Premium Fixed Top-Right Close Button */}
        <div className="interpretation-close-row sticky top-0 z-50 flex justify-end pointer-events-none">
          <button
            type="button"
            onClick={onClose}
            className="interpretation-close-button pointer-events-auto group"
            title="ფანჯრის დახურვა"
          >
            <span className="interpretation-close-icon"><X className="h-3.5 w-3.5" /></span>
            <span className="interpretation-close-label">
              დახურვა
            </span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 border-b border-slate-500/30 pb-4 text-center">
          <h2 className="text-2xl font-bold text-slate-100 sm:text-3xl">
            {TYPE_LABEL[calculation.type] ?? `${calculation.type} რუკა`} — {calculation.name1}{calculation.name2 ? ` & ${calculation.name2}` : ""}
          </h2>
          <p className="text-sm font-bold text-amber-300">რუკის ნომერი: {calculation.mapNumber ?? "—"}</p>
          <p className="text-xs text-slate-400">შედგენის დრო: {new Date(calculation.createdAt).toLocaleString("ka-GE")}</p>
        </div>

        <div className="admin-calculation-details mt-5 grid min-w-0 gap-2 rounded-xl border border-slate-500/30 bg-slate-500/5 p-3 text-sm text-slate-200 sm:grid-cols-2 sm:p-4">
          <p className="text-center sm:col-span-2"><span className="text-slate-400">რუკის ნომერი:</span> {calculation.mapNumber ?? "—"}</p>
          <p><span className="text-slate-400">პირველი პროფილი:</span> {calculation.name1}</p>
          <p><span className="text-slate-400">დაბადება:</span> {formatWideDateDisplay(calculation.date1)} {calculation.time1}</p>
          <p><span className="text-slate-400">ადგილი:</span> {calculation.place1}</p>
          {calculation.name2 && <p><span className="text-slate-400">მეორე პროფილი:</span> {calculation.name2}</p>}
          {calculation.date2 && <p><span className="text-slate-400">მეორე დაბადება:</span> {formatWideDateDisplay(calculation.date2)} {calculation.time2}</p>}
          {calculation.place2 && <p><span className="text-slate-400">მეორე ადგილი:</span> {calculation.place2}</p>}
          {calculation.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი:</span> {formatWideDateDisplay(calculation.transitDate)}</p>}
          <p><span className="text-slate-400">სახლთა სისტემა:</span> {calculation.houseSystem}</p>
        </div>

        <div className="flex justify-end pt-3">
          <ChartExportButton className="flex items-center justify-center gap-1.5 rounded-full border border-amber-400/40 bg-purple-950/60 px-4 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-400 hover:text-slate-950 cursor-pointer" />
        </div>

        {wheel && (
          <ChartMapSection
            className="admin-calculation-wheel mx-auto my-6 min-w-0 w-full max-w-3xl"
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

        <div className="admin-calculation-interpretation mt-6 min-w-0 border-t border-slate-500/30 pt-5">
            <h3 className="mb-4 border-b border-slate-500/30 pb-3 text-center text-xl font-bold text-slate-200 sm:text-2xl">ასტროლოგიური ინტერპრეტაცია &amp; ანალიზი</h3>
          {calculation.interpretation ? (
            <InterpretationText text={calculation.interpretation} viewMetadata={calculation.viewMetadata ?? undefined} />
          ) : <p className="text-sm text-slate-400">ამ ჩანაწერისთვის ინტერპრეტაცია ვერ მოიძებნა.</p>}
        </div>
      </div>
    </div>
  );
}
