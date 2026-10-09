"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import ChartExportButton from "./ChartExportButton";
import ChartMapSection from "./ChartMapSection";
import type { WheelPlanet } from "./ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import ElementBalanceGuide from "./ElementBalanceGuide";
import CalculationSettings, { DEFAULT_UI_CALCULATION } from "./CalculationSettings";
import HouseSystemSelect from "./HouseSystemSelect";
import type { CalculationOptions } from "@/lib/astro/ephemeris";
import type { HouseSystem } from "@/lib/astro/positions";
import { saveGuestCache, loadGuestCache, clearGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface WheelData {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
  aspects: AspectHit[];
  fixedStars: Array<{ star: string; planet: string; longitude: number; orb: number }>;
  planetHouses: Record<string, number>;
}

interface CacheShape {
  birth: BirthValue;
  houseSystem: HouseSystem;
  interpretation: string;
  wheel: WheelData | null;
  mapNumber?: string | null;
  calculation?: CalculationOptions;
}

export default function NatalCalculator() {
  const me = useMe();
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [calculation, setCalculation] = useState<CalculationOptions>({ ...DEFAULT_UI_CALCULATION });
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [wheel, setWheel] = useState<WheelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mapNumber, setMapNumber] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("natal");
    if (!cached) return;
    validateGuestCache("natal").then((active) => {
      if (!active) {
        setBirth(EMPTY_BIRTH);
        setHouseSystem("placidus");
        setInterpretation(null);
        setWheel(null);
        setMapNumber(null);
        return;
      }
      const requiredPoints = new Set(["Lilith", "Selena", "Chiron", "SouthNode"]);
      const hasExpandedPointSet = cached.wheel?.planets?.some((planet) => requiredPoints.has(planet.name)) &&
        [...requiredPoints].every((name) => cached.wheel?.planets?.some((planet) => planet.name === name));
      if (cached.wheel && !hasExpandedPointSet) {
        clearGuestCache("natal");
        setInterpretation(null);
        setWheel(null);
        setMapNumber(null);
        return;
      }
      setBirth(cached.birth);
      setHouseSystem(cached.houseSystem);
      setCalculation({ ...DEFAULT_UI_CALCULATION, ...(cached.calculation ?? {}) });
      setInterpretation(cached.interpretation);
      setWheel(cached.wheel ? {
        ...cached.wheel,
        aspects: cached.wheel.aspects ?? [],
        fixedStars: cached.wheel.fixedStars ?? [],
        planetHouses: cached.wheel.planetHouses ?? {},
      } : null);
      setMapNumber(cached.mapNumber ?? null);
    });
  }, []);

  async function calculate(save = false) {
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.lon === null || birth.timezone === null) {
      setError("შეავსეთ სახელი, თარიღი, დრო და დაბადების ადგილი (დაადასტურეთ ადგილის მოძებნა).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chart/natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: birth.name,
          date: birth.date,
          time: birth.time,
          place: birth.place,
          lat: birth.lat,
          lon: birth.lon,
          timezone: birth.timezone,
          houseSystem,
          calculation,
          save,
        }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setInterpretation(data.interpretation);
      setMapNumber(data.mapNumber ?? null);
      const w: WheelData = {
        ascendant: data.result.ascendant,
        mc: data.result.mc,
        houseCusps: data.result.houseCusps,
        planets: data.result.planets.map((p: { name: string; longitude: number }) => ({
          name: p.name,
          longitude: p.longitude,
        })),
        aspects: data.result.aspects ?? [],
        fixedStars: data.result.advanced?.fixedStarContacts ?? [],
        planetHouses: data.result.planetHouses ?? {},
      };
      setWheel(w);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("natal", { birth, houseSystem, calculation, interpretation: data.interpretation, wheel: w, mapNumber: data.mapNumber ?? null });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      {/* Top Input & Action Grid for Desktop / Stacked for Mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start text-center w-full">
        {/* Birth Fields Card */}
        <div className="relative z-30 text-center w-full lg:col-span-7">
          <BirthFields value={birth} onChange={setBirth} legend="01. დაბადების მონაცემები" />
        </div>

        {/* House System Filter & Action Card */}
        <div className="glass-panel relative z-10 space-y-5 rounded-2xl sm:rounded-[28px] p-4 sm:p-7 border-white/10 bg-[#090d1e]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center w-full lg:col-span-5 lg:h-full flex flex-col justify-center">
          <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} />

          <CalculationSettings value={calculation} onChange={setCalculation} />

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => calculate(false)}
              disabled={loading}
              className="calc-submit-btn w-full flex items-center justify-center gap-2 rounded-full py-3.5 px-6 text-xs sm:text-sm font-extrabold text-slate-950 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>ითვლის…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-slate-950" />
                  <span>✦ რუკის გამოთვლა</span>
                </>
              )}
            </button>

            {me && (
              <button
                onClick={() => calculate(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-3 px-6 text-xs sm:text-sm font-bold text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:bg-white/[0.08] hover:border-cyan-400/40 cursor-pointer"
              >
                <Bookmark className="h-4 w-4 text-cyan-400" />
                <span>შენახვა</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3.5 sm:px-5 sm:py-4 text-xs font-semibold text-rose-300 shadow-lg backdrop-blur-xl">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3.5 sm:px-5 sm:py-4 text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>✓ წარმატებით შენახულია კაბინეტში!</span>
        </div>
      )}

      <div data-chart-export-root="true" className="chart-builder-result space-y-4 sm:space-y-6">
        {/* Chart Wheel Display */}
        {wheel && (
          <ChartMapSection
            title="ზოდიაქალური წრე"
            className="w-full"
            ascendant={wheel.ascendant}
            mc={wheel.mc}
            houseCusps={wheel.houseCusps}
            planets={wheel.planets}
            aspects={wheel.aspects}
            fixedStars={wheel.fixedStars}
            planetHouses={wheel.planetHouses}
          />
        )}

        {wheel && <ElementBalanceGuide planets={wheel.planets} ascendant={wheel.ascendant} />}

        {(wheel || interpretation) && (
          <div className="flex justify-end">
            <ChartExportButton className="flex items-center justify-center gap-1.5 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-purple-950/60 px-5 py-2.5 text-xs font-bold text-cyan-200 shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all hover:bg-cyan-400 hover:text-slate-950 cursor-pointer" />
          </div>
        )}

        {!me && interpretation && (
          <div className="flex items-start justify-center gap-2.5 rounded-2xl border border-cyan-500/30 bg-[#0a0e22]/80 p-3.5 sm:p-4 text-xs font-medium text-slate-200 backdrop-blur-md text-center shadow-lg">
            <Info className="h-4 w-4 text-cyan-300 shrink-0 mt-0.5" />
            <p>
              დაურეგისტრირებელი მომხმარებელი — ეს შედეგი შენახული იქნება ამ მოწყობილობაზე 12 საათის განმავლობაში. მუდმივი
              შენახვისთვის გახსენით <a href="/cabinet" className="font-bold text-cyan-300 underline decoration-cyan-400/50">კაბინეტი</a>.
            </p>
          </div>
        )}

        {/* Full Width Interpretation Block */}
        {interpretation && (
          <div className="glass-panel interpretation-container rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-2xl border-white/10 bg-[#090d1e]/90 backdrop-blur-2xl text-left w-full">
            <h3 className="mb-4 border-b border-white/10 pb-3 text-center text-xl font-bold bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent sm:text-2xl">
              ასტროლოგიური ინტერპრეტაცია &amp; ანალიზი
            </h3>
            <p className="mb-4 text-center text-sm font-bold tracking-wide text-cyan-300">რუკის ნომერი: {mapNumber ?? "—"}</p>
            <InterpretationText text={interpretation} />
          </div>
        )}
      </div>
    </div>
  );
}
