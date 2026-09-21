"use client";

import InterpretationText, { type InterpretationViewMetadata } from "@/components/InterpretationText";
import ChartWheel, { WheelPlanet } from "@/components/ChartWheel";
import ElementBalanceGuide from "@/components/ElementBalanceGuide";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";

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
  return (
    <div className="admin-calculation-viewer fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-2 sm:p-4">
      <div className="admin-calculation-dialog relative min-w-0 max-h-[calc(100dvh-1rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-400/50 bg-[#0d0a18] p-3 shadow-[0_0_35px_rgba(148,163,184,0.28)] sm:max-h-[92vh] sm:p-8">
        
        {/* Premium Fixed Top-Right Close Button */}
        <div className="sticky top-0 z-50 flex justify-end -mt-1 -mr-1 sm:-mt-4 sm:-mr-4 mb-2 pointer-events-none">
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-gradient-to-r from-slate-900/95 via-[#181c38]/95 to-slate-900/95 px-4 py-2 text-xs font-bold text-slate-200 shadow-[0_8px_24px_-6px_rgba(99,102,241,0.35)] backdrop-blur-xl ring-1 ring-white/10 transition-all duration-250 hover:scale-105 hover:border-violet-300/70 hover:text-white hover:shadow-[0_0_28px_rgba(129,140,248,0.55)] active:scale-95 cursor-pointer"
            title="ფანჯრის დახურვა"
          >
            <X className="h-4 w-4 text-violet-300 group-hover:text-white transition-colors shrink-0" />
            <span className="font-bold tracking-wider text-slate-200 group-hover:text-white transition-colors">
              დახურვა
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-500/30 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{TYPE_LABEL[calculation.type] ?? calculation.type}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-100">რუკის სრული ნახვა</h2>
            <p className="mt-1 text-xs text-slate-400">შედგენის დრო: {new Date(calculation.createdAt).toLocaleString("ka-GE")}</p>
          </div>
        </div>

        <div className="admin-calculation-details mt-5 grid min-w-0 gap-2 rounded-xl border border-slate-500/30 bg-slate-500/5 p-3 text-sm text-slate-200 sm:grid-cols-2 sm:p-4">
          <p><span className="text-slate-400">რუკის ნომერი:</span> {calculation.mapNumber ?? "—"}</p>
          <p><span className="text-slate-400">პირველი პროფილი:</span> {calculation.name1}</p>
          <p><span className="text-slate-400">დაბადება:</span> {formatWideDateDisplay(calculation.date1)} {calculation.time1}</p>
          <p><span className="text-slate-400">ადგილი:</span> {calculation.place1}</p>
          {calculation.name2 && <p><span className="text-slate-400">მეორე პროფილი:</span> {calculation.name2}</p>}
          {calculation.date2 && <p><span className="text-slate-400">მეორე დაბადება:</span> {formatWideDateDisplay(calculation.date2)} {calculation.time2}</p>}
          {calculation.place2 && <p><span className="text-slate-400">მეორე ადგილი:</span> {calculation.place2}</p>}
          {calculation.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი:</span> {formatWideDateDisplay(calculation.transitDate)}</p>}
          <p><span className="text-slate-400">სახლთა სისტემა:</span> {calculation.houseSystem}</p>
        </div>

        {wheel && (
          <div className="admin-calculation-wheel mx-auto my-6 min-w-0 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-500/30 bg-slate-500/5 p-2 sm:p-6">
            <ChartWheel ascendant={wheel.ascendant} mc={wheel.mc} cusps={wheel.houseCusps} planets={wheel.planets} size={500} />
          </div>
        )}

        {wheel && (
          <ElementBalanceGuide
            planets={wheel.planets}
            ascendant={wheel.ascendant}
          />
        )}

        <div className="admin-calculation-interpretation mt-6 min-w-0 border-t border-slate-500/30 pt-5">
          <h3 className="mb-4 text-lg font-bold text-slate-200">ასტროლოგიური ინტერპრეტაცია</h3>
          {calculation.interpretation ? (
            <InterpretationText text={calculation.interpretation} viewMetadata={calculation.viewMetadata ?? undefined} />
          ) : <p className="text-sm text-slate-400">ამ ჩანაწერისთვის ინტერპრეტაცია ვერ მოიძებნა.</p>}
        </div>
      </div>
    </div>
  );
}
