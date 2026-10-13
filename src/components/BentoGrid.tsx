"use client";

import { Activity, Compass, Flame, Loader2, Lock, Moon, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { useLiveTransit } from "@/lib/useLiveTransit";

const GEORGIAN_MONTHS = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];
const WEEKDAYS_KA = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"];
const MOON_SIGN_LOCATIVE: Record<string, string> = {
  ვერძი: "ვერძში",
  კურო: "კუროში",
  ტყუპები: "ტყუპებში",
  კირჩხიბი: "კირჩხიბში",
  ლომი: "ლომში",
  ქალწული: "ქალწულში",
  სასწორი: "სასწორში",
  მორიელი: "მორიელში",
  მშვილდოსანი: "მშვილდოსანში",
  "თხის რქა": "თხის რქაში",
  მერწყული: "მერწყულში",
  თევზები: "თევზებში",
};
const PLANET_TEXT_COLOR: Record<string, string> = {
  მზე: "text-amber-300",
  მთვარე: "text-slate-200",
  მერკური: "text-orange-300",
  ვენერა: "text-emerald-300",
  მარსი: "text-red-400",
  იუპიტერი: "text-purple-300",
  სატურნი: "text-slate-400",
  ურანი: "text-cyan-300",
  ნეპტუნი: "text-blue-400",
  პლუტონი: "text-violet-300",
};
const ASPECT_TEXT_COLOR: Record<string, string> = {
  კონიუნქცია: "text-[#c58b58]",
  სექსტილი: "text-sky-300",
  ტრიგონი: "text-emerald-300",
  კვადრატი: "text-red-400",
  ოპოზიცია: "text-rose-400",
  კვინკუნქსი: "text-amber-300",
};

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

  const handleSpotlightMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);

    // 3D Perspective Tilt
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((centerY - y) / centerY) * 4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
  };

  const handleSpotlightLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = event.currentTarget;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
  };

  const featureSelectionProps = (id: string) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": selectedFeature === id,
    onMouseMove: handleSpotlightMove,
    onMouseLeave: handleSpotlightLeave,
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

      {/* Bento Grid: 7-card layout */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {/* ═══════════════════════════════════════════════
            Card 1: Swiss Ephemeris Engine — LIVE TRANSIT
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("ephemeris")}
          className={`cosmic-spotlight group relative order-1 cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:col-span-2 lg:col-span-3 xl:col-span-3 ${
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
              <h3 className="mt-5 font-display text-lg font-bold text-white sm:text-xl">
                Swiss Ephemeris v2.1 ციური გამოთვლების ბირთვი
              </h3>
              <p className="mt-2.5 max-w-none text-sm leading-relaxed text-slate-300 sm:text-base">
                უმაღლესი სიზუსტის შვეიცარული ეფემერიდი ასტრონომიულ კოორდინატებს ითვლის წამის მეასედის სიზუსტით.
                მხარდაჭერილია პლაციდუსი, კოხი, თანაბარსახლიანი და მთლიანი ნიშნის სისტემები.
              </p>
            </div>

            {/* ── Live Transit Box ── */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#070b13]/80 p-4 font-mono text-sm">
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-white/[0.06] pb-2 text-sm text-slate-300">
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
              <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {/* Sun */}
                <div className="rounded-lg bg-white/[0.02] p-3 border border-white/[0.03]">
                  <span className="block break-words text-sm leading-snug text-slate-200">მზე (Sun)</span>
                  {sun ? (
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-base font-semibold text-amber-300 sm:text-lg">
                      <span className="whitespace-nowrap">{sun.deg}°{String(sun.min).padStart(2,"0")}'</span>
                      <span className="shrink-0 text-xl leading-none">{sun.signSymbol}</span>
                      {sun.retrograde && <span className="text-sm text-rose-400">℞</span>}
                    </p>
                  ) : (
                    <p className="mt-1 text-base font-semibold text-amber-300/40 animate-pulse">—°—' ☉</p>
                  )}
                  {sun && <p className="mt-1 text-xs text-slate-200">{sun.signKa}</p>}
                </div>

                {/* Moon */}
                <div className="rounded-lg bg-white/[0.02] p-3 border border-white/[0.03]">
                  <span className="block break-words text-sm leading-snug text-slate-200">მთვარე (Moon)</span>
                  {moon ? (
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-base font-semibold text-sky-200 sm:text-lg">
                      <span className="whitespace-nowrap">{moon.deg}°{String(moon.min).padStart(2,"0")}'</span>
                      <span className="shrink-0 text-xl leading-none">{moon.signSymbol}</span>
                      {moon.retrograde && <span className="text-sm text-rose-400">℞</span>}
                    </p>
                  ) : (
                    <p className="mt-1 text-base font-semibold text-sky-200/40 animate-pulse">—°—' ☽</p>
                  )}
                  {moon && <p className="mt-1 text-xs text-slate-200">{moon.signKa}</p>}
                </div>

                {/* ASC */}
                <div className="rounded-lg bg-white/[0.02] p-3 border border-white/[0.03]">
                  <span className="block break-words text-sm leading-snug text-slate-200">ასცენდენტი (ASC)</span>
                  {asc ? (
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-base font-semibold text-indigo-300 sm:text-lg">
                      <span className="whitespace-nowrap">{asc.ascDeg}°{String(asc.ascMin).padStart(2,"0")}'</span>
                      <span className="shrink-0 text-xl leading-none">{asc.ascSignSymbol}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-base font-semibold text-indigo-300/40 animate-pulse">—°—' ♑</p>
                  )}
                  {asc && <p className="mt-1 text-xs text-slate-200">{asc.ascSignKa}</p>}
                </div>

                {/* MC */}
                <div className="rounded-lg bg-white/[0.02] p-3 border border-white/[0.03]">
                  <span className="block break-words text-sm leading-snug text-slate-200">მედიუმ ქოელი (MC)</span>
                  {mc ? (
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-base font-semibold text-rose-300 sm:text-lg">
                      <span className="whitespace-nowrap">{mc.mcDeg}°{String(mc.mcMin).padStart(2,"0")}'</span>
                      <span className="shrink-0 text-xl leading-none">{mc.mcSignSymbol}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-base font-semibold text-rose-300/40 animate-pulse">—°—' ♌</p>
                  )}
                  {mc && <p className="mt-1 text-xs text-slate-200">{mc.mcSignKa}</p>}
                </div>
              </div>

              {/* ── All Planets Transit Strip ── */}
              {transit && (
                <div className="mt-3 pt-2 border-t border-white/[0.05]">
                  <p className="mb-2 text-xs text-slate-200 uppercase tracking-widest sm:text-sm">ტრანზიტული მონაცემები · {transit.tbilisiTime} · თბილისი</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {transit.planets.map(p => (
                      <span key={p.name} className={`inline-flex items-center gap-1 font-mono text-xs sm:text-sm ${p.color}`}>
                        <span className="text-base font-semibold sm:text-lg">{p.symbol}</span>
                        <span>{p.deg}°{String(p.min).padStart(2,"0")}'</span>
                        <span className="text-base sm:text-lg">{p.signSymbol}</span>
                        {p.retrograde ? <span className="text-xs text-rose-400">℞</span> : null}
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
          className={`cosmic-spotlight group relative order-2 cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
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
          className={`cosmic-spotlight group relative order-4 cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-pink-500/30 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 ${
            selectedFeature === "synastry" ? "border-pink-400/70 ring-1 ring-pink-400/40" : "border-white/[0.08]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl transition-all group-hover:bg-pink-500/20" />

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-950/40 text-pink-300 shadow-inner">
            <Orbit className="h-6 w-6" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            მიმდინარე ასპექტები
          </h3>
          <p className="mt-2 text-base text-slate-300">
            მიმდინარე პლანეტურ პოზიციებს შორის ყველაზე ძლიერი ჰარმონიული და დაძაბული ასპექტები.
          </p>

          <div className="mt-5 rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-4 space-y-1">
            {transit?.synastryAspects && transit.synastryAspects.length > 0 ? (
              transit.synastryAspects.map((asp, i) => (
                <div
                  key={`${asp.planet1}-${asp.aspectName}-${asp.planet2}`}
                  className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm text-slate-300 ${i > 0 ? "border-t border-white/[0.04] pt-2.5" : ""}`}
                >
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 leading-relaxed">
                    <span className={`inline-flex items-center gap-1.5 font-bold ${PLANET_TEXT_COLOR[asp.planet1] ?? "text-slate-200"}`}>
                      <span className="text-lg leading-none sm:text-xl">{asp.symbol1}</span>
                      <span>{asp.planet1}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${ASPECT_TEXT_COLOR[asp.aspectName] ?? "text-slate-200"}`}>
                      <span className="text-xl leading-none sm:text-2xl">{asp.aspectSymbol}</span>
                      <span>{asp.aspectName}</span>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 font-bold ${PLANET_TEXT_COLOR[asp.planet2] ?? "text-slate-200"}`}>
                      <span className="text-lg leading-none sm:text-xl">{asp.symbol2}</span>
                      <span>{asp.planet2}</span>
                    </span>
                  </span>
                  <span className={`ml-auto whitespace-nowrap font-mono text-xs font-semibold sm:text-[13px] ${asp.type === "harmonic" ? "text-emerald-400" : "text-rose-400"}`}>
                    {asp.type === "harmonic" ? "+" : ""}{asp.score} · ორბისი {asp.orb}°
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
          className={`cosmic-spotlight group relative order-5 cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
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
          className={`cosmic-spotlight group relative order-6 cursor-pointer overflow-hidden rounded-2xl border bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
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
            Card 6: Live Lunar Calendar
            ═══════════════════════════════════════════════ */}
        <div
          {...featureSelectionProps("lunar-calendar")}
          className={`cosmic-spotlight group relative order-3 cursor-pointer overflow-hidden rounded-2xl border bg-[#0a0b1c]/50 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_30px_-5px_rgba(167,139,250,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
            selectedFeature === "lunar-calendar" ? "border-violet-400/70 ring-1 ring-violet-400/40" : "border-violet-300/[0.12]"
          }`}
        >
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl transition-all group-hover:bg-violet-500/20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-950/50 text-violet-200 shadow-inner">
                <Moon className="h-6 w-6" />
              </div>
              {/* 3D Glowing Moon Sphere */}
              <div className="relative flex h-14 w-14 items-center justify-center" aria-hidden="true">
                <div className="absolute inset-0 rounded-full bg-violet-400/25 blur-lg animate-pulse" />
                <div
                  className="relative h-12 w-12 rounded-full shadow-[inset_-8px_-8px_14px_rgba(0,0,0,0.85),inset_4px_4px_10px_rgba(255,255,255,0.4),0_0_20px_rgba(196,181,253,0.5)] transition-transform duration-700 group-hover:scale-110"
                  style={{
                    background: "radial-gradient(circle at 35% 35%, #f5f3ff, #ddd6fe 45%, #8b5cf6 80%, #3b0764 100%)",
                  }}
                >
                  <div className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-violet-950/20" />
                  <div className="absolute right-3 top-5 h-2.5 w-2.5 rounded-full bg-violet-950/25" />
                  <div className="absolute bottom-2.5 left-4 h-3 w-3 rounded-full bg-violet-950/20" />
                </div>
              </div>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-white">
              მთვარის კალენდარი
            </h3>
            {transit ? (
              <>
                <div className="mt-4 rounded-xl border border-violet-300/15 bg-violet-950/25 p-3 text-center">
                  <p className="text-xs font-medium text-violet-200">დღეს მთვარის</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {transit.lunarCalendar.lunarDay} მთვარის დღე
                  </p>
                  {transit.lunarCalendar.phase && (
                    <p className="mt-1 text-xs font-medium text-violet-200">
                      ({transit.lunarCalendar.phase === "new" ? "ახალმთვარეობა" : "სავსემთვარეობა"})
                    </p>
                  )}
                  <p className="mt-1 text-sm text-violet-100">
                    მთვარე იმყოფება{" "}
                    {moon?.signSymbol && (
                      <span className="mx-1 text-violet-200" aria-label="ზოდიაქოს ნიშანი">
                        {moon.signSymbol}
                      </span>
                    )}
                    {" "}
                    {MOON_SIGN_LOCATIVE[
                       moon?.signKa ?? ""
                    ] ?? "—"}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-2">
                    <p className="text-[10px] text-slate-400">ახალი მთვარიდან გასულია</p>
                    <p className="mt-1 text-sm font-semibold text-violet-200">
                      {transit.lunarCalendar.daysSinceNewMoon.toFixed(1)} დღე
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-2">
                    <p className="text-[10px] text-slate-400">სავსე მთვარემდე დარჩა</p>
                    <p className="mt-1 text-sm font-semibold text-violet-200">
                      {transit.lunarCalendar.daysUntilFullMoon.toFixed(1)} დღე
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#070b13]/80 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>
                      {GEORGIAN_MONTHS[transit.lunarCalendar.month - 1]} {transit.lunarCalendar.year}
                    </span>
                    <span className="text-[10px] text-violet-300">რიცხვი · მთვარის დღე</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAYS_KA.map((weekday) => (
                      <span key={weekday} className="pb-1 text-[9px] font-medium text-slate-500">
                        {weekday}
                      </span>
                    ))}
                    {transit.lunarCalendar.days.map((day) => {
                      const isToday = day.date === transit.date;
                      const dayMonth = new Date(`${day.date}T00:00:00Z`).getUTCMonth();
                      return (
                        <div
                          key={day.date}
                          aria-label={`${day.dayOfMonth} ${GEORGIAN_MONTHS[dayMonth]}, მთვარის ${day.lunarDay}-ე დღე`}
                          aria-current={isToday ? "date" : undefined}
                          className={`flex min-h-9 flex-col items-center justify-center rounded-md border text-[10px] leading-tight ${
                            isToday
                              ? "border-violet-300 bg-violet-500/30 font-bold text-white shadow-[0_0_12px_rgba(167,139,250,0.25)]"
                              : day.isCurrentMonth
                                ? "border-transparent text-slate-200"
                                : "border-transparent text-slate-600"
                          }`}
                        >
                          <span>{day.dayOfMonth}</span>
                          <span className={`text-[8px] ${isToday ? "text-violet-100" : "text-slate-500"}`}>
                            {day.lunarDay}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-300">მთვარის კალენდარი იტვირთება…</p>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
