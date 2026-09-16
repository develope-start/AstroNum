"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Info, Heart } from "lucide-react";

interface CacheShape {
  a: BirthValue;
  b: BirthValue;
  interpretation: string;
}

export default function SynastryCalculator() {
  const me = useMe();
  const [a, setA] = useState<BirthValue>(EMPTY_BIRTH);
  const [b, setB] = useState<BirthValue>(EMPTY_BIRTH);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("synastry");
    if (!cached) return;
    validateGuestCache("synastry").then((active) => {
      if (!active) {
        setA(EMPTY_BIRTH);
        setB(EMPTY_BIRTH);
        setInterpretation(null);
        return;
      }
      setA(cached.a);
      setB(cached.b);
      setInterpretation(cached.interpretation);
    });
  }, []);

  function ready(p: BirthValue) {
    return p.name && p.date && p.time && p.lat !== null && p.timezone !== null;
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
      });
      const res = await fetch("/api/chart/synastry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personA: toPerson(a), personB: toPerson(b), save }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setInterpretation(data.interpretation);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("synastry", { a, b, interpretation: data.interpretation });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl space-y-4 sm:space-y-6 text-center w-full overflow-x-hidden">
      <div className="relative z-30 grid gap-4 sm:gap-6 lg:grid-cols-2 text-center w-full">
        <BirthFields value={a} onChange={setA} legend="01. პირველი ადამიანი" />
        <BirthFields value={b} onChange={setB} legend="02. მეორე ადამიანი" />
      </div>

      <div className="glass-panel relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border-amber-500/25 bg-gradient-to-r from-[#120833]/90 via-[#0e0728]/95 to-[#120833]/90 backdrop-blur-2xl shadow-xl text-center w-full">
        <div className="flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider text-amber-300">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/15 text-rose-300 shadow-[0_0_18px_rgba(244,63,94,0.35)] shrink-0">
            <Heart className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="block text-xs sm:text-sm font-extrabold text-amber-300">სინასტრიული თავსებადობა</span>
            <span className="text-[0.65rem] sm:text-[0.68rem] text-slate-400 font-normal">ორი ნატალური რუკის შედარებითი ანალიზი</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => calculate(false)}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] disabled:opacity-50"
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-purple-600/20 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.2)] transition-all hover:scale-105 hover:border-amber-400"
            >
              <Bookmark className="h-4 w-4 text-amber-400" />
              <span>შენახვა</span>
            </button>
          )}
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
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-purple-950/40 p-3.5 text-xs font-medium text-slate-200 backdrop-blur-md justify-center">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            სტუმარი რეჟიმია — შედეგი ინახება მხოლოდ ამ მოწყობილობაზე, 12 საათის განმავლობაში.
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



