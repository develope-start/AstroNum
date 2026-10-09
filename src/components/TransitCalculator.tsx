"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import SharedWideDateInput from "./WideDateInput";
import CalculationSettings, { DEFAULT_UI_CALCULATION } from "./CalculationSettings";
import HouseSystemSelect from "./HouseSystemSelect";
import type { CalculationOptions } from "@/lib/astro/ephemeris";
import type { HouseSystem } from "@/lib/astro/positions";
import InterpretationText from "./InterpretationText";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Calendar, Clock, Info } from "lucide-react";
import { compareWideDates, isWideDate } from "@/lib/astro/wideDate";

interface CacheShape {
  birth: BirthValue;
  transitDate: string;
  transitStartDate?: string;
  transitEndDate?: string;
  inputMode?: "date" | "interval";
  interpretation: string;
  mapNumber?: string | null;
  calculation?: CalculationOptions;
  houseSystem?: HouseSystem;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type TransitInputMode = "date" | "interval";

export default function TransitCalculator() {
  const me = useMe();
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [transitDate, setTransitDate] = useState(today());
  const [transitStartDate, setTransitStartDate] = useState(today());
  const [transitEndDate, setTransitEndDate] = useState(offsetDays(7));
  const [inputMode, setInputMode] = useState<TransitInputMode>("date");
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [calculation, setCalculation] = useState<CalculationOptions>({ ...DEFAULT_UI_CALCULATION });
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mapNumber, setMapNumber] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("transit");
    if (!cached) return;
    validateGuestCache("transit").then((active) => {
      if (!active) {
        setBirth(EMPTY_BIRTH);
        setTransitDate(today());
        setTransitStartDate(today());
        setTransitEndDate(offsetDays(7));
        setInputMode("date");
        setHouseSystem("placidus");
        setInterpretation(null);
        setMapNumber(null);
        return;
      }
      setBirth(cached.birth);
      setTransitDate(cached.transitDate);
      setTransitStartDate(cached.transitStartDate ?? cached.transitDate);
      setTransitEndDate(cached.transitEndDate ?? cached.transitDate);
      setInputMode(cached.inputMode ?? "date");
      setHouseSystem(cached.houseSystem ?? "placidus");
      setCalculation({ ...DEFAULT_UI_CALCULATION, ...(cached.calculation ?? {}) });
      setInterpretation(cached.interpretation);
      setMapNumber(cached.mapNumber ?? null);
    });
  }, []);

  async function calculate(save = false) {
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.lon === null || birth.timezone === null) {
      setError("შეავსეთ დაბადების მონაცემები და დაადასტურეთ ადგილის მოძებნა.");
      return;
    }
    const selectedMode = inputMode ?? "date";
    const calculationDate = selectedMode === "interval" ? transitStartDate : transitDate;
    const calculationStartDate = selectedMode === "interval" ? transitStartDate : transitDate;
    const calculationEndDate = selectedMode === "interval" ? transitEndDate : transitDate;
    if (!isWideDate(calculationStartDate) || !isWideDate(calculationEndDate)) {
      setError(selectedMode === "interval" ? "ინტერვალში მიუთითეთ სწორი საწყისი და საბოლოო თარიღები." : "მიუთითეთ სწორი ტრანზიტის თარიღი.");
      return;
    }
    if (compareWideDates(calculationStartDate, calculationEndDate) > 0) {
      setError("ტრანზიტის ინტერვალის „დან“ თარიღი უნდა იყოს „მდე“ თარიღზე ადრე ან იგივე.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chart/transit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          natal: {
            name: birth.name,
            date: birth.date,
            time: birth.time,
            place: birth.place,
            lat: birth.lat,
            lon: birth.lon,
            timezone: birth.timezone,
          },
          transitDate: calculationDate,
          transitStartDate: calculationStartDate,
          transitEndDate: calculationEndDate,
          calculation,
          houseSystem,
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
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("transit", { birth, transitDate: calculationDate, transitStartDate: calculationStartDate, transitEndDate: calculationEndDate, inputMode: selectedMode, calculation, houseSystem, interpretation: data.interpretation, mapNumber: data.mapNumber ?? null });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  function activateMode(mode: TransitInputMode) {
    setInputMode(mode);
    setError(null);
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      <div className="grid w-full min-w-0 gap-4 text-center sm:gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="relative z-30 min-w-0 w-full text-center lg:col-span-7">
          <BirthFields value={birth} onChange={setBirth} legend="01. ნატალური მონაცემები" />
        </div>

        <div className="glass-panel relative z-10 flex min-w-0 w-full flex-col justify-center space-y-5 overflow-hidden rounded-2xl border-white/10 bg-[#090d1e]/85 p-4 text-center shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-2xl sm:rounded-[28px] sm:p-7 lg:col-span-5 lg:h-full">
          {/* Segmented Mode Switch */}
          <div className="flex rounded-full border border-white/10 bg-[#070a16] p-1 shadow-inner" role="group" aria-label="ტრანზიტის პერიოდის არჩევა">
            <button
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                inputMode === "date"
                  ? "bg-gradient-to-r from-cyan-500/30 to-violet-600/30 text-cyan-200 border border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={inputMode === "date"}
              onClick={() => activateMode("date")}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>ერთი თარიღი</span>
            </button>
            <button
              type="button"
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                inputMode === "interval"
                  ? "bg-gradient-to-r from-cyan-500/30 to-violet-600/30 text-cyan-200 border border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={inputMode === "interval"}
              onClick={() => activateMode("interval")}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>თარიღების პერიოდი</span>
            </button>
          </div>

          {inputMode === "interval" && (
            <div
              className="mx-auto w-full space-y-3 rounded-2xl border border-white/10 bg-[#070a16]/80 p-3.5 text-left transition-all sm:p-4 shadow-inner"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის ინტერვალი</p>
                  <p className="text-[0.65rem] leading-relaxed text-slate-400">ძველი წელთაღრიცხვის 10 000 წლიდან ახალი წელთაღრიცხვის 10 000 წლამდე</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <span className="text-[0.68rem] font-bold text-slate-300">დაწყება</span>
                  <SharedWideDateInput label="დაწყების თარიღი" value={transitStartDate} onChange={setTransitStartDate} onActivate={() => activateMode("interval")} />
                </div>
                <div className="grid gap-1">
                  <span className="text-[0.68rem] font-bold text-slate-300">დასასრული</span>
                  <SharedWideDateInput label="დასასრულის თარიღი" value={transitEndDate} onChange={setTransitEndDate} onActivate={() => activateMode("interval")} />
                </div>
              </div>
            </div>
          )}

          {inputMode === "date" && (
            <div
              className="flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-[#070a16]/80 p-3.5 transition-all sm:p-4 shadow-inner"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300">
                  <Calendar className="h-4 w-4 text-cyan-300" />
                </div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის თარიღი</label>
              </div>

              <SharedWideDateInput label="გამოთვლის თარიღი" value={transitDate} onChange={setTransitDate} onActivate={() => activateMode("date")} />

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold w-full pt-1">
                <button
                  type="button"
                  onClick={() => { activateMode("date"); setTransitDate(today()); }}
                  className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                    transitDate === today()
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                      : "bg-white/[0.04] text-slate-300 hover:text-cyan-300 border border-white/10"
                  }`}
                >
                  დღეს
                </button>
                <button
                  type="button"
                  onClick={() => { activateMode("date"); setTransitDate(offsetDays(1)); }}
                  className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                    transitDate === offsetDays(1)
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                      : "bg-white/[0.04] text-slate-300 hover:text-cyan-300 border border-white/10"
                  }`}
                >
                  ხვალ
                </button>
                <button
                  type="button"
                  onClick={() => { activateMode("date"); setTransitDate(offsetDays(7)); }}
                  className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                    transitDate === offsetDays(7)
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                      : "bg-white/[0.04] text-slate-300 hover:text-cyan-300 border border-white/10"
                  }`}
                >
                  +1 კვირა
                </button>
              </div>
            </div>
          )}

          <CalculationSettings value={calculation} onChange={setCalculation} />
          <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} />

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
                  <span>✦ ტრანზიტების გამოთვლა</span>
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
        <div className="glass-panel interpretation-container rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl border-white/10 bg-[#0b0f19]/95 backdrop-blur-2xl text-left w-full">
          <div className="mb-6 border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-normal">
                ასტროლოგიური ინტერპრეტაცია &amp; ტრანზიტული ანალიზი
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                მიმდინარე პლანეტარული ზეგავლენები და ციური მოვლენების ანალიზი
              </p>
            </div>
            {mapNumber && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 self-start sm:self-auto">
                <span>რუკის ნომერი: {mapNumber}</span>
              </div>
            )}
          </div>
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}
