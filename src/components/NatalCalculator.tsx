"use client";

import { useEffect, useState } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import ChartWheel, { WheelPlanet } from "./ChartWheel";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Sliders, Loader2, CheckCircle2, AlertCircle, Info, Flame, Mountain, Wind, Droplets, Compass } from "lucide-react";

interface WheelData {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
}

interface CacheShape {
  birth: BirthValue;
  houseSystem: string;
  interpretation: string;
  wheel: WheelData | null;
}

const ZODIAC_SIGNS = [
  "ვერძი ♈", "კურო ♉", "ტყუპები ♊", "კირჩხიბი ♋",
  "ლომი ♌", "ქალწული ♍", "სასწორი ♎", "მორიელი ♏",
  "მშვილდოსანი ♐", "თხის რქა ♑", "მერწყული ♒", "თევზები ♓"
];

function getSignName(deg: number): string {
  const idx = Math.floor(((deg % 360) + 360) % 360 / 30);
  return ZODIAC_SIGNS[idx] || "";
}

function calculateElementBalance(planets: WheelPlanet[]) {
  let fire = 0, earth = 0, air = 0, water = 0;
  planets.forEach((p) => {
    const signIdx = Math.floor(((p.longitude % 360) + 360) % 360 / 30);
    const elem = signIdx % 4;
    if (elem === 0) fire++;
    else if (elem === 1) earth++;
    else if (elem === 2) air++;
    else if (elem === 3) water++;
  });
  const total = planets.length || 1;
  return {
    fire: Math.round((fire / total) * 100),
    earth: Math.round((earth / total) * 100),
    air: Math.round((air / total) * 100),
    water: Math.round((water / total) * 100),
  };
}

