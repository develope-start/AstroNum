"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Calendar, Clock, Info } from "lucide-react";

interface CacheShape {
  birth: BirthValue;
  transitDate: string;
  interpretation: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function TransitCalculator() {
  const me = useMe();
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [transitDate, setTransitDate] = useState(today());
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("transit");
    if (!cached) return;
    validateGuestCache("transit").then((active) => {
      if (!active) {
        setBirth(EMPTY_BIRTH);
        setTransitDate(today());
        setInterpretation(null);
        return;
      }
      setBirth(cached.birth);
      setTransitDate(cached.transitDate);
      setInterpretation(cached.interpretation);
    });
  }, []);

  async function calculate(save = false) {
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.timezone === null) {
      setError("შეავსეთ დაბადების მონაცემები და დაადასტურეთ ადგილის მოძებნა.");
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
          transitDate,
          save,
        }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setInterpretation(data.interpretation);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("transit", { birth, transitDate, interpretation: data.interpretation });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start text-center w-full">
        <div className="relative z-30 text-center w-full lg:col-span-7">
          <BirthFields value={birth} onChange={setBirth} legend="01. ნატალური მონაცემები" />
        </div>

        <div className="glass-panel relative z-10 space-y-5 rounded-2xl sm:rounded-[28px] p-4 sm:p-7 border-amber-500/25 bg-gradient-to-r from-[#120833]/90 via-[#0e0728]/95 to-[#120833]/90 backdrop-blur-2xl shadow-xl text-center w-full lg:col-span-5 lg:h-full flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center gap-2.5 w-full">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-400">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის თარიღი:</label>
            </div>

            <input
              type="date"
              value={transitDate}
              onChange={(e) => setTransitDate(e.target.value)}
              className="w-full rounded-xl sm:rounded-2xl border border-amber-500/25 bg-[#080418] px-3 py-2.5 text-xs font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-500/40 text-center cursor-pointer"
            />

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold w-full pt-1">
              <button
                type="button"
                onClick={() => setTransitDate(today())}
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
                onClick={() => setTransitDate(offsetDays(1))}
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
                onClick={() => setTransitDate(offsetDays(7))}
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
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}



