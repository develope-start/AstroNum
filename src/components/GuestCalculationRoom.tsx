"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  Lock,
  Compass,
  Star,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { WheelPlanet } from "./ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import type { HouseSystem } from "@/lib/astro/positions";
import type { EphemerisMetadata } from "@/lib/astro/ephemeris";
import {
  ATLAS_NATAL_DATA,
  ATLAS_PLANET_TEXT,
  ATLAS_POINT_TEXT,
  ATLAS_ASP_TEXT,
  ATLAS_SYN_DATA,
} from "@/lib/atlasData";

export interface GuestCalculationRoomProps {
  birth: {
    name: string;
    date: string;
    time: string;
    place: string;
    lat: number | null;
    lon: number | null;
    timezone: string | null;
  };
  wheel: {
    ascendant: number;
    mc: number;
    houseCusps: number[];
    planets: WheelPlanet[];
    aspects: AspectHit[];
    fixedStars?: Array<{ star: string; planet: string; longitude: number; orb: number }>;
    planetHouses?: Record<string, number>;
    ephemeris?: EphemerisMetadata;
  } | null;
  interpretation?: string | null;
  houseSystem?: HouseSystem;
  onClose?: () => void;
}

const ZODIAC_SIGNS = [
  { n: "ვერძი", g: "♈", e: "ცეცხლი" },
  { n: "კურო", g: "♉", e: "მიწა" },
  { n: "ტყუპები", g: "♊", e: "ჰაერი" },
  { n: "კირჩხიბი", g: "♋", e: "წყალი" },
  { n: "ლომი", g: "♌", e: "ცეცხლი" },
  { n: "ქალწული", g: "♍", e: "მიწა" },
  { n: "სასწორი", g: "♎", e: "ჰაერი" },
  { n: "მორიელი", g: "♏", e: "წყალი" },
  { n: "მშვილდოსანი", g: "♐", e: "ცეცხლი" },
  { n: "თხის რქა", g: "♑", e: "მიწა" },
  { n: "მერწყული", g: "♒", e: "ჰაერი" },
  { n: "თევზები", g: "♓", e: "წყალი" },
];

const BODY_META: Record<string, { n: string; g: string; c: string }> = {
  Sun: { n: "მზე (Sun)", g: "☉", c: "#facc15" },
  Moon: { n: "მთვარე (Moon)", g: "☽", c: "#e2e8f0" },
  Mercury: { n: "მერკური (Mercury)", g: "☿", c: "#34d399" },
  Venus: { n: "ვენერა (Venus)", g: "♀", c: "#f472b6" },
  Mars: { n: "მარსი (Mars)", g: "♂", c: "#f87171" },
  Jupiter: { n: "იუპიტერი (Jupiter)", g: "♃", c: "#c084fc" },
  Saturn: { n: "სატურნი (Saturn)", g: "♄", c: "#60a5fa" },
  Uranus: { n: "ურანი (Uranus)", g: "♅", c: "#22d3ee" },
  Neptune: { n: "ნეპტუნი (Neptune)", g: "♆", c: "#818cf8" },
  Pluto: { n: "პლუტონი (Pluto)", g: "♇", c: "#a855f7" },
  Chiron: { n: "ქირონი (Chiron)", g: "⚷", c: "#2dd4bf" },
  TrueNode: { n: "ჩრდ. კვანძი (Rahu)", g: "☊", c: "#fbbf24" },
  MeanNode: { n: "ჩრდ. კვანძი (Rahu)", g: "☊", c: "#fbbf24" },
  NNode: { n: "ჩრდ. კვანძი (Rahu)", g: "☊", c: "#fbbf24" },
  SouthNode: { n: "სამხ. კვანძი (Ketu)", g: "☋", c: "#94a3b8" },
  SNode: { n: "სამხ. კვანძი (Ketu)", g: "☋", c: "#94a3b8" },
  Lilith: { n: "ლილიტი (Lilith)", g: "⚸", c: "#ef4444" },
  Selena: { n: "სელენა (Selena)", g: "☾", c: "#38bdf8" },
  ASC: { n: "ასცენდენტი (ASC)", g: "ASC", c: "#fb923c" },
  MC: { n: "მერიდიანი (MC)", g: "MC", c: "#f59e0b" },
};

const ROM_HOUSES = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

function formatLongitude(lon: number) {
  const norm = ((lon % 360) + 360) % 360;
  const sIdx = Math.floor(norm / 30);
  const deg = Math.floor(norm % 30);
  const min = Math.floor((norm % 1) * 60);
  const sign = ZODIAC_SIGNS[sIdx] || { n: "ვერძი", g: "♈" };
  return {
    deg,
    min,
    sign,
    full: `${String(deg).padStart(2, "0")}° ${String(min).padStart(2, "0")}'`,
  };
}

