"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationOverlay from "./InterpretationOverlay";
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
  const [isInterpretationOpen, setIsInterpretationOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mapNumber, setMapNumber] = useState<string | null>(null);
  const [teaserPreview, setTeaserPreview] = useState<{ nameA: string; nameB: string; planRequired?: boolean } | null>(null);

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
    setIsInterpretationOpen(true);
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
      const data = await readApiResponse<{
        error?: string;
        code?: string;
        interpretation?: string;
        mapNumber?: string | null;
      }>(res);
      if (res.status === 401 || data?.code === "AUTH_REQUIRED" || data?.code === "PLAN_REQUIRED") {
        setTeaserPreview({
          nameA: a.name,
          nameB: b.name,
          planRequired: data?.code === "PLAN_REQUIRED",
        });
        setError(null);
        setIsInterpretationOpen(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        setIsInterpretationOpen(false);
        return;
      }
      if (!data.interpretation) {
        setError("სერვერმა სინასტრიის ინტერპრეტაცია არ დააბრუნა.");
        setIsInterpretationOpen(false);
        return;
      }
      setTeaserPreview(null);
      setInterpretation(data.interpretation);
      setMapNumber(data.mapNumber ?? null);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("synastry", { a, b, calculation, houseSystem, interpretation: data.interpretation, mapNumber: data.mapNumber ?? null });
    } catch (error) {
      setError(getRequestError(error));
      setIsInterpretationOpen(false);
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
        <CalculationSettings value={calculation} onChange={(next) => {
          setCalculation(next);
          if (next.ephemeris === "astronomy" && !["placidus", "whole_sign", "equal", "porphyry"].includes(houseSystem)) setHouseSystem("placidus");
        }} />
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-center">
          <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} ephemeris={calculation.ephemeris ?? "swiss"} />
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

      {teaserPreview && (
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-b from-[#180d22]/95 via-[#0e0717]/90 to-[#07040d]/95 p-6 sm:p-9 text-center shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/15 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.4)]">
            <Heart className="h-6 w-6 text-rose-400 animate-pulse" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-950/40 px-3.5 py-1 text-xs font-bold text-rose-300 shadow-md">
            <span>სინასტრიული რეზონანსი · წინასწარი შეფასება</span>
          </div>
          <h3 className="mt-3 font-display text-xl sm:text-2xl font-black text-white">
            {teaserPreview.nameA} &amp; {teaserPreview.nameB}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            ორი რუკის სინთეზი მზადაა! აღმოჩენილია ურთიერთქმედების საკვანძო ასპექტები, ვენერა-მარსის მიზიდულობა და კარმული კავშირი.
          </p>

          <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">ქიმია &amp; მიზიდულობა</span>
              <p className="mt-1 text-sm font-bold text-white">ვენერა ✦ მარსი</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ძლიერი მაგნიტური მიზიდულობა</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">ემოციური კომფორტი</span>
              <p className="mt-1 text-sm font-bold text-white">მთვარე ✦ მზე</p>
              <p className="text-[11px] text-slate-400 mt-0.5">შინაგანი გაგება &amp; სითბო</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-md">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">ურთიერთობის მისია</span>
              <p className="mt-1 text-sm font-bold text-white">კარმული კვანძები</p>
              <p className="text-[11px] text-slate-400 mt-0.5">ზრდისა და განვითარების გაკვეთილი</p>
            </div>
          </div>

          <div className="relative mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center">
            <div className="filter blur-sm select-none opacity-40 text-xs text-slate-300 pointer-events-none line-clamp-3">
              პარტნიორებს შორის შეინიშნება უშუალო ემოციური თანხვედრა. პირველი პარტნიორის ვენერის მდებარეობა მეორე პარტნიორის ასცენდენტთან ქმნის მყისიერ სიმპათიას, ხოლო მთვარის ტრიგონი უზრუნველყოფს ხანგრძლივ უსაფრთხოებას...
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-[#0a0712]/80 backdrop-blur-xs rounded-2xl">
              <p className="text-xs sm:text-sm font-extrabold text-white">
                {teaserPreview.planRequired ? "სრული სინასტრიული რუკა ხელმისაწვდომია Pro ან Enterprise პაკეტით" : "სრული ანალიზისა და ასპექტების გასახსნელად შედით ანგარიშში"}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                <a
                  href="/cabinet"
                  className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-rose-500/30 hover:brightness-110 transition-all cursor-pointer"
                >
                  ✦ სრული რუკის გახსნა (ანგარიში)
                </a>
                <a
                  href="/#pricing"
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  პაკეტების ნახვა
                </a>
              </div>
            </div>
          </div>
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
        <button
          type="button"
          onClick={() => setIsInterpretationOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-5 py-2.5 text-xs font-bold text-violet-100 transition hover:bg-violet-500/20 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          ინტერპრეტაციის გახსნა
        </button>
      )}

      <InterpretationOverlay
        open={isInterpretationOpen}
        loading={loading}
        title="ასტროლოგიური ინტერპრეტაცია და ანალიზი"
        subtitle="ორი ნატალური რუკის შედარებითი ანალიზი"
        interpretation={interpretation}
        mapNumber={mapNumber}
        onClose={() => setIsInterpretationOpen(false)}
      />
    </div>
  );
}
