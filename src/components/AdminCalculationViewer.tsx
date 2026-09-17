"use client";

import InterpretationText from "@/components/InterpretationText";
import ChartWheel, { WheelPlanet } from "@/components/ChartWheel";

export type CalculationViewData = {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-400/50 bg-[#0d0a18] p-5 shadow-[0_0_35px_rgba(148,163,184,0.28)] sm:p-8">
        
        {/* Sticky Fixed Top-Right Red Glowing Close Button */}
        <div className="sticky top-0 z-50 flex justify-end float-right -mt-2 -mr-2 sm:-mt-4 sm:-mr-4 mb-2 pointer-events-none">
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-rose-500/70 bg-gradient-to-r from-rose-950/90 via-red-950/90 to-rose-950/90 px-4 py-2 text-xs sm:text-sm font-black text-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.55)] ring-1 ring-rose-500/40 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-rose-400 hover:bg-gradient-to-r hover:from-rose-900 hover:via-red-800 hover:to-rose-900 hover:shadow-[0_0_30px_rgba(244,63,94,0.95)] active:scale-95 cursor-pointer"
            title="ფანჯრის დახურვა"
          >
            <span className="text-base font-black text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.85)] group-hover:text-white transition-colors">✕</span>
            <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-red-200 to-rose-400 group-hover:from-white group-hover:to-rose-100 transition-colors">
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

        <div className="mt-5 grid gap-2 rounded-xl border border-slate-500/30 bg-slate-500/5 p-4 text-sm text-slate-200 sm:grid-cols-2">
          <p><span className="text-slate-400">პირველი პროფილი:</span> {calculation.name1}</p>
          <p><span className="text-slate-400">დაბადება:</span> {calculation.date1} {calculation.time1}</p>
          <p><span className="text-slate-400">ადგილი:</span> {calculation.place1}</p>
          {calculation.name2 && <p><span className="text-slate-400">მეორე პროფილი:</span> {calculation.name2}</p>}
          {calculation.date2 && <p><span className="text-slate-400">მეორე დაბადება:</span> {calculation.date2} {calculation.time2}</p>}
          {calculation.place2 && <p><span className="text-slate-400">მეორე ადგილი:</span> {calculation.place2}</p>}
          {calculation.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი:</span> {calculation.transitDate}</p>}
          <p><span className="text-slate-400">სახლთა სისტემა:</span> {calculation.houseSystem}</p>
        </div>

        {wheel && (
          <div className="mx-auto my-6 max-w-3xl rounded-2xl border border-slate-500/30 bg-slate-500/5 p-3 sm:p-6">
            <ChartWheel ascendant={wheel.ascendant} mc={wheel.mc} cusps={wheel.houseCusps} planets={wheel.planets} size={500} />
          </div>
        )}

        <div className="mt-6 border-t border-slate-500/30 pt-5">
          <h3 className="mb-4 text-lg font-bold text-slate-200">ასტროლოგიური ინტერპრეტაცია</h3>
          {calculation.interpretation ? <InterpretationText text={calculation.interpretation} /> : <p className="text-sm text-slate-400">ამ ჩანაწერისთვის ინტერპრეტაცია ვერ მოიძებნა.</p>}
        </div>
      </div>
    </div>
  );
}
