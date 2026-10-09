"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Info, Heart } from "lucide-react";
import CalculationSettings, { DEFAULT_UI_CALCULATION } from "./CalculationSettings";
import HouseSystemSelect from "./HouseSystemSelect";
import type { CalculationOptions } from "@/lib/astro/ephemeris";
import type { HouseSystem } from "@/lib/astro/positions";

interface CacheShape {
  a: BirthValue;
  b: BirthValue;
  interpretation: string;
  mapNumber?: string | null;
  calculation?: CalculationOptions;
  houseSystem?: HouseSystem;
}

export default function SynastryCalculator() {
  const me = useMe();
  const [a, setA] = useState<BirthValue>(EMPTY_BIRTH);
  const [b, setB] = useState<BirthValue>(EMPTY_BIRTH);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [calculation, setCalculation] = useState<CalculationOptions>({ ...DEFAULT_UI_CALCULATION });
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mapNumber, setMapNumber] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("synastry");
    if (!cached) return;
    validateGuestCache("synastry").then((active) => {
      if (!active) {
        setA(EMPTY_BIRTH);
        setB(EMPTY_BIRTH);
        setHouseSystem("placidus");
        setInterpretation(null);
        setMapNumber(null);
        return;
      }
      setA(cached.a);
      setB(cached.b);
      setHouseSystem(cached.houseSystem ?? "placidus");
      setCalculation({ ...DEFAULT_UI_CALCULATION, ...(cached.calculation ?? {}) });
      setInterpretation(cached.interpretation);
      setMapNumber(cached.mapNumber ?? null);
    });
  }, []);

  function ready(p: BirthValue) {
    return p.name && p.date && p.time && p.lat !== null && p.lon !== null && p.timezone !== null;
  }

  async function calculate(save = false) {
    if (!ready(a) || !ready(b)) {
      setError("შეავსეთ ორივე ადამიანის სახელი, თარიღი, დრო და დაბადების ადგილი.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const toPerson = (p: BirthValue) => ({
        name: p.name,
        date: p.date,
        time: p.time,
        place: p.place,
        lat: p.lat,
        lon: p.lon,
        timezone: p.timezone,
        calculation,
      });
      const res = await fetch("/api/chart/synastry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personA: toPerson(a), personB: toPerson(b), calculation, houseSystem, save }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setInterpretation(data.interpretation);
      setMapNumber(data.mapNumber ?? null);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("synastry", { a, b, calculation, houseSystem, interpretation: data.interpretation, mapNumber: data.mapNumber ?? null });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      <div className="relative z-30 grid gap-4 sm:gap-6 lg:grid-cols-2 text-center w-full">
        <BirthFields value={a} onChange={setA} legend="01. პირველი ადამიანი" />
        <BirthFields value={b} onChange={setB} legend="02. მეორე ადამიანი" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CalculationSettings value={calculation} onChange={setCalculation} />
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
          <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} />
        </div>
      </div>

      <div className="glass-panel relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border-white/10 bg-[#090d1e]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center w-full">
        <div className="flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-wider">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/40 bg-gradient-to-br from-rose-500/25 to-pink-600/20 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] shrink-0">
            <Heart className="h-5 w-5 text-rose-300 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="block text-xs sm:text-sm font-extrabold bg-gradient-to-r from-rose-300 via-pink-300 to-violet-300 bg-clip-text text-transparent">სინასტრიული თავსებადობა</span>
            <span className="text-[0.68rem] text-slate-400 font-normal">ორი ნატალური რუკის შედარებითი ანალიზი</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => calculate(false)}
            disabled={loading}
            className="calc-submit-btn w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-6 sm:px-8 py-3.5 text-xs sm:text-sm font-extrabold text-slate-950 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>ითვლის…</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-slate-950" />
                <span>✦ თავსებადობის გამოთვლა</span>
              </>
            )}
          </button>

          {me && (
            <button
              onClick={() => calculate(true)}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-xs sm:text-sm font-bold text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:bg-white/[0.08] hover:border-cyan-400/40 cursor-pointer"
            >
              <Bookmark className="h-4 w-4 text-cyan-400" />
              <span>შენახვა</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3.5 text-xs font-semibold text-rose-300 shadow-lg justify-center backdrop-blur-xl">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3.5 text-xs font-semibold text-emerald-300 shadow-lg justify-center backdrop-blur-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>✓ წარმატებით შენახულია კაბინეტში!</span>
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

      {interpretation && (
        <div className="glass-panel interpretation-container rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-2xl border-white/10 bg-[#090d1e]/90 backdrop-blur-2xl text-left w-full">
          <h3 className="mb-4 border-b border-white/10 pb-3 text-center text-xl font-bold bg-gradient-to-r from-rose-300 via-pink-300 to-violet-300 bg-clip-text text-transparent sm:text-2xl">
            ასტროლოგიური ინტერპრეტაცია &amp; ანალიზი
          </h3>
          <p className="mb-4 text-center text-sm font-bold tracking-wide text-cyan-300">რუკის ნომერი: {mapNumber ?? "—"}</p>
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}