export default function NatalCalculator() {
  const me = useMe();
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [houseSystem, setHouseSystem] = useState("placidus");
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [wheel, setWheel] = useState<WheelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("natal");
    if (!cached) return;
    validateGuestCache("natal").then((active) => {
      if (!active) {
        setBirth(EMPTY_BIRTH);
        setHouseSystem("placidus");
        setInterpretation(null);
        setWheel(null);
        return;
      }
      setBirth(cached.birth);
      setHouseSystem(cached.houseSystem);
      setInterpretation(cached.interpretation);
      setWheel(cached.wheel ?? null);
    });
  }, []);

  async function calculate(save = false) {
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.timezone === null) {
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
          save,
        }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setInterpretation(data.interpretation);
      const w: WheelData = {
        ascendant: data.result.ascendant,
        mc: data.result.mc,
        houseCusps: data.result.houseCusps,
        planets: data.result.planets.map((p: { name: string; longitude: number }) => ({
          name: p.name,
          longitude: p.longitude,
        })),
      };
      setWheel(w);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("natal", { birth, houseSystem, interpretation: data.interpretation, wheel: w });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  const elements = wheel ? calculateElementBalance(wheel.planets) : null;
  const sunPlanet = wheel?.planets.find(p => p.name === "Sun");
  const moonPlanet = wheel?.planets.find(p => p.name === "Moon");

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      {/* Top Input & Action Grid for Desktop / Stacked for Mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start text-center w-full">
        {/* Birth Fields Card */}
        <div className="relative z-30 text-center w-full lg:col-span-7">
          <BirthFields value={birth} onChange={setBirth} legend="01. დაბადების მონაცემები" />
        </div>

        {/* House System Filter & Action Card */}
        <div className="glass-panel relative z-10 space-y-5 rounded-2xl sm:rounded-[28px] p-4 sm:p-7 border-amber-500/25 bg-gradient-to-b from-[#130938]/90 to-[#09041a]/95 backdrop-blur-2xl shadow-xl text-center w-full lg:col-span-5 lg:h-full flex flex-col justify-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-400">
                <Sliders className="h-4 w-4" />
              </div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200">სახლთა სისტემა:</label>
            </div>

            <select
              value={houseSystem}
              onChange={(e) => setHouseSystem(e.target.value)}
              className="w-full rounded-xl border border-amber-500/25 bg-[#080418] px-3 py-2.5 text-xs font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 hover:border-amber-500/40 text-center cursor-pointer"
            >
              <option value="placidus" className="bg-[#0A051D] text-slate-100">პლაციდუსი (Placidus)</option>
              <option value="whole_sign" className="bg-[#0A051D] text-slate-100">მთელი ნიშანი (Whole Sign)</option>
              <option value="equal" className="bg-[#0A051D] text-slate-100">თანაბარი (Equal)</option>
              <option value="porphyry" className="bg-[#0A051D] text-slate-100">პორფირი (Porphyry)</option>
            </select>
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
                  <span>✦ რუკის გამოთვლა</span>
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
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3.5 sm:px-5 sm:py-4 text-xs font-semibold text-rose-300 shadow-lg">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3.5 sm:px-5 sm:py-4 text-xs font-semibold text-emerald-300 shadow-lg">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>✓ წარმატებით შენახულია კაბინეტში!</span>
        </div>
      )}

      {/* Element Infographic Breakdown */}
      {wheel && elements && (
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border-amber-500/25 bg-gradient-to-b from-[#130938]/90 to-[#09041a]/95 backdrop-blur-2xl shadow-xl space-y-3 sm:space-y-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-amber-500/20 pb-3">
            <span className="font-display text-xs sm:text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <Compass className="h-4 w-4 text-amber-400 shrink-0" />
              <span>სტიქიების ბალანსი & ცის ღერძები</span>
            </span>
            <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[0.7rem] sm:text-xs font-bold text-purple-300">
              ASC: {getSignName(wheel.ascendant)} ({Math.floor(wheel.ascendant % 30)}°)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-2.5 sm:p-3 space-y-1.5 text-center">
              <div className="flex justify-between font-bold text-rose-300 text-[0.7rem] sm:text-xs">
                <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-rose-400" /> ცეცხლი</span>
                <span>{elements.fire}%</span>
              </div>
              <div className="infographic-bar-bg h-1.5">
                <div className="infographic-bar-fill bg-gradient-to-r from-rose-500 to-amber-500" style={{ width: `${elements.fire}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-2.5 sm:p-3 space-y-1.5 text-center">
              <div className="flex justify-between font-bold text-emerald-300 text-[0.7rem] sm:text-xs">
                <span className="flex items-center gap-1"><Mountain className="h-3 w-3 text-emerald-400" /> მიწა</span>
                <span>{elements.earth}%</span>
              </div>
              <div className="infographic-bar-bg h-1.5">
                <div className="infographic-bar-fill bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${elements.earth}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-2.5 sm:p-3 space-y-1.5 text-center">
              <div className="flex justify-between font-bold text-amber-300 text-[0.7rem] sm:text-xs">
                <span className="flex items-center gap-1"><Wind className="h-3 w-3 text-amber-400" /> ჰაერი</span>
                <span>{elements.air}%</span>
              </div>
              <div className="infographic-bar-bg h-1.5">
                <div className="infographic-bar-fill bg-gradient-to-r from-amber-400 to-yellow-300" style={{ width: `${elements.air}%` }} />
              </div>
            </div>

            <div className="rounded-xl border border-sky-500/20 bg-sky-950/20 p-2.5 sm:p-3 space-y-1.5 text-center">
              <div className="flex justify-between font-bold text-sky-300 text-[0.7rem] sm:text-xs">
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-sky-400" /> წყალი</span>
                <span>{elements.water}%</span>
              </div>
              <div className="infographic-bar-bg h-1.5">
                <div className="infographic-bar-fill bg-gradient-to-r from-sky-500 to-indigo-400" style={{ width: `${elements.water}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Wheel Display */}
      {wheel && (
        <div className="glass-panel relative overflow-hidden rounded-2xl sm:rounded-[28px] p-3 sm:p-8 border-amber-500/25 bg-[#120833]/90 backdrop-blur-2xl shadow-2xl text-center w-full">
          <div className="mb-3 sm:mb-4 text-center">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">ნატალური ცის რუკა</h3>
            <p className="mt-0.5 text-[0.7rem] sm:text-xs font-semibold text-slate-300">პლანეტების ეკლიპტიკური პოზიციები</p>
          </div>
          <ChartWheel ascendant={wheel.ascendant} mc={wheel.mc} cusps={wheel.houseCusps} planets={wheel.planets} />
        </div>
      )}

      {!me && interpretation && (
        <div className="flex items-start justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-purple-950/40 p-3.5 sm:p-4 text-xs font-medium text-slate-200 backdrop-blur-md text-center">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            სტუმარი რეჟიმია — ეს შედეგი შენახული იქნება ამ მოწყობილობაზე 12 საათის განმავლობაში. მუდმივი
            შენახვისთვის გახსენით <a href="/cabinet" className="font-bold text-amber-300 underline decoration-amber-400/50">კაბინეტი</a>.
          </p>
        </div>
      )}

      {/* Full Width Interpretation Block */}
      {interpretation && (
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-2xl border-amber-500/25 bg-[#120833]/90 backdrop-blur-2xl text-left w-full">
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}



