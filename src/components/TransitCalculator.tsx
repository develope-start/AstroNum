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

        <div className="glass-panel relative z-10 flex min-w-0 w-full flex-col justify-center space-y-5 overflow-hidden rounded-2xl border-amber-500/25 bg-gradient-to-r from-[#120833]/90 via-[#0e0728]/95 to-[#120833]/90 p-4 text-center shadow-xl backdrop-blur-2xl sm:rounded-[28px] sm:p-7 lg:col-span-5 lg:h-full">
          <div
            className={`transit-interval-panel mx-auto w-full max-w-2xl space-y-3 rounded-2xl border border-purple-400/20 bg-purple-950/25 p-3.5 text-left transition-all sm:p-4 ${
              inputMode === "interval" ? "transit-interval-selected" : ""
            }`}
            onPointerDown={() => inputMode !== "interval" && activateMode("interval")}
            aria-disabled={inputMode !== "interval"}
          >
            <div className="flex items-start justify-center gap-2 text-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-purple-300/30 bg-purple-500/15 text-purple-300">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის ინტერვალი</p>
                <p className="mx-auto mt-0.5 max-w-[34rem] text-[0.65rem] leading-relaxed text-slate-400">ძველი წელთაღრიცხვის 10 000 წლიდან ახალი წელთაღრიცხვის 10 000 წლამდე</p>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <SharedWideDateInput label="დან" value={transitStartDate} onChange={setTransitStartDate} onActivate={() => activateMode("interval")} />
              <SharedWideDateInput label="მდე" value={transitEndDate} onChange={setTransitEndDate} onActivate={() => activateMode("interval")} />
            </div>
            <p className="mx-auto max-w-xl text-center text-[0.65rem] leading-relaxed text-slate-500">შეგიძლიათ გამოიყენოთ კალენდრის ამოსქროლავი არჩევა ან პირდაპირ ჩაწეროთ თარიღი. ძველი წელთაღრიცხვისთვის გამოიყენეთ მინუსი, მაგალითად: -10000-01-01.</p>
          </div>

          <div
            className={`transit-date-panel flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl p-3 transition-all sm:p-4 ${inputMode === "date" ? "transit-date-active" : "transit-date-inactive"}`}
            onPointerDown={() => inputMode !== "date" && activateMode("date")}
            aria-disabled={inputMode !== "date"}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-400">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის თარიღი:</label>
            </div>

            <SharedWideDateInput label="გამოთვლის თარიღი" value={transitDate} onChange={setTransitDate} onActivate={() => activateMode("date")} />

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold w-full pt-1">
              <button
                type="button"
                onClick={() => { activateMode("date"); setTransitDate(today()); }}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  transitDate === today()
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold"
                    : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
                }`}
              >
                დღეს
              </button>
              <button
                type="button"
                onClick={() => { activateMode("date"); setTransitDate(offsetDays(1)); }}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  transitDate === offsetDays(1)
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold"
                    : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
                }`}
              >
                ხვალ
              </button>
              <button
                type="button"
                onClick={() => { activateMode("date"); setTransitDate(offsetDays(7)); }}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  transitDate === offsetDays(7)
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold"
                    : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
                }`}
              >
                +1 კვირა
              </button>
            </div>
          </div>

          <CalculationSettings value={calculation} onChange={setCalculation} />
          <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} />

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => calculate(false)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 px-6 text-xs sm:text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] disabled:opacity-50 cursor-pointer"
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
                className="w-full flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-purple-600/20 py-3 px-6 text-xs sm:text-sm font-bold text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.2)] transition-all hover:scale-[1.03] hover:border-amber-400 cursor-pointer"
              >
                <Bookmark className="h-4 w-4 text-amber-400" />
                <span>შენახვა</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3.5 text-xs font-semibold text-rose-300 shadow-lg justify-center">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3.5 text-xs font-semibold text-emerald-300 shadow-lg justify-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>✓ წარმატებით შენახულია კაბინეტში!</span>
        </div>
      )}

      {!me && interpretation && (
        <div className="flex items-start justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-purple-950/40 p-3.5 sm:p-4 text-xs font-medium text-slate-200 backdrop-blur-md text-center">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            დაურეგისტრირებელი მომხმარებელი — ეს შედეგი შენახული იქნება ამ მოწყობილობაზე 12 საათის განმავლობაში. მუდმივი
            შენახვისთვის გახსენით <a href="/cabinet" className="font-bold text-amber-300 underline decoration-amber-400/50">კაბინეტი</a>.
          </p>
        </div>
      )}

      {interpretation && (
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-2xl border-amber-500/25 bg-[#120833]/90 backdrop-blur-2xl text-left w-full">
          <p className="mb-4 text-xs font-bold tracking-wide text-amber-300">რუკის ნომერი: {mapNumber ?? "—"}</p>
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}
