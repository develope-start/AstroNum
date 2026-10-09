"use client";

import { useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import HouseSystemSelect from "./HouseSystemSelect";
import InterpretationText from "./InterpretationText";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Loader2, Sparkles, Orbit } from "lucide-react";
import type { HouseSystem } from "@/lib/astro/positions";

type AdvancedMode = "progression" | "directions" | "return" | "eclipse" | "harmonics";

const today = () => new Date().toISOString().slice(0, 10);
const nextYear = () => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
};

const modeLabels: Record<AdvancedMode, string> = {
  progression: "მეორეული პროგრესია",
  directions: "Solar Arc",
  return: "Planetary Return",
  eclipse: "დაბნელებები",
  harmonics: "ჰარმონიკები / მიდპოინტები",
};

function dateInputClass() {
  return "w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2.5 text-sm font-semibold text-slate-100 outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(56,189,248,0.2)]";
}

export default function AdvancedCalculator() {
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [mode, setMode] = useState<AdvancedMode>("progression");
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [targetDate, setTargetDate] = useState(today());
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(nextYear());
  const [planet, setPlanet] = useState("Sun");
  const [eclipseType, setEclipseType] = useState("solar");
  const [harmonic, setHarmonic] = useState("5");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function natalPayload() {
    return { name: birth.name, date: birth.date, time: birth.time, place: birth.place, lat: birth.lat, lon: birth.lon, timezone: birth.timezone };
  }

  async function calculate() {
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.lon === null || birth.timezone === null) {
      setError("შეავსეთ დაბადების მონაცემები და დაადასტურეთ ადგილი.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let endpoint = "";
      let body: Record<string, unknown> = {};
      const natal = natalPayload();
      if (mode === "progression") { endpoint = "/api/chart/progression"; body = { natal, targetDate, houseSystem }; }
      if (mode === "directions") { endpoint = "/api/chart/directions"; body = { natal, targetDate, houseSystem: "placidus" }; }
      if (mode === "return") { endpoint = "/api/chart/return"; body = { natal, planet, startDate, endDate, houseSystem }; }
      if (mode === "eclipse") { endpoint = "/api/chart/eclipses"; body = { type: eclipseType, startDate, backward: false }; }
      if (mode === "harmonics") { endpoint = "/api/chart/harmonics"; body = { natal, harmonic: Number(harmonic) }; }
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await readApiResponse<Record<string, unknown>>(response);
      if (!response.ok) { setError(String(data.error ?? `სერვერის შეცდომა (${response.status})`)); return; }
      setResult(data);
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setLoading(false);
    }
  }

  const resultObject = result?.result as Record<string, unknown> | undefined;
  const compactResult = resultObject ? {
    method: resultObject.method,
    targetDate: resultObject.targetDate,
    returnUtcIso: resultObject.returnUtcIso,
    progressedUtcIso: resultObject.progressedUtcIso,
    arc: resultObject.arc,
    orb: resultObject.orb,
    maximum: resultObject.maximum,
    aspects: Array.isArray(resultObject.aspects) ? resultObject.aspects : undefined,
    planets: Array.isArray(resultObject.planets) ? resultObject.planets : undefined,
    midpoints: Array.isArray(resultObject.midpoints) ? resultObject.midpoints.slice(0, 30) : undefined,
  } : result;

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <BirthFields value={birth} onChange={setBirth} legend="01. საწყისი ნატალური მონაცემები" />
        <div className="glass-panel space-y-4 rounded-2xl p-4 sm:rounded-[28px] sm:p-7 border-white/10 bg-[#090d1e]/85 shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-300">
              <Orbit className="h-4 w-4" />
            </div>
            <h2 className="text-base font-black sm:text-lg bg-gradient-to-r from-violet-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">გაფართოებული მეთოდები</h2>
          </div>
          
          <label className="block text-xs font-bold text-slate-300">
            მეთოდის არჩევა
            <select value={mode} onChange={(event) => setMode(event.target.value as AdvancedMode)} className={`${dateInputClass()} mt-1`}>
              {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value} className="bg-[#070a16] text-slate-100">{label}</option>)}
            </select>
          </label>

          {(mode === "progression" || mode === "return") && <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} />}

          {(mode === "progression" || mode === "directions") && (
            <label className="block text-xs font-bold text-slate-300">
              სამიზნე თარიღი
              <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className={`${dateInputClass()} mt-1`} />
            </label>
          )}

          {mode === "return" && (
            <>
              <label className="block text-xs font-bold text-slate-300">
                პლანეტა
                <select value={planet} onChange={(event) => setPlanet(event.target.value)} className={`${dateInputClass()} mt-1`}>
                  <option value="Sun" className="bg-[#070a16]">მზე — Solar Return</option>
                  <option value="Moon" className="bg-[#070a16]">მთვარე — Lunar Return</option>
                  <option value="Mercury" className="bg-[#070a16]">მერკური</option>
                  <option value="Venus" className="bg-[#070a16]">ვენერა</option>
                  <option value="Mars" className="bg-[#070a16]">მარსი</option>
                  <option value="Jupiter" className="bg-[#070a16]">იუპიტერი</option>
                  <option value="Saturn" className="bg-[#070a16]">სატურნი</option>
                  <option value="Uranus" className="bg-[#070a16]">ურანი</option>
                  <option value="Neptune" className="bg-[#070a16]">ნეპტუნი</option>
                  <option value="Pluto" className="bg-[#070a16]">პლუტონი</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-slate-300">
                  დან
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${dateInputClass()} mt-1`} />
                </label>
                <label className="text-xs font-bold text-slate-300">
                  მდე
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${dateInputClass()} mt-1`} />
                </label>
              </div>
            </>
          )}

          {mode === "eclipse" && (
            <>
              <label className="block text-xs font-bold text-slate-300">
                ტიპი
                <select value={eclipseType} onChange={(event) => setEclipseType(event.target.value)} className={`${dateInputClass()} mt-1`}>
                  <option value="solar" className="bg-[#070a16]">მზის დაბნელება</option>
                  <option value="lunar" className="bg-[#070a16]">მთვარის დაბნელება</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-300">
                ძებნა დაიწყოს
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${dateInputClass()} mt-1`} />
              </label>
            </>
          )}

          {mode === "harmonics" && (
            <label className="block text-xs font-bold text-slate-300">
              ჰარმონიკის ნომერი
              <input type="number" min="1" max="360" value={harmonic} onChange={(event) => setHarmonic(event.target.value)} className={`${dateInputClass()} mt-1`} />
            </label>
          )}

          <button
            onClick={calculate}
            disabled={loading}
            className="calc-submit-btn w-full rounded-xl px-4 py-3 text-sm font-black text-slate-950 transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                გამოთვლა
              </span>
            )}
          </button>
          
          {error && (
            <p className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-semibold text-rose-200 backdrop-blur-xl">
              {error}
            </p>
          )}
        </div>
      </div>
      
      {result && (
        <div className="glass-panel rounded-2xl p-4 text-left sm:rounded-[28px] sm:p-7 border-white/10 bg-[#090d1e]/90">
          <h3 className="mb-4 text-lg font-black bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {modeLabels[mode]}
          </h3>
          {typeof result.interpretation === "string" ? (
            <InterpretationText text={result.interpretation} />
          ) : (
            <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#060814]/90 p-4 text-xs leading-relaxed text-slate-200 border border-white/10 shadow-inner">
              {JSON.stringify(compactResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
