"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Calendar, Clock } from "lucide-react";

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
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div className="relative z-30 text-center">
        <BirthFields value={birth} onChange={setBirth} legend="01. ნატალური მონაცემები" />
      </div>

      <div className="glass-panel relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[28px] p-6 border-amber-500/25 bg-gradient-to-r from-[#120833]/90 via-[#0e0728]/95 to-[#120833]/90 backdrop-blur-2xl shadow-xl text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-400">
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200">თარიღი:</label>
          </div>

          <input
            type="date"
            value={transitDate}
            onChange={(e) => setTransitDate(e.target.value)}
            className="rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-2.5 text-xs font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-500/40 text-center"
          />

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTransitDate(today())}
              className={`rounded-full px-3 py-1.5 transition-all ${
                transitDate === today()
                  ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                  : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
              }`}
            >
              დღეს
            </button>
            <button
              type="button"
              onClick={() => setTransitDate(offsetDays(1))}
              className={`rounded-full px-3 py-1.5 transition-all ${
                transitDate === offsetDays(1)
                  ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                  : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
              }`}
            >
              ხვალ
            </button>
            <button
              type="button"
              onClick={() => setTransitDate(offsetDays(7))}
              className={`rounded-full px-3 py-1.5 transition-all ${
                transitDate === offsetDays(7)
                  ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                  : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
              }`}
            >
              +1 კვირა
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-2 sm:pt-0">
          <button
            onClick={() => calculate(false)}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] disabled:opacity-50"
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-purple-600/20 px-6 py-3.5 text-sm font-bold text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.2)] transition-all hover:scale-105 hover:border-amber-400"
            >
              <Bookmark className="h-4 w-4 text-amber-400" />
              <span>შენახვა</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-5 py-4 text-xs font-semibold text-rose-300 shadow-lg">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-5 py-4 text-xs font-semibold text-emerald-300 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>✓ წარმატებით შენახულია კაბინეტში!</span>
        </div>
      )}

      {interpretation && (
        <div className="glass-panel rounded-[28px] p-6 sm:p-8 shadow-2xl border-amber-500/25 bg-[#120833]/90 backdrop-blur-2xl">
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}



