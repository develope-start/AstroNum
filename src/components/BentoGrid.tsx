"use client";

import { Activity, Compass, Download, Flame, Heart, Layers, Loader2, Lock, Orbit, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { useLiveTransit } from "@/lib/useLiveTransit";

const GEORGIAN_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

export default function BentoGrid() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const transit = useLiveTransit();
  const transitDateValue = transit ? new Date(`${transit.date}T00:00:00Z`) : null;
  const transitDay = transitDateValue
    ? new Intl.DateTimeFormat("ka-GE", { day: "2-digit", timeZone: "UTC" }).format(transitDateValue)
    : "—";
  const transitMonth = transitDateValue
    ? new Intl.DateTimeFormat("ka-GE", { month: "2-digit", timeZone: "UTC" }).format(transitDateValue)
    : "—";
  const transitDate = transitDateValue
    ? `${transitDateValue.getUTCDate()} ${GEORGIAN_MONTHS[transitDateValue.getUTCMonth()]} ${transitDateValue.getUTCFullYear()}`
    : null;

  const featureSelectionProps = (id: string) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": selectedFeature === id,
    onClick: () => setSelectedFeature(id),
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSelectedFeature(id);
      }
    },
  });

  // პლანეტების სიმბოლოების მაპინგი სათაურისთვის (4 მთავარი)
  const sun   = transit?.planets.find(p => p.name === "Sun");
  const moon  = transit?.planets.find(p => p.name === "Moon");
  const asc   = transit?.angles;
  const mc    = transit?.angles;

  // სტიქიების ტემპერამენტის სახელები
  const temperaments: Record<string, string> = {
    fire:  "ქოლერიკული",
    earth: "მელანქოლიკური",
    air:   "სანგვინიკური",
    water: "ფლეგმატური",
  };
  const elementNameKa: Record<string, string> = {
    fire:  "ცეცხლი (Fire)",
    earth: "მიწა (Earth)",
    air:   "ჰაერი (Air)",
    water: "წყალი (Water)",
  };
  const elementGradient: Record<string, string> = {
    fire:  "from-amber-500 to-rose-500",
    earth: "from-emerald-500 to-teal-500",
    air:   "from-sky-400 to-indigo-400",
    water: "from-cyan-400 to-blue-500",
  };
  const elementText: Record<string, string> = {
    fire:  "text-amber-400",
    earth: "text-emerald-400",
    air:   "text-sky-400",
    water: "text-cyan-400",
  };
  const elementTitle: Record<string, string> = {
    fire:  "text-[#ff6e65]",
    earth: "text-[#f59e0b]",
    air:   "text-[#38bdf8]",
    water: "text-[#818cf8]",
  };
  const elementGlowColor: Record<string, string> = {
    fire:  "rgba(255, 45, 45, 0.7)",
    earth: "rgba(210, 130, 55, 0.65)",
    air:   "rgba(56, 189, 248, 0.7)",
    water: "rgba(99, 102, 241, 0.7)",
  };

  const elemOrder: Array<"fire" | "earth" | "air" | "water"> = ["fire", "earth", "air", "water"];
  const el = transit?.elements;

  return (
    <section id="features" className="relative my-20 w-full scroll-mt-24">
      {/* Background radial aura */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.04] blur-[140px]" />

      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3.5 py-1 text-sm font-medium text-cyan-200 backdrop-blur-md">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span>არქიტექტურა და შესაძლებლობები</span>
        </div>
      </div>

      {/* Bento Grid: 6-card layout */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

        {/* ═══════════════════════════════════════════════
            Card 1: Swiss Ephemeris Engine — LIVE TRANSIT
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("ephemeris")}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 lg:col-span-2 ${
            selectedFeature === "ephemeris" ? "border-cyan-400/70 ring-1 ring-cyan-400/40" : "border-white/[0.08]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl transition-all group-hover:bg-cyan-500/20" />

          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/40 text-cyan-200 shadow-inner">
                  <span className="font-mono text-base font-bold leading-none">{transitDay}</span>
                  <span className="mt-1 text-[9px] font-medium leading-none">{transitMonth}</span>
                </div>
                <span className="font-mono text-xs font-semibold text-cyan-400/80 bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  0.0001° სიზუსტე
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white sm:text-2xl">
                Swiss Ephemeris v2.1 ციური გამოთვლების ბირთვი
              </h3>
              <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate-300">
                უმაღლესი სიზუსტის შვეიცარული ეფემერიდი ასტრონომიულ კოორდინატებს ითვლის წამის მეასედის სიზუსტით.
                მხარდაჭერილია პლაციდუსი, კოხი, თანაბარსახლიანი და მთლიანი ნიშნის სისტემები.
              </p>
            </div>

            {/* ── Live Transit Box ── */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#070b13]/80 p-4 font-mono text-xs">
              {/* Header row */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  LIVE · {transitDate ?? "თბილისის ტრანზიტი"}
                </span>
                <span className="text-slate-300">
                  {transit
                    ? `${transit.utcTime} · თბილისი ${transit.tbilisiTime.replace(" (+04:00)", "")} (GMT+4)`
                    : "იტვირთება…"}
                </span>
              </div>

              {/* 4 main bodies */}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Sun */}
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[11px] text-slate-300">მზე (Sun)</span>
                  {sun ? (
                    <p className="text-sm font-semibold text-amber-300 mt-0.5">
                      {sun.deg}°{String(sun.min).padStart(2,"0")}' {sun.signSymbol}
                      {sun.retrograde && <span className="ml-1 text-rose-400 text-[10px]">℞</span>}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-amber-300/40 mt-0.5 animate-pulse">—°—' ☉</p>
                  )}
                  {sun && <p className="text-[10px] text-slate-300 mt-0.5">{sun.signKa}</p>}
                </div>

                {/* Moon */}
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[11px] text-slate-300">მთვარე (Moon)</span>
                  {moon ? (
                    <p className="text-sm font-semibold text-sky-200 mt-0.5">
                      {moon.deg}°{String(moon.min).padStart(2,"0")}' {moon.signSymbol}
                      {moon.retrograde && <span className="ml-1 text-rose-400 text-[10px]">℞</span>}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-sky-200/40 mt-0.5 animate-pulse">—°—' ☽</p>
                  )}
                  {moon && <p className="text-[10px] text-slate-300 mt-0.5">{moon.signKa}</p>}
                </div>

                {/* ASC */}
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[11px] text-slate-300">ასცენდენტი (ASC)</span>
                  {asc ? (
                    <p className="text-sm font-semibold text-indigo-300 mt-0.5">
                      {asc.ascDeg}°{String(asc.ascMin).padStart(2,"0")}' {asc.ascSignSymbol}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-indigo-300/40 mt-0.5 animate-pulse">—°—' ♑</p>
                  )}
                  {asc && <p className="text-[10px] text-slate-300 mt-0.5">{asc.ascSignKa}</p>}
                </div>

                {/* MC */}
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[11px] text-slate-300">მედიუმ ცელი (MC)</span>
                  {mc ? (
                    <p className="text-sm font-semibold text-rose-300 mt-0.5">
                      {mc.mcDeg}°{String(mc.mcMin).padStart(2,"0")}' {mc.mcSignSymbol}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-rose-300/40 mt-0.5 animate-pulse">—°—' ♌</p>
                  )}
                  {mc && <p className="text-[10px] text-slate-300 mt-0.5">{mc.mcSignKa}</p>}
                </div>
              </div>

              {/* ── All Planets Transit Strip ── */}
              {transit && (
                <div className="mt-3 pt-2 border-t border-white/[0.05]">
                  <p className="text-[10px] text-slate-300 mb-1.5 uppercase tracking-widest">ტრანზიტული მონაცემები · {transit.tbilisiTime} · თბილისი</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {transit.planets.map(p => (
                      <span key={p.name} className={`text-[10px] font-mono ${p.color}`}>
                        {p.symbol} {p.deg}°{String(p.min).padStart(2,"0")}' {p.signSymbol}
                        {p.retrograde ? <span className="text-rose-400 text-[8px]">℞</span> : null}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            Card 2: 4-Element Temperament — LIVE TRANSIT
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("temperament")}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
            selectedFeature === "temperament" ? "border-amber-400/70 ring-1 ring-amber-400/40" : "border-white/[0.08]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-950/40 text-amber-300 shadow-inner">
            <Flame className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            4 სტიქიის ტემპერამენტის სინთეზი
          </h3>
          <p className="mt-2 text-base text-slate-300">
            ჰიპოკრატესა და კლასიკური ასტროლოგიის ტემპერამენტების (სანგვინიკური, ქოლერიკული, მელანქოლიკური, ფლეგმატური) ავტომატური ბალანსირება.
          </p>

          <div className="mt-5 space-y-3">
            {el ? (
              elemOrder.map(key => (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className={`text-[12.5px] font-bold tracking-wide ${elementTitle[key]}`}>
                      {elementNameKa[key]} <span className="font-normal opacity-70">·</span> <span className="opacity-85">{temperaments[key]}</span>
                    </span>
                    <span
                      className={`${elementTitle[key]} font-mono text-sm font-extrabold`}
                      style={{ textShadow: `0 0 12px ${elementGlowColor[key]}` }}
                    >
                      {el[key]}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: `${elementGlowColor[key]}33` }}
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${elementGradient[key]} transition-all duration-1000`}
                      style={{
                        width: `${el[key]}%`,
                        boxShadow: `0 0 14px 2px ${elementGlowColor[key]}, inset 0 1px 1px rgba(255,255,255,0.3)`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              elemOrder.map(key => (
                <div key={key}>
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className={`text-[12.5px] font-bold tracking-wide ${elementTitle[key]}`}>
                      {elementNameKa[key]} <span className="font-normal opacity-70">·</span> <span className="opacity-85">{temperaments[key]}</span>
                    </span>
                    <span
                      className={`${elementTitle[key]} font-mono text-sm font-extrabold animate-pulse`}
                      style={{ textShadow: `0 0 12px ${elementGlowColor[key]}` }}
                    >
                      …%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${elementGradient[key]} animate-pulse`}
                      style={{
                        width: "30%",
                        boxShadow: `0 0 14px 2px ${elementGlowColor[key]}, inset 0 1px 1px rgba(255,255,255,0.3)`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Transit subtitle ── */}
          <p className="mt-3 text-[10px] text-slate-300 uppercase tracking-widest">
            {transit
              ? `ტრანზიტული სტიქიები · ${transit.tbilisiTime} · თბილისი`
              : "გამოითვლება…"}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════
            Card 3: Synastry Aspects — LIVE TRANSIT
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("synastry")}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-pink-500/30 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${
            selectedFeature === "synastry" ? "border-pink-400/70 ring-1 ring-pink-400/40" : "border-white/[0.08]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl transition-all group-hover:bg-pink-500/20" />

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-950/40 text-pink-300 shadow-inner">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            სინასტრიული ასპექტების მატრიცა
          </h3>
          <p className="mt-2 text-base text-slate-300">
            ორი რუკის შედარება, ჰარმონიული და დისონანსური ასპექტების წონითი ანალიზი და ურთიერთობის დინამიკის გაშიფვრა.
          </p>

          <div className="mt-5 rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-3 space-y-1.5">
            {transit?.synastryAspects && transit.synastryAspects.length > 0 ? (
              transit.synastryAspects.slice(0, 4).map((asp, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between text-xs text-slate-300 ${i > 0 ? "border-t border-white/[0.04] pt-1.5" : ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`font-bold ${asp.type === "harmonic" ? "text-pink-400" : "text-rose-500"}`}>
                      {asp.symbol1} {asp.aspectSymbol} {asp.symbol2}
                    </span>
                    <span className="text-[10px] truncate max-w-[90px]">{asp.planet1} · {asp.planet2}</span>
                  </span>
                  <span className={`font-mono font-semibold text-[10px] ${asp.type === "harmonic" ? "text-emerald-400" : "text-rose-400"}`}>
                    {asp.type === "harmonic" ? "+" : ""}{asp.score} Orb {asp.orb}°
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>ასპექტები გამოითვლება…</span>
              </div>
            )}
          </div>

          {/* ── Transit subtitle ── */}
          <p className="mt-2 text-[10px] text-slate-300 uppercase tracking-widest">
            {transit
              ? `მიმდინარე ტრანზიტი · ${transit.tbilisiTime} · თბილისი`
              : "გამოითვლება…"}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════
            Card 4: Gemini AI Astrology Intelligence
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("ai")}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
            selectedFeature === "ai" ? "border-violet-400/70 ring-1 ring-violet-400/40" : "border-white/[0.08]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl transition-all group-hover:bg-violet-500/20" />

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-950/40 text-violet-300 shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            Gemini AI ასტროლოგიური ინტელექტი
          </h3>
          <p className="mt-2 text-base text-slate-300">
            Google Gemini 1.5 Flash-ის ღრმა ანალიზი ქართულ ენაზე: პიროვნული ბირთვი, პროფესია, კარიერა, სიყვარული და კარმული მისია.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-3 text-xs text-slate-300 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              Gemini 1.5 Flash AI
            </span>
            <span className="text-violet-400 font-semibold">ინტეგრირებულია</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            Card 5: Birth Time Rectification
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("rectification")}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
            selectedFeature === "rectification" ? "border-emerald-400/70 ring-1 ring-emerald-400/40" : "border-white/[0.08]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20" />

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-950/40 text-emerald-300 shadow-inner">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            დაბადების დროის რექტიფიკაცია
          </h3>
          <p className="mt-2 text-base text-slate-300">
            დაადგინეთ დაბადების ზუსტი წუთი და ასცენდენტის გრადუსი ცხოვრებისეული მოვლენების (ქორწინება, კარიერა, შვილი) Solar Arc სკანირებით.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              პრიმარული დირექციები
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">სიზუსტე ±1 წთ</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            Card 6: PDF & SVG Export (full width)
            ═══════════════════════════════════════════════ */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] lg:col-span-3">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl transition-all group-hover:bg-indigo-500/20" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-950/40 text-indigo-300 shadow-inner">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white sm:text-2xl">
                პროფესიონალური PDF და SVG ვექტორული ექსპორტი
              </h3>
              <p className="mt-2 text-base leading-relaxed text-slate-300">
                შექმენით კრისტალურად სუფთა, ბეჭდვისთვის მზა ანგარიშები ქართულ ენაზე. მოიცავს რუკის დისკს, პლანეტარულ ასპექტების ცხრილებს, სტიქიურ ბალანსს და სიღრმისეულ განმარტებებს.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
                <Layers className="h-4 w-4 text-cyan-300" />
                <span>მაღალი გარჩევადობა 300 DPI</span>
              </div>
              <a
                href="#calculator"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
              >
                <Wand2 className="h-4 w-4" />
                <span>შექმენით რუკა</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