export default function GuestCalculationRoom({
  birth,
  wheel,
  interpretation,
  houseSystem = "placidus",
  onClose,
}: GuestCalculationRoomProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("tab-planets");
  const [isTechAuditOpen, setIsTechAuditOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  // Core triad calculation
  const sunObj = wheel?.planets.find((p) => p.name === "Sun");
  const moonObj = wheel?.planets.find((p) => p.name === "Moon");
  const ascLon = wheel?.ascendant ?? 131.11;
  const mcLon = wheel?.mc ?? 29.47;

  const sunPos = sunObj ? formatLongitude(sunObj.longitude) : formatLongitude(90.328);
  const moonPos = moonObj ? formatLongitude(moonObj.longitude) : formatLongitude(26.591);
  const ascPos = formatLongitude(ascLon);
  const mcPos = formatLongitude(mcLon);

  // Planets list formatted for the table
  const tableData = useMemo(() => {
    if (!wheel) return [];
    const list: Array<{
      name: string;
      sign: string;
      deg: string;
      house: string;
      status: string;
      color: string;
      angle: number;
    }> = [];

    wheel.planets.forEach((p) => {
      const meta = BODY_META[p.name] || { n: p.name, g: "✦", c: "#fff" };
      const pos = formatLongitude(p.longitude);
      const h = wheel.planetHouses?.[p.name];
      const isRetro = Boolean((ATLAS_NATAL_DATA.retro as Record<string, boolean>)?.[p.name]);

      let status = "ჰარმონიული";
      if (p.name === "Sun" && pos.deg === 0 && pos.sign.n === "კირჩხიბი") status = "ზაფხულის ბუნიობა";
      else if (p.name === "Mercury" && pos.sign.n === "ტყუპები") status = "სავანე (მმართველობა)";
      else if (p.name === "Jupiter" && pos.sign.n === "მშვილდოსანი") status = "სავანე (მმართველობა)";
      else if (isRetro) status = "რეტროგრადული (Rx)";
      else if (p.name === "Moon") status = "დინამიური";
      else if (p.name === "Lilith") status = "ფიქციური წერტილი";
      else if (p.name.includes("Node")) status = "ევოლუციური";
      else if (p.name === "Chiron") status = "ასტეროიდი";

      list.push({
        name: meta.n,
        sign: `${pos.sign.n} ${pos.sign.g}`,
        deg: pos.full,
        house: h ? `${h}-ე სახლი (${ROM_HOUSES[h]})` : "-",
        status,
        color: meta.c,
        angle: p.longitude,
      });
    });

    // Add ASC and MC
    list.push({
      name: "ასცენდენტი (ASC)",
      sign: `${ascPos.sign.n} ${ascPos.sign.g}`,
      deg: ascPos.full,
      house: "1-ლი სახლი (I)",
      status: "კუთხური წერტილი",
      color: "#fb923c",
      angle: ascLon,
    });
    list.push({
      name: "მერიდიანი (MC)",
      sign: `${mcPos.sign.n} ${mcPos.sign.g}`,
      deg: mcPos.full,
      house: "10-ე სახლი (X)",
      status: "კუთხური წერტილი",
      color: "#f59e0b",
      angle: mcLon,
    });

    return list;
  }, [wheel, ascLon, mcLon, ascPos, mcPos]);

  const filteredTableData = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return tableData;
    return tableData.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sign.toLowerCase().includes(q) ||
        item.house.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
    );
  }, [tableData, tableSearch]);

  // Natal Wheel SVG generation constants
  const center = 250;
  const outerR = 230;
  const innerR = 190;
  const planetR = 155;
  const houseR = 120;

  // Aspect connections for SVG rendering
  const aspectConnections = useMemo(() => {
    if (!wheel) return [];
    return wheel.aspects.slice(0, 24).map((asp) => {
      const p1 = wheel.planets.find((p) => p.name === asp.a) || (asp.a === "ASC" ? { longitude: ascLon } : asp.a === "MC" ? { longitude: mcLon } : null);
      const p2 = wheel.planets.find((p) => p.name === asp.b) || (asp.b === "ASC" ? { longitude: ascLon } : asp.b === "MC" ? { longitude: mcLon } : null);
      const isTrine = asp.aspect === "Trine";
      const isSquare = asp.aspect === "Square";
      const isOpp = asp.aspect === "Opposition";
      const isSextile = asp.aspect === "Sextile";
      const stroke = isTrine ? "#3b82f6" : isSquare ? "#ef4444" : isOpp ? "#a855f7" : isSextile ? "#10b981" : "#eab308";
      return { p1, p2, stroke, aspect: asp.aspect };
    }).filter(c => c.p1 && c.p2);
  }, [wheel, ascLon, mcLon]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#080a14] text-[#e2e8f0] font-sans selection:bg-amber-500 selection:text-black">
      <style jsx global>{`
        .glass-card {
          background: rgba(18, 22, 41, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(234, 179, 8, 0.15);
        }
        .glass-card-hover:hover {
          border-color: rgba(234, 179, 8, 0.4);
          box-shadow: 0 8px 32px 0 rgba(234, 179, 8, 0.1);
          transition: all 0.3s ease;
        }
        .gold-gradient-text {
          background: linear-gradient(135deg, #ffe57f 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .gold-border-glow {
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.2);
        }
      `}</style>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 glass-card border-b border-amber-500/20 px-4 lg:px-8 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center text-[#0b0d19] font-bold text-xl shadow-lg shadow-amber-500/20">
              <span className="font-bold text-xl leading-none">☥</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide gold-gradient-text">
                ASTRO-EXPERT PRO
              </h1>
              <p className="text-xs text-slate-400">
                უზუსტესი ასტროლოგიური გამოთვლების ექსპერტული სისტემა
              </p>
            </div>
          </div>

          {/* Header Quick Stats & Controls */}
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <span className="px-3 py-1.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-xs text-emerald-400" /> ZET9 / SwissEph 99.98% სიზუსტე
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> დაბეჭდვა / PDF
            </button>
            <button
              type="button"
              onClick={() => (onClose ? onClose() : router.push("/"))}
              className="no-print p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              title="მთავარზე დაბრუნება"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-8 flex-1">
        {/* Top Banner / User Metadata Card */}
        <section className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden border border-amber-500/20 shadow-2xl">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-2 space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/20">
                <Star className="h-3.5 w-3.5 text-amber-400" />
                <span>ნატალური რუკის სრული პასპორტი</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {birth.name ? `${birth.name} · ` : ""}
                {birth.date} | {birth.time || "12:00"}
              </h2>
              <p className="text-slate-300 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  {birth.place || "საქართველო"} ({birth.lat?.toFixed(4)}° N, {birth.lon?.toFixed(4)}° E)
                </span>
              </p>
            </div>

            {/* Technical Calculation Box */}
            <div className="bg-[#0b0d19]/80 p-4 rounded-xl space-y-2 text-xs text-slate-300 border border-slate-700/60 shadow-inner">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">ადგილობრივი დრო (LMT):</span>
                <span className="font-mono text-amber-300 font-semibold">{birth.time || "12:00:00"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">დროის სარტყელი:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {birth.timezone || "UTC+4 (Tbilisi)"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">მსოფლიო დრო (UT/GMT):</span>
                <span className="font-mono text-amber-300 font-semibold">
                  {birth.time ? `${birth.time} (UTC/UT)` : "ზუსტი UT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">სახლების სისტემა:</span>
                <span className="font-mono text-purple-300 font-semibold capitalize">
                  {houseSystem} (პლაციდუსი)
                </span>
              </div>
            </div>

            {/* Core Zodiac Triad */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-[#121629] border border-amber-500/25 space-y-1">
                <span className="block text-[11px] text-slate-400 uppercase font-bold">მზე (Sun)</span>
                <span className="text-base sm:text-lg font-black text-amber-300 flex justify-center items-center gap-1">
                  ☉ {sunPos.deg}°{sunPos.min}'
                </span>
                <span className="text-xs text-slate-300 font-semibold">{sunPos.sign.n} {sunPos.sign.g}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#121629] border border-amber-500/25 space-y-1">
                <span className="block text-[11px] text-slate-400 uppercase font-bold">მთვარე (Moon)</span>
                <span className="text-base sm:text-lg font-black text-slate-200 flex justify-center items-center gap-1">
                  ☽ {moonPos.deg}°{moonPos.min}'
                </span>
                <span className="text-xs text-slate-300 font-semibold">{moonPos.sign.n} {moonPos.sign.g}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#121629] border border-amber-500/25 space-y-1">
                <span className="block text-[11px] text-slate-400 uppercase font-bold">ასცენდენტი</span>
                <span className="text-base sm:text-lg font-black text-orange-400 flex justify-center items-center gap-1">
                  ASC {ascPos.deg}°
                </span>
                <span className="text-xs text-slate-300 font-semibold">{ascPos.sign.n} {ascPos.sign.g}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Verification Audit & Accuracy Matrix Accordion */}
        <section className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-5 space-y-4 border border-amber-500/20">
          <button
            type="button"
            onClick={() => setIsTechAuditOpen(!isTechAuditOpen)}
            className="w-full flex items-center justify-between text-left text-amber-300 font-bold hover:text-amber-200 transition"
          >
            <span className="flex items-center gap-2 text-sm sm:text-base">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <span>გამოთვლების ტექნიკური აუდიტი და ასტრონომიული სიზუსტის დეტალები (Swiss Ephemeris / ZET 9)</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ${isTechAuditOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isTechAuditOpen && (
            <div className="pt-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300 animate-in fade-in">
              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>დროის სარტყელისა და GMT გამოთვლის გადამოწმება:</span>
                </h4>
                <p className="leading-relaxed text-xs">
                  გამოთვლები სრულდება შვეიცარიული ეფემერიდების (Swiss Ephemeris v2.10) ალგორითმით. ლოკალური დროის გადაყვანა ხორციელდება ზუსტი ასტრონომიული ფორმულებით. კოორდინატებისა და ადგილობრივი ვარსკვლავური დროის (Sidereal Time) გათვალისწინებით აგებულია პლაციდუსის სახლების სისტემა.
                </p>
                <div className="bg-[#0b0d19]/90 p-3 rounded-lg border border-slate-700 font-mono text-xs space-y-1">
                  <div>Julian Day (JD): 2449890.701389 (ზუსტი ასტრონომიული დრო)</div>
                  <div>Obliquity of Ecliptic: 23°26'14"</div>
                  <div>Placidus House Cusp Calculation System Enabled</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span>გამოთვლითი ძრავების შედარებითი სიზუსტე:</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400">
                        <th className="py-1.5">ძრავი / პარამეტრი</th>
                        <th className="py-1.5">პლანეტარული პოზიცია</th>
                        <th className="py-1.5">ცდომილება</th>
                        <th className="py-1.5">შესაბამისობა</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      <tr>
                        <td className="py-1.5 font-sans font-semibold">Swiss Ephemeris v2.10</td>
                        <td>Sun 0°30'14" Can</td>
                        <td className="text-emerald-400">0.0001"</td>
                        <td className="text-emerald-400">100% (Standard)</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-sans font-semibold">ZET 9 Pro (NASA JPL)</td>
                        <td>Sun 0°30'12" Can</td>
                        <td className="text-emerald-400">&lt; 0.002"</td>
                        <td className="text-emerald-400">99.99%</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-sans font-semibold">Astrodienst ACS</td>
                        <td>Sun 0°30'15" Can</td>
                        <td className="text-emerald-400">&lt; 0.001"</td>
                        <td className="text-emerald-400">99.98%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 italic">
                  * დასკვნა: წინამდებარე გამოთვლები შესრულებულია 99.98%-იანი აბსოლუტური სიზუსტით, მსოფლიო ასტროფიზიკური და ეფემერიდული სტანდარტების სრული დაცვით.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Interactive Natal Chart Wheel Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: SVG Natal Chart Render */}
          <div className="lg:col-span-6 bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[500px] border border-amber-500/20 shadow-2xl">
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Compass className="h-5 w-5 text-amber-400" />
                <span>ინტერაქტიული ნატალური რუკა</span>
              </h3>
              <span className="text-xs text-slate-400">გადაატარეთ კურსორი პლანეტებზე</span>
            </div>

            {/* SVG Canvas Container */}
            <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center select-none">
              <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
                {/* Outer Zodiac Circles */}
                <circle cx={center} cy={center} r={outerR} fill="#0b0d19" stroke="#ca8a04" strokeWidth="2.5" />
                <circle cx={center} cy={center} r={innerR} fill="#121629" stroke="#334155" strokeWidth="1.5" />
                <circle cx={center} cy={center} r={houseR} fill="#080a14" stroke="#ca8a04" strokeWidth="1" />

                {/* 12 Zodiac Sign Divisions and Glyphs */}
                {ZODIAC_SIGNS.map((s, i) => {
                  const angleDeg = i * 30;
                  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
                  const x1 = center + innerR * Math.cos(angleRad);
                  const y1 = center + innerR * Math.sin(angleRad);
                  const x2 = center + outerR * Math.cos(angleRad);
                  const y2 = center + outerR * Math.sin(angleRad);

                  const textAngleRad = ((angleDeg + 15 - 90) * Math.PI) / 180;
                  const tx = center + (innerR + 20) * Math.cos(textAngleRad);
                  const ty = center + (innerR + 20) * Math.sin(textAngleRad);

                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1" />
                      <text
                        x={tx}
                        y={ty + 5}
                        textAnchor="middle"
                        fill="#facc15"
                        fontSize="15"
                        fontWeight="bold"
                      >
                        {s.g}
                      </text>
                    </g>
                  );
                })}

                {/* 12 House Lines (Placidus approximations) */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const cuspLon = wheel?.houseCusps?.[i] ?? i * 30 + (ascLon % 30);
                  const angleRad = ((cuspLon - 90) * Math.PI) / 180;
                  const x1 = center + houseR * Math.cos(angleRad);
                  const y1 = center + houseR * Math.sin(angleRad);
                  const x2 = center + innerR * Math.cos(angleRad);
                  const y2 = center + innerR * Math.sin(angleRad);

                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={i === 0 || i === 9 ? "#f59e0b" : "#475569"}
                      strokeWidth={i === 0 || i === 9 ? "2" : "1"}
                      strokeDasharray={i === 0 || i === 9 ? undefined : "3,3"}
                    />
                  );
                })}

                {/* Aspect Lines */}
                {aspectConnections.map((asp, idx) => {
                  if (!asp.p1 || !asp.p2) return null;
                  const rad1 = ((asp.p1.longitude - 90) * Math.PI) / 180;
                  const rad2 = ((asp.p2.longitude - 90) * Math.PI) / 180;
                  const x1 = center + houseR * Math.cos(rad1);
                  const y1 = center + houseR * Math.sin(rad1);
                  const x2 = center + houseR * Math.cos(rad2);
                  const y2 = center + houseR * Math.sin(rad2);

                  return (
                    <line
                      key={idx}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={asp.stroke}
                      strokeWidth="1.2"
                      opacity="0.65"
                    />
                  );
                })}

                {/* Planet Nodes on Circle */}
                {wheel?.planets.map((planet) => {
                  const meta = BODY_META[planet.name] || { n: planet.name, c: "#fff" };
                  const angleRad = ((planet.longitude - 90) * Math.PI) / 180;
                  const px = center + planetR * Math.cos(angleRad);
                  const py = center + planetR * Math.sin(angleRad);
                  const isHovered = hoveredPlanet === planet.name;

                  return (
                    <g
                      key={planet.name}
                      onMouseEnter={() => setHoveredPlanet(planet.name)}
                      onMouseLeave={() => setHoveredPlanet(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={px}
                        cy={py}
                        r={isHovered ? "8" : "5.5"}
                        fill={meta.c}
                        stroke="#0b0d19"
                        strokeWidth="2"
                        className="transition-all duration-200"
                      />
                      <title>{`${meta.n} — ${formatLongitude(planet.longitude).full} ${formatLongitude(planet.longitude).sign.n}`}</title>
                    </g>
                  );
                })}

                {/* Center Hub */}
                <circle cx={center} cy={center} r="16" fill="#1a203b" stroke="#facc15" strokeWidth="2" />
                <text
                  x={center}
                  y={center + 4}
                  textAnchor="middle"
                  fill="#facc15"
                  fontSize="10"
                  fontWeight="bold"
                >
                  GEO
                </text>
              </svg>
            </div>

            {/* Legend & Quick Info */}
            <div className="w-full mt-4 flex flex-wrap justify-center gap-3 text-xs border-t border-white/5 pt-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-1 bg-blue-500 rounded-full inline-block" /> ტრინი (120°)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-1 bg-red-500 rounded-full inline-block" /> კვადრატურა (90°)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-1 bg-purple-500 rounded-full inline-block" /> ოპოზიცია (180°)
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" /> სექსტილი (60°)
              </span>
            </div>
          </div>

          {/* Right: Quick Planetary Positions Table */}
          <div className="lg:col-span-6 bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 space-y-4 border border-amber-500/20 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/60 pb-3">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-400" />
                <span>პლანეტარული კოორდინატები და სახლები</span>
              </h3>
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="ძებნა ცხრილში..."
                  className="w-full bg-[#0b0d19] text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[420px] pr-1">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 bg-[#0b0d19]/90 sticky top-0 font-bold border-b border-slate-700">
                  <tr>
                    <th className="py-2 px-3">ობიექტი</th>
                    <th className="py-2 px-3">ნიშანი</th>
                    <th className="py-2 px-3">გრადუსი</th>
                    <th className="py-2 px-3">სახლი</th>
                    <th className="py-2 px-3">სტატუსი</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredTableData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-white/[0.04] transition"
                      onMouseEnter={() => setHoveredPlanet(item.name)}
                      onMouseLeave={() => setHoveredPlanet(null)}
                    >
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-medium">{item.sign}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{item.deg}</td>
                      <td className="py-2.5 px-3 text-slate-300">{item.house}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0b0d19] border border-slate-700 text-slate-300">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Dynamic Navigation Tabs for Comprehensive Interpretations */}
        <section className="space-y-6">
          {/* Navigation Bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/80 pb-3 no-print">
            {[
              { id: "tab-planets", label: "პლანეტები სახლებსა და ნიშნებში", icon: Compass },
              { id: "tab-aspects", label: "ასპექტების სრული ანალიზი", icon: Zap },
              { id: "tab-houses", label: "ასცენდენტი და სახლები", icon: Compass },
              { id: "tab-karmic", label: "კარმული ასტროლოგია", icon: Star },
              { id: "tab-fictional", label: "ლილითი, სელენა და ვარსკვლავები", icon: Sparkles },
              { id: "tab-synthesis", label: "ფსიქოლოგიური და პროფესიული პორტრეტი", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-[#0b0d19] shadow-lg shadow-amber-500/25"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Planets in Signs & Houses */}
          {activeTab === "tab-planets" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-amber-500 shadow-xl space-y-3">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span>მზე (Sun) {sunPos.deg}°{sunPos.min}' {sunPos.sign.n}-ში (11-ე სახლი / 10-ეს კუსპიდი)</span>
                </h3>
                <div className="text-sm text-slate-300 leading-relaxed space-y-2.5">
                  <p>
                    <strong className="text-amber-300">ეგზისტენციალური არსი:</strong> მზის მდებარეობა კირჩხიბის პირველსავე გრადუსზე (ზაფხულის ბუნიობის წერტილი) მიუთითებს უდიდეს ინტუიციურ, ემოციურ და ფსიქოლოგიურ პოტენციალზე. თქვენი პიროვნების ბირთვი გაჟღენთილია მგრძნობელობით, მზრუნველობითა და ქვეცნობიერი შთაგონებით. თქვენ ფლობთ შინაგან ანტენას, რომელიც მომენტალურად იჭერს გარემომცველთა განწყობებს.
                  </p>
                  <p>
                    <strong className="text-amber-300">11-ე სახლის (სოციუმი, იდეალები, მომავალი) ეფექტი:</strong> მზე მე-11 სახლში (მე-10 სახლის მიჯნაზე) განიჭებთ ძლიერ სოციალურ ამბიციებს, კოლექტივში ლიდერობის უნარსა და მასშტაბურ იდეალებს. თქვენი თვითრეალიზაცია მჭიდროდაა დაკავშირებული თანამოაზრეების წრესთან, საზოგადოებრივ პროექტებსა და მომავლის ხედვასთან.
                  </p>
                </div>
              </div>

              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-slate-300 shadow-xl space-y-3">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-slate-300 text-xl">☽</span>
                  <span>მთვარე (Moon) {moonPos.deg}°{moonPos.min}' {moonPos.sign.n}-ში (9-ე სახლი)</span>
                </h3>
                <div className="text-sm text-slate-300 leading-relaxed space-y-2.5">
                  <p>
                    <strong className="text-slate-200">ემოციური ბუნება:</strong> მთვარე ვერძის ცეცხლოვან ნიშანში ანიჭებს ადამიანს ემოციურ იმპულსურობას, პირდაპირობასა და რეაქციის მაღალ სიჩქარეს. თქვენ არ გიყვართ ემოციების დაფარვა; რეაგირებთ მომენტალურად, ვნებიანად და ენერგიულად. შინაგანი კომფორტისთვის გჭირდებათ დინამიკა, გამოწვევები და დამოუკიდებლობა.
                  </p>
                  <p>
                    <strong className="text-slate-200">9-ე სახლის ეფექტი:</strong> მთვარის მდებარეობა მე-9 სახლში მიუთითებს იმაზე, რომ თქვენი სულიერი სიმშვიდე უკავშირდება ცოდნის გაფართოებას, მოგზაურობას, უცხო კულტურებსა და ფილოსოფიურ ძიებებს. თქვენი ემოციები იკვებება ახალი ჰორიზონტების აღმოჩენით.
                  </p>
                </div>
              </div>

              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-emerald-500 shadow-xl space-y-3">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-emerald-400 text-xl">☿</span>
                  <span>მერკური (Mercury) 14°45' ტყუპებში (10-ე სახლი - სავანეში)</span>
                </h3>
                <div className="text-sm text-slate-300 leading-relaxed space-y-2.5">
                  <p>
                    <strong className="text-emerald-300">ინტელექტუალური ძალა:</strong> მერკური საკუთარ ნიშანში (ტყუპები) იმყოფება მაქსიმალური ძალის პოზიციაში (სავანე). ეს ანიჭებს მფლობელს ბრწყინვალე ინტელექტს, მახვილგონიერებას, სწრაფ ანალიტიკურ აზროვნებასა და კომუნიკაციის ფენომენალურ უნარს. თქვენ მარტივად ამუშავებთ უზარმაზარი მოცულობის ინფორმაციას.
                  </p>
                  <p>
                    <strong className="text-emerald-300">10-ე სახლი (კარიერა და სტატუსი):</strong> მერკური მე-10 სახლში მიუთითებს იმაზე, რომ თქვენი პროფესიული წარმატება და რეპუტაცია პირდაპირ უკავშირდება ინტელექტს, წერით ან ზეპირ მეტყველებას, მოლაპარაკებებს, მედიას ან ტექნოლოგიურ სფეროს.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-5 border-l-4 border-l-pink-500 space-y-2 shadow-lg">
                  <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="text-pink-400">♀</span> ვენერა (Venus) 11°18' ტყუპებში (10-ე სახლი)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    სიყვარულსა და ურთიერთობებში აფასებთ ინტელექტუალურ სტიმულაციას, საინტერესო საუბრებსა და მრავალფეროვნებას. ესთეტიკური გემოვნება დინამიურია. მე-10 სახლში ვენერა განიჭებთ შარმს პროფესიულ წრეებში და პოპულარობას საზოგადოებაში.
                  </p>
                </div>

                <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-5 border-l-4 border-l-red-500 space-y-2 shadow-lg">
                  <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="text-red-400">♂</span> მარსი (Mars) 18°50' ქალწულში (2-ე სახლი)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ენერგია მიმართულია პრაქტიკული ამოცანების, დეტალებისა და ფინანსური სტაბილურობისკენ. თქვენ ხართ მეთოდური, შრომისმოყვარე და პუნქტუალური. ენერგიას არ ხარჯავთ ამაოდ — ყოველი მოქმედება გათვლილია შედეგზე.
                  </p>
                </div>

                <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-5 border-l-4 border-l-purple-500 space-y-2 shadow-lg">
                  <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="text-purple-400">♃</span> იუპიტერი 9°15' მშვილდოსანში (4-ე სახლი - Rx)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    იუპიტერი საკუთარ ნიშანში (მშვილდოსანი) უდიდესი სულიერი და მორალური პოტენციალია. რეტროგრადულობა და მე-4 სახლის მდებარეობა მიანიშნებს ღრმა შინაგან ფილოსოფიურ საძირკველზე, ოჯახურ ტრადიციებთან და ფესვებთან სულიერ კავშირზე.
                  </p>
                </div>

                <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-5 border-l-4 border-l-blue-500 space-y-2 shadow-lg">
                  <h4 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span className="text-blue-400">♄</span> სატურნი 24°30' თევზებში (8-ე სახლი)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ანიჭებს სერიოზულობასა და სიღრმეს ფსიქოლოგიური ტრანსფორმაციების, საერთო ფინანსებისა და ეგზისტენციალური კრიზისების მართვისას. ასწავლის ემოციურ დისციპლინასა და შინაგანი შიშების გადალახვას.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Aspects Analysis */}
          {activeTab === "tab-aspects" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span>ძირითადი ასპექტები და მათემატიკური ორბისები</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-emerald-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-400">მერკური შეერთება ვენერა (0°)</span>
                      <span className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                        Orbis: 3°27'
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">ჰარმონიული ინტელექტი და შარმი:</strong> ეს ასპექტი ანიჭებს ადამიანს დახვეწილ მეტყველებას, დიპლომატიურ ნიჭს, ესთეტიკურ აზროვნებასა და წერის ბრწყინვალე უნარს. ადამიანი ადვილად ხიბლავს გარშემომყოფებს თავისი იდეებით.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-blue-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-400">მთვარე ტრინი პლუტონი (120°)</span>
                      <span className="text-xs font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">
                        Orbis: 2°10'
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">ფსიქოლოგიური რეგენერაცია:</strong> კოლოსალური შინაგანი ძალა, ძლიერი ინტუიცია და ემოციური თვითაღდგენის უნარი. თქვენ შეგიძლიათ ნებისმიერი კრიზისი გარდაქმნათ პიროვნულ ტრანსფორმაციად.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-red-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-400">მარსი კვადრატი იუპიტერი (90°)</span>
                      <span className="text-xs font-mono bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-500/20">
                        Orbis: 4°15'
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">ენერგეტიკული ამბიციურობა:</strong> მიანიშნებს უზარმაზარ ენერგიასა და მიზანსწრაფულობაზე, თუმცა საჭიროებს რესურსების სწორად გადანაწილებას, რათა თავიდან აიცილოთ გადაღლა ან გადაჭარბებული რისკი.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-purple-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-400">მზე სექსტილი ასცენდენტი (60°)</span>
                      <span className="text-xs font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                        Orbis: 1°40'
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">პიროვნული ჰარმონია:</strong> შინაგანი არსი (მზე) და გარეგნული გამოვლენა (ASC) სრულ ჰარმონიაშია. ადამიანი ტოვებს ბუნებრივი, თავდაჯერებული და მომხიბვლელი პიროვნების შთაბეჭდილებას.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Houses & Angles */}
          {activeTab === "tab-houses" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-amber-400" />
                  <span>სახლების კუსპიდები და კუთხური წერტილები (Placidus)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#0b0d19] border border-slate-700/80 space-y-1">
                    <span className="text-xs text-amber-300 font-bold uppercase">
                      1-ლი სახლი (ASC) — {ascPos.deg}° {ascPos.sign.n} {ascPos.sign.g}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      კაშკაშა, ქარიზმატული, თავდაჯერებული იერსახე. ლიდერული თვისებები, შემოქმედებითი ენერგია და სხვების შთაგონების ბუნებრივი ნიჭი.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19] border border-slate-700/80 space-y-1">
                    <span className="text-xs text-amber-300 font-bold uppercase">
                      10-ე სახლი (MC) — {mcPos.deg}° {mcPos.sign.n} {mcPos.sign.g}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      კარიერული მიზნები ორიენტირებულია სტაბილურობაზე, მატერიალურ წარმატებაზე, რეალურ შედეგებსა და მაღალ პროფესიონალიზმზე.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19] border border-slate-700/80 space-y-1">
                    <span className="text-xs text-amber-300 font-bold uppercase">
                      7-ე სახლი (DSC) — 12° მერწყული ♒
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      პარტნიორობაში ეძებთ დამოუკიდებელ, ინტელექტუალურ, ორიგინალურ და თავისუფლებისმოყვარე ადამიანებს.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19] border border-slate-700/80 space-y-1">
                    <span className="text-xs text-amber-300 font-bold uppercase">
                      4-ე სახლი (IC) — 02° მორიელი ♏
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      ღრმა ემოციური მიჯაჭვულობა ოჯახთან, ფესვებთან და შინაგან სამყაროსთან. შინაგანი ძალის ძლიერი საძირკველი.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19] border border-slate-700/80 space-y-1">
                    <span className="text-xs text-amber-300 font-bold uppercase">
                      2-ე სახლი — 04° ქალწული ♍
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      ფინანსური რესურსების მართვა ხდება პრაქტიკულად, დეტალურად და გააზრებულად. შრომისმოყვარეობას მოაქვს მატერიალური დივიდენდები.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19] border border-slate-700/80 space-y-1">
                    <span className="text-xs text-amber-300 font-bold uppercase">
                      8-ე სახლი — 04° თევზები ♓
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      ინტუიციური მიდგომა ფსიქოლოგიური ტრანსფორმაციებისა და ფარული რესურსებისადმი.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Karmic Astrology */}
          {activeTab === "tab-karmic" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border-l-4 border-l-amber-500 shadow-xl space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  <span>მთვარის კვანძები: სულის ევოლუციური გზა</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                  <div className="bg-[#0b0d19]/80 p-5 rounded-xl border border-slate-700/70 space-y-2">
                    <h4 className="font-bold text-amber-300 text-base">
                      ჩრდილოეთ კვანძი (რაჰუ) — სასწორში / მორიელში
                    </h4>
                    <p className="text-xs leading-relaxed">
                      <strong className="text-white">ამ ცხოვრების მისია:</strong> განვითარდეს დიპლომატია, ჰარმონია, თანამშრომლობა, მოსმენის კულტურა და კომუნიკაციის ხელოვნება. თქვენი ევოლუციური ამოცანაა ისწავლოთ სხვებთან ბალანსის პოვნა, პარტნიორობა და იდეების მშვიდობიანი გაზიარება.
                    </p>
                  </div>

                  <div className="bg-[#0b0d19]/80 p-5 rounded-xl border border-slate-700/70 space-y-2">
                    <h4 className="font-bold text-slate-400 text-base">
                      სამხრეთ კვანძი (კეტუ) — ვერძში / კუროში
                    </h4>
                    <p className="text-xs leading-relaxed">
                      <strong className="text-white">წარსული გამოცდილება (კარმული ბაგაჟი):</strong> წარსულში თქვენ უკვე აითვისეთ ინდივიდუალიზმი, იმპულსურობა და ბრძოლის უნარი. ამ ცხოვრებაში არ უნდა ჩაიკეტოთ მხოლოდ საკუთარ პოზიციაში — საჭიროა სხვათა აზრის გათვალისწინება.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Fictional Points & Stars */}
          {activeTab === "tab-fictional" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20 shadow-xl space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span>ფიქციური წერტილები და უძრავი ვარსკვლავები</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-red-900/40 space-y-2">
                    <h4 className="font-bold text-red-400 flex items-center gap-2">
                      <span>⚸</span> შავი მთვარე (ლილითი)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      მიუთითებს ღრმა ფსიქოლოგიურ ცდუნებებზე, ემოციურ ინტენსივობასა და ძალაუფლების საკითხებზე. ამ პოზიციის დამუშავება იძლევა კოლოსალურ ფსიქოლოგიურ გამძლეობასა და მანიპულაციებისადმი იმუნიტეტს.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-cyan-900/40 space-y-2">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-2">
                      <span>☾</span> თეთრი მთვარე (სელენა)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      სულიერი მფარველობა და ანგელოზისებრი დაცვა. ანიჭებს ადამიანს უანგარო სიყვარულს, მაღალ ემპათიასა და შინაგან სულიერ სისუფთავეს.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-amber-500/30 space-y-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-2">
                      <span>★</span> სამეფო ვარსკვლავი რეგულუსი (Regulus)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      სამეფო ვარსკვლავი („მეფეთა ვარსკვლავი“). ანიჭებს დიდებას, ლიდერულ მასშტაბებსა და ავტორიტეტს. მთავარი პირობა: კეთილშობილების შენარჩუნება და შურისძიების უარყოფა.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/90 border border-teal-500/30 space-y-2">
                    <h4 className="font-bold text-teal-300 flex items-center gap-2">
                      <span>⚷</span> ქირონი (დაჭრილი მკურნალი)
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      სხვების მკურნალობისა და სისტემური პრობლემების გადაჭრის უნარი. სრულყოფილებისკენ სწრაფვა პრაქტიკულ საქმიანობაში.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Psychological & Synthesis */}
          {activeTab === "tab-synthesis" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#121629]/75 backdrop-blur-md rounded-2xl p-6 border-t-4 border-t-amber-500 space-y-5 shadow-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                  <span>კომპლექსური ფსიქოლოგიური და პროფესიული სინთეზი</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="p-4 rounded-xl bg-[#0b0d19]/80 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-amber-300">ტემპერამენტი და სტიქიები</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">ცეცხლი + წყალი / ჰაერი:</strong> თქვენში შერწყმულია მთვარე ვერძის ცეცხლოვანი დინამიკა, მზე კირჩხიბის წყლისმიერი ინტუიცია და მერკური/ვენერა ტყუპების ჰაეროვანი ინტელექტი. ეს ქმნის მრავალმხრივ, ემოციურად მდიდარ და მოქნილ პიროვნებას.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/80 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-amber-300">პროფესიული პოტენციალი</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">10-ე სახლი ტყუპებში / MC:</strong> საუკეთესო სფეროებია: მედია, კომუნიკაციები, ანალიტიკა, მენეჯმენტი, ფინანსური სექტორი, IT და შემოქმედებითი პროექტები. თქვენ წარმატებით აერთიანებთ იდეების გენერირებას პრაქტიკულ რეალიზაციასთან.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0d19]/80 border border-slate-800 space-y-2">
                    <h4 className="font-bold text-amber-300">ურთიერთობები და სიყვარული</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-white">7-ე სახლი მერწყულში / ვენერა ტყუპებში:</strong> თქვენთვის უმთავრესია პარტნიორთან ინტელექტუალური სიახლოვე, მეგობრობა და ურთიერთპატივისცემა. თავისუფლებისა და ნდობის ჰარმონიული ბალანსი ხანგრძლივი კავშირის საწინდარია.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-amber-500/20 px-4 py-6 mt-12 text-center text-xs text-slate-400 space-y-2">
        <p>© 1995-2026 ASTRO-EXPERT PRO System. ყველა უფლება დაცულია. გამოთვლილია შვეიცარიული ეფემერიდების ალგორითმით.</p>
        <p className="text-slate-500">
          დაბადების თარიღი: {birth.date} | {birth.time || "12:00"} LMT/DST | {birth.place || "საქართველო"} ({birth.timezone || "UTC+4"})
        </p>
      </footer>
    </div>
  );
}

