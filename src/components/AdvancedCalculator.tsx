"use client";

import { useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Loader2, Sparkles } from "lucide-react";

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
  return "w-full rounded-xl border border-amber-500/25 bg-[#080418] px-3 py-2.5 text-sm font-semibold text-slate-100 outline-none focus:border-amber-400";
}

export default function AdvancedCalculator() {
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [mode, setMode] = useState<AdvancedMode>("progression");
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
      if (mode === "progression") { endpoint = "/api/chart/progression"; body = { natal, targetDate, houseSystem: "placidus" }; }
      if (mode === "directions") { endpoint = "/api/chart/directions"; body = { natal, targetDate, houseSystem: "placidus" }; }
      if (mode === "return") { endpoint = "/api/chart/return"; body = { natal, planet, startDate, endDate, houseSystem: "placidus" }; }
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
        <div className="glass-panel space-y-4 rounded-2xl p-4 sm:rounded-[28px] sm:p-7 border-amber-500/25 bg-gradient-to-b from-[#130938]/90 to-[#09041a]/95 text-left">
          <div className="flex items-center gap-2 text-amber-300"><Sparkles className="h-5 w-5" /><h2 className="text-base font-black sm:text-lg">გაფართოებული მეთოდები</h2></div>
          <select value={mode} onChange={(event) => setMode(event.target.value as AdvancedMode)} className={dateInputClass()}>
            {Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>

          {(mode === "progression" || mode === "directions") && <label className="block text-xs font-bold text-slate-300">სამიზნე თარიღი<input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className={`${dateInputClass()} mt-1`} /></label>}
          {mode === "return" && <>
            <label className="block text-xs font-bold text-slate-300">პლანეტი<select value={planet} onChange={(event) => setPlanet(event.target.value)} className={`${dateInputClass()} mt-1`}><option value="Sun">მზე — Solar Return</option><option value="Moon">მთვარე — Lunar Return</option><option value="Mercury">მერკური</option><option value="Venus">ვენერა</option><option value="Mars">მარსი</option><option value="Jupiter">იუპიტერი</option><option value="Saturn">სატურნი</option><option value="Uranus">ურანი</option><option value="Neptune">ნეპტუნი</option><option value="Pluto">პლუტონი</option></select></label>
            <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-300">დან<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${dateInputClass()} mt-1`} /></label><label className="text-xs font-bold text-slate-300">მდე<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${dateInputClass()} mt-1`} /></label></div>
          </>}
          {mode === "eclipse" && <><label className="block text-xs font-bold text-slate-300">ტიპი<select value={eclipseType} onChange={(event) => setEclipseType(event.target.value)} className={`${dateInputClass()} mt-1`}><option value="solar">მზის დაბნელება</option><option value="lunar">მთვარის დაბნელება</option></select></label><label className="block text-xs font-bold text-slate-300">ძებნა დაიწყოს<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${dateInputClass()} mt-1`} /></label></>}
          {mode === "harmonics" && <label className="block text-xs font-bold text-slate-300">ჰარმონიკის ნომერი<input type="number" min="1" max="360" value={harmonic} onChange={(event) => setHarmonic(event.target.value)} className={`${dateInputClass()} mt-1`} /></label>}
          <button onClick={calculate} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 px-4 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:from-amber-300 hover:to-amber-500 disabled:opacity-60">{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "გამოთვლა"}</button>
          {error && <p className="rounded-xl border border-rose-400/40 bg-rose-950/30 p-3 text-xs font-semibold text-rose-200">{error}</p>}
        </div>
      </div>
      {result && <div className="glass-panel rounded-2xl p-4 text-left sm:rounded-[28px] sm:p-7"><h3 className="mb-4 text-lg font-black text-amber-300">{modeLabels[mode]}</h3>{typeof result.interpretation === "string" ? <InterpretationText text={result.interpretation} /> : <pre className="max-h-[38rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#080418]/80 p-4 text-xs leading-relaxed text-slate-200">{JSON.stringify(compactResult, null, 2)}</pre>}</div>}
    </div>
  );
}
