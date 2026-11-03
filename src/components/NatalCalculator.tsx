"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationOverlay from "./InterpretationOverlay";
import ChartExportButton from "./ChartExportButton";
import ChartMapSection from "./ChartMapSection";
import ElementBalanceGuide from "./ElementBalanceGuide";
import CosmicShareCardModal from "./CosmicShareCardModal";
import CalculationRoom from "./CalculationRoom";
import type { WheelPlanet } from "./ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import CalculationSettings, { DEFAULT_UI_CALCULATION } from "./CalculationSettings";
import HouseSystemSelect from "./HouseSystemSelect";
import type { CalculationOptions } from "@/lib/astro/ephemeris";
import type { EphemerisMetadata } from "@/lib/astro/ephemeris";
import { HOUSE_SYSTEM_VALUES, type HouseSystem } from "@/lib/astro/positions";
import { saveGuestCache, loadGuestCache, clearGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { getGuestSavedCharts, saveGuestChart, type GuestSavedChart } from "@/lib/guestSavedCharts";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface WheelData {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
  aspects: AspectHit[];
  fixedStars: Array<{ star: string; planet: string; longitude: number; orb: number }>;
  planetHouses: Record<string, number>;
  ephemeris?: EphemerisMetadata;
}

interface CacheShape {
  birth: BirthValue;
  houseSystem: HouseSystem;
  interpretation: string;
  wheel: WheelData | null;
  mapNumber?: string | null;
  savedId?: string | null;
  calculation?: CalculationOptions;
}

interface DraftShape {
  birth: BirthValue;
  houseSystem: HouseSystem;
  calculation: CalculationOptions;
}

const NATAL_DRAFT_KEY = "astro_chart_draft_natal";

interface NatalPreview {
  sun: string;
  moon: string;
  ascendant: string;
  mc: string;
}

function wheelFromGuestChart(result: unknown): WheelData | null {
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;
  const record = result as Record<string, unknown>;
  if (
    typeof record.ascendant !== "number"
    || typeof record.mc !== "number"
    || !Array.isArray(record.houseCusps)
    || !record.houseCusps.every((cusp) => typeof cusp === "number")
    || !Array.isArray(record.planets)
    || !record.planets.every((planet) => !!planet && typeof planet === "object"
      && typeof (planet as { name?: unknown }).name === "string"
      && typeof (planet as { longitude?: unknown }).longitude === "number")
  ) return null;

  const advanced = record.advanced && typeof record.advanced === "object"
    ? record.advanced as Record<string, unknown>
    : null;
  const fixedStars = Array.isArray(advanced?.fixedStarContacts)
    ? advanced.fixedStarContacts.filter((star): star is WheelData["fixedStars"][number] => (
      !!star && typeof star === "object"
      && typeof (star as { star?: unknown }).star === "string"
      && typeof (star as { planet?: unknown }).planet === "string"
      && typeof (star as { longitude?: unknown }).longitude === "number"
      && typeof (star as { orb?: unknown }).orb === "number"
    ))
    : [];
  return {
    ascendant: record.ascendant,
    mc: record.mc,
    houseCusps: record.houseCusps,
    planets: record.planets as WheelData["planets"],
    aspects: Array.isArray(record.aspects) ? record.aspects as AspectHit[] : [],
    fixedStars,
    planetHouses: record.planetHouses && typeof record.planetHouses === "object"
      ? record.planetHouses as Record<string, number>
      : {},
  };
}

export default function NatalCalculator() {
  const router = useRouter();
  const me = useMe();
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [houseSystem, setHouseSystem] = useState<HouseSystem>("placidus");
  const [calculation, setCalculation] = useState<CalculationOptions>({ ...DEFAULT_UI_CALCULATION });
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [wheel, setWheel] = useState<WheelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState("✓ წარმატებით შენახულია კაბინეტში!");
  const [mapNumber, setMapNumber] = useState<string | null>(null);
  const [preview, setPreview] = useState<NatalPreview | null>(null);
  // The legacy in-page result components remain mounted only for backwards
  // compatibility with cached data; the visible result always lives at /chart/room.
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRevealing] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [localSavedCharts, setLocalSavedCharts] = useState<GuestSavedChart[]>([]);
  const [selectedLocalChart, setSelectedLocalChart] = useState<GuestSavedChart | null>(null);
  const [isCurrentChartSavedLocally, setIsCurrentChartSavedLocally] = useState(false);

  useEffect(() => {
    try {
      const rawDraft = window.sessionStorage.getItem(NATAL_DRAFT_KEY);
      if (rawDraft) {
        const draft = JSON.parse(rawDraft) as DraftShape;
        if (draft.birth && draft.houseSystem && draft.calculation) {
          setBirth(draft.birth);
          setHouseSystem(draft.houseSystem);
          setCalculation({ ...DEFAULT_UI_CALCULATION, ...draft.calculation });
        }
      }
    } catch (draftError) {
      console.error("Could not restore natal chart form draft", draftError);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    try {
      window.sessionStorage.setItem(NATAL_DRAFT_KEY, JSON.stringify({ birth, houseSystem, calculation } satisfies DraftShape));
    } catch (draftError) {
      console.error("Could not persist natal chart form draft", draftError);
    }
  }, [birth, houseSystem, calculation, draftReady]);

  useEffect(() => {
    try {
      setLocalSavedCharts(getGuestSavedCharts());
    } catch (savedChartsError) {
      console.error("Could not load device-saved charts", savedChartsError);
      setError(savedChartsError instanceof Error ? savedChartsError.message : "შენახული რუკების ჩატვირთვა ვერ მოხერხდა.");
    }
  }, []);

  useEffect(() => {
    if (me === undefined) return;
    if (me === null) {
      clearGuestCache("natal");
      setInterpretation(null);
      setWheel(null);
      setMapNumber(null);
      setSaved(false);
      return;
    }
    const cached = loadGuestCache<CacheShape>("natal");
    if (!cached) return;
    validateGuestCache("natal").then((active) => {
      if (!active) {
        setBirth(EMPTY_BIRTH);
        setHouseSystem("placidus");
        setInterpretation(null);
        setWheel(null);
        setMapNumber(null);
        return;
      }
      const requiredPoints = new Set(cached.calculation?.ephemeris === "astronomy"
        ? ["Lilith", "Selena", "SouthNode", "Fortune", "Spirit"]
        : ["Lilith", "Selena", "Chiron", "SouthNode", "Fortune", "Spirit"]);
      const hasExpandedPointSet = cached.wheel?.planets?.some((planet) => requiredPoints.has(planet.name)) &&
        [...requiredPoints].every((name) => cached.wheel?.planets?.some((planet) => planet.name === name));
      if (cached.wheel && !hasExpandedPointSet) {
        clearGuestCache("natal");
        setInterpretation(null);
        setWheel(null);
        setMapNumber(null);
        return;
      }
      setBirth(cached.birth);
      setHouseSystem(cached.houseSystem);
      setCalculation({ ...DEFAULT_UI_CALCULATION, ...(cached.calculation ?? {}) });
      setInterpretation(cached.interpretation);
      setPreview(null);
      setWheel(cached.wheel ? {
        ...cached.wheel,
        aspects: cached.wheel.aspects ?? [],
        fixedStars: cached.wheel.fixedStars ?? [],
        planetHouses: cached.wheel.planetHouses ?? {},
      } : null);
      setMapNumber(cached.mapNumber ?? null);
      setSaved(Boolean(cached.savedId));
    });
  }, [me]);

  function openLocalSavedChart(chart: GuestSavedChart) {
    if (chart.type !== "NATAL") {
      setSelectedLocalChart(chart);
      return;
    }
    const savedWheel = wheelFromGuestChart(chart.result);
    if (!savedWheel || !chart.interpretation) {
      setError("მოწყობილობაზე შენახული რუკის სრული მონაცემები ვერ მოიძებნა.");
      return;
    }
    setBirth(chart.birth);
    setHouseSystem((HOUSE_SYSTEM_VALUES as readonly string[]).includes(chart.houseSystem)
      ? chart.houseSystem as HouseSystem
      : "placidus");
    setWheel(savedWheel);
    setInterpretation(chart.interpretation);
    setMapNumber(null);
    setSaved(true);
    setSavedMessage("✓ რუკა ამ მოწყობილობაზე შეინახა!");
    setIsCurrentChartSavedLocally(true);
    setIsRoomOpen(true);
  }

  async function calculate(save = false, openRoom = true) {
    if (save && me === undefined) {
      setError("მომხმარებლის სტატუსი იტვირთება. სცადეთ ხელახლა.");
      return;
    }
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.lon === null || birth.timezone === null) {
      setError("შეავსეთ სახელი, თარიღი, დრო და დაბადების ადგილი (დაადასტურეთ ადგილის მოძებნა).");
      return;
    }
    setLoading(true);
    setError(null);
    setSaved(false);
    setIsCurrentChartSavedLocally(false);
    setPreview(null);
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
          calculation,
          save: save && me !== null,
        }),
      });
      const data = await readApiResponse<{
        error?: string;
        preview?: NatalPreview;
        result?: {
          ascendant: number;
          mc: number;
          houseCusps: number[];
          planets: Array<{ name: string; longitude: number }>;
          aspects?: AspectHit[];
          advanced?: { fixedStarContacts?: WheelData["fixedStars"] };
          planetHouses?: Record<string, number>;
          ephemeris?: EphemerisMetadata;
        };
        interpretation?: string;
        mapNumber?: string | null;
        savedId?: string;
      }>(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      if (data.preview) {
        setPreview(data.preview);
        setInterpretation(null);
        setWheel(null);
        setMapNumber(null);
        return;
      }
      if (!data.result || !data.interpretation) {
        setError("სერვერმა სრული ნატალური რუკა არ დააბრუნა.");
        return;
      }
      setInterpretation(data.interpretation);
      setMapNumber(data.mapNumber ?? null);
      const w: WheelData = {
        ascendant: data.result.ascendant,
        mc: data.result.mc,
        houseCusps: data.result.houseCusps,
        planets: data.result.planets.map((p: { name: string; longitude: number }) => ({
          name: p.name,
          longitude: p.longitude,
        })),
        aspects: data.result.aspects ?? [],
        fixedStars: data.result.advanced?.fixedStarContacts ?? [],
        planetHouses: data.result.planetHouses ?? {},
        ephemeris: data.result.ephemeris,
      };
      setWheel(w);
      let savedId = data.savedId ?? null;
      if (save && me === null) {
        const localChart = saveGuestChart({
          type: "NATAL",
          label: `ნატალური — ${birth.name}`,
          birth,
          houseSystem,
          result: { ...data.result, advanced: { fixedStarContacts: w.fixedStars } },
          interpretation: data.interpretation,
        });
        savedId = localChart.id;
        setSavedMessage("✓ რუკა ამ მოწყობილობაზე შეინახა!");
        setLocalSavedCharts(getGuestSavedCharts());
        setIsCurrentChartSavedLocally(true);
      } else if (save) {
        setSavedMessage("✓ წარმატებით შენახულია კაბინეტში!");
      }
      if (save) setSaved(true);
      // The dedicated route reads this short-lived cache, for both guests and signed-in users.
      saveGuestCache<CacheShape>("natal", {
        birth,
        houseSystem,
        calculation,
        interpretation: data.interpretation,
        wheel: w,
        mapNumber: data.mapNumber ?? null,
        savedId,
      });
      if (openRoom) router.push("/chart/room");
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentResult() {
    if (saved) return;
    if (!wheel || !interpretation) {
      await calculate(true, false);
      return;
    }
    if (me === undefined) {
      setError("მომხმარებლის სტატუსი იტვირთება. სცადეთ ხელახლა.");
      return;
    }
    setLoading(true);
    setError(null);
    let savedId: string | null = null;
    try {
      const result = {
        ascendant: wheel.ascendant,
        mc: wheel.mc,
        houseCusps: wheel.houseCusps,
        planets: wheel.planets,
        aspects: wheel.aspects,
        planetHouses: wheel.planetHouses,
        advanced: { fixedStarContacts: wheel.fixedStars },
      };
      if (me === null) {
        const localChart = saveGuestChart({
          type: "NATAL",
          label: `ნატალური — ${birth.name}`,
          birth,
          houseSystem,
          result,
          interpretation,
        });
        savedId = localChart.id;
        setLocalSavedCharts(getGuestSavedCharts());
        setIsCurrentChartSavedLocally(true);
        setSavedMessage("✓ რუკა ამ მოწყობილობაზე შეინახა!");
      } else {
        const response = await fetch("/api/charts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "NATAL",
            mapNumber,
            name1: birth.name,
            date1: birth.date,
            time1: birth.time,
            place1: birth.place,
            lat1: birth.lat,
            lon1: birth.lon,
            tz1: birth.timezone,
            houseSystem,
            result,
            interpretation,
          }),
        });
        const data = await readApiResponse<{ error?: string; saved?: boolean; savedId?: string; mapNumber?: string | null }>(response);
        if (!response.ok || !data.saved) throw new Error(data.error ?? "რუკის შენახვა ვერ მოხერხდა.");
        savedId = data.savedId ?? null;
        if (data.mapNumber) setMapNumber(data.mapNumber);
        setSavedMessage("✓ წარმატებით შენახულია კაბინეტში!");
      }
      const cachedChart = loadGuestCache<CacheShape>("natal");
      if (cachedChart && savedId) saveGuestCache("natal", { ...cachedChart, savedId });
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "რუკის შენახვა ვერ მოხერხდა.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      {/* Top Input & Action Grid for Desktop / Stacked for Mobile */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 lg:items-start text-center w-full">
        {/* Birth Fields Card */}
        <div className="relative z-30 text-center w-full lg:col-span-7">
          <BirthFields value={birth} onChange={setBirth} legend="01. დაბადების მონაცემები" />
        </div>

        {/* House System Filter & Action Card */}
        <div className="glass-panel relative z-10 space-y-5 rounded-2xl sm:rounded-[28px] p-4 sm:p-7 border-white/10 bg-[#090d1e]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center w-full lg:col-span-5 lg:h-full flex flex-col justify-center">
          <HouseSystemSelect value={houseSystem} onChange={setHouseSystem} ephemeris={calculation.ephemeris ?? "swiss"} />

          <CalculationSettings value={calculation} onChange={(next) => {
            setCalculation(next);
            if (next.ephemeris === "astronomy" && !["placidus", "whole_sign", "equal", "porphyry"].includes(houseSystem)) setHouseSystem("placidus");
          }} />

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
                  <span>✦ რუკის გამოთვლა</span>
                </>
              )}
            </button>

            <button
              onClick={saveCurrentResult}
              disabled={loading || me === undefined || saved}
              className="w-full flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-3 px-6 text-xs sm:text-sm font-bold text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:bg-white/[0.08] hover:border-cyan-400/40 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
            >
              <Bookmark className="h-4 w-4 text-cyan-400" />
              <span>{saved ? "შენახულია" : "შენახვა"}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3.5 sm:px-5 sm:py-4 text-xs font-semibold text-rose-300 shadow-lg backdrop-blur-xl">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3.5 sm:px-5 sm:py-4 text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {localSavedCharts.length > 0 && (
        <section className="rounded-2xl border border-cyan-400/20 bg-[#090d1e]/85 p-4 text-left sm:p-5" aria-label="ამ მოწყობილობაზე შენახული რუკები">
          <h3 className="text-sm font-bold text-cyan-200">ამ მოწყობილობაზე შენახული რუკები</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {localSavedCharts.map((chart) => (
              <button
                key={chart.id}
                type="button"
                onClick={() => openLocalSavedChart(chart)}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-950/20"
              >
                <span className="block truncate text-xs font-bold text-white">{chart.label}</span>
                <span className="mt-1 block text-[10px] text-slate-400">
                  {chart.type === "NATAL" ? "ნატალური" : chart.type === "SYNASTRY" ? "სინასტრია" : chart.type === "TRANSIT" ? "ტრანზიტი" : chart.type}
                  {" · "}
                  {new Date(chart.savedAt).toLocaleDateString("ka-GE")}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {preview && (
        <section className="rounded-2xl border border-cyan-400/25 bg-[#0a1022]/90 p-5 text-left shadow-lg sm:p-6" aria-label="უფასო ნატალური მიმოხილვა">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-white">მოკლე უფასო მიმოხილვა</h3>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                სტუმრის რეჟიმში ნაჩვენებია მხოლოდ ოთხი ძირითადი ნიშანი. სრული რუკა, ასპექტები და ინტერპრეტაცია ანგარიშში შესვლის შემდეგ გაიხსნება.
              </p>
              <p className="mt-2 text-[11px] leading-5 text-slate-400">
                კონფიდენციალურობა: შეყვანილი დაბადების მონაცემები და გამოთვლის შედეგი შესაძლოა ჩაიწეროს ანონიმურ სერვერულ ჟურნალში IP მისამართთან და user-agent-თან ერთად; ჩანაწერს ადმინისტრატორი ხედავს.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["მზე", preview.sun],
                  ["მთვარე", preview.moon],
                  ["ასცენდენტი", preview.ascendant],
                  ["MC", preview.mc],
                ].map(([label, sign]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <dt className="text-[10px] font-semibold text-slate-400">{label}</dt>
                    <dd className="mt-1 text-sm font-bold text-cyan-100">{sign}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/cabinet" className="mt-4 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950">
                შესვლა ან რეგისტრაცია
              </Link>
            </div>
          </div>
        </section>
      )}

      <div data-chart-export-root="true" className="hidden chart-builder-result space-y-4 sm:space-y-6" aria-hidden="true">
        {wheel && (
          <div className="flex justify-center pt-2 pb-1">
            <button
              type="button"
              onClick={() => {
                setIsRoomOpen(true);
                try { window.history.pushState(null, "", "/chart/room"); } catch {}
              }}
              className="btn-shimmer flex items-center justify-center gap-2.5 rounded-full border border-cyan-400/50 bg-gradient-to-r from-emerald-500/25 via-indigo-900/60 to-cyan-500/30 px-8 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-[0_0_35px_rgba(56,189,248,0.35)] transition-all hover:scale-105 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>✦ ასტროლოგიური კაბინეტის გახსნა (სრული ეკრანი)</span>
            </button>
          </div>
        )}

        {/* Chart Wheel Display */}
        {wheel && (
          <ChartMapSection
            title="ზოდიაქალური წრე"
            className="w-full"
            ascendant={wheel.ascendant}
            mc={wheel.mc}
            houseCusps={wheel.houseCusps}
            planets={wheel.planets}
            aspects={wheel.aspects}
            fixedStars={wheel.fixedStars}
            planetHouses={wheel.planetHouses}
          />
        )}

        {wheel && <ElementBalanceGuide planets={wheel.planets} ascendant={wheel.ascendant} />}

        {(wheel || interpretation) && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {interpretation && (
              <button
                type="button"
                onClick={() => {
                  setIsRoomOpen(true);
                  try { window.history.pushState(null, "", "/chart/room"); } catch {}
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-500/20 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>ასტროლოგიური კაბინეტი (სრული ანალიზი) →</span>
              </button>
            )}
            {wheel && (
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="btn-shimmer flex items-center justify-center gap-2 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-indigo-900/40 to-amber-500/20 px-5 py-2.5 text-xs font-bold text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.25)] transition-all hover:border-amber-400 hover:text-white cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>✦ ჰოლოგრაფიული ბარათი (Story)</span>
              </button>
            )}
            <ChartExportButton className="flex items-center justify-center gap-1.5 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-purple-950/60 px-5 py-2.5 text-xs font-bold text-cyan-200 shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all hover:bg-cyan-400 hover:text-slate-950 cursor-pointer" />
          </div>
        )}

      </div>

      <CalculationRoom
        isOpen={isRoomOpen}
        onClose={() => {
          setIsRoomOpen(false);
          try { window.history.pushState(null, "", "/"); } catch {}
        }}
        birth={birth}
        wheel={wheel}
        interpretation={interpretation}
        mapNumber={mapNumber}
        houseSystem={houseSystem}
        isLoading={loading}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        savedChart={saved || isCurrentChartSavedLocally}
      />

      {/* 1.5s Hypnotic Cosmic Reveal Accelerator */}
      {isRevealing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center">
            <div className="h-48 w-48 rounded-full border-2 border-dashed border-cyan-400/70 animate-spin" style={{ animationDuration: "1.2s" }} />
            <div className="absolute h-36 w-36 rounded-full border-2 border-dotted border-amber-400/80 animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
            <div className="absolute h-24 w-24 rounded-full border border-violet-400/90 animate-ping" />
            <div className="absolute h-6 w-6 rounded-full bg-gradient-to-r from-amber-300 to-cyan-300 shadow-[0_0_30px_#38bdf8] animate-pulse" />
          </div>
          <p className="mt-8 font-display text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-violet-300 animate-pulse tracking-wide">
            ✦ ცის რუკა იკვრება · SWISS EPHEMERIS ✦
          </p>
          <span className="mt-2 text-xs font-mono text-slate-400">ალგორითმული სინთეზი და ასპექტების დათვლა…</span>
        </div>
      )}

      {/* Cosmic Holographic Share Modal */}
      {wheel && (
        <CosmicShareCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          userName={birth.name}
          birthDate={birth.date}
          birthPlace={birth.place}
          planets={wheel.planets}
          ascendant={wheel.ascendant}
        />
      )}

      <InterpretationOverlay
        open={loading}
        loading={loading}
        title="ნატალური რუკის გამოთვლა"
        subtitle="გამოთვლის დასრულებისთანავე გაიხსნება თქვენი პირადი ასტროლოგიური კაბინეტი."
        onClose={() => undefined}
      />
      <InterpretationOverlay
        open={Boolean(selectedLocalChart)}
        loading={false}
        title={selectedLocalChart?.label ?? "შენახული ინტერპრეტაცია"}
        subtitle="ეს შედეგი შენახულია ამ მოწყობილობაზე."
        interpretation={selectedLocalChart?.interpretation}
        onClose={() => setSelectedLocalChart(null)}
      />
    </div>
  );
}
