"use client";

import { useState } from "react";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import { Sparkles, Sun, Heart, Activity, Zap, Globe2, ShieldCheck, Stars, Compass, CheckCircle2 } from "lucide-react";

type Tab = "natal" | "synastry" | "transit";

const TABS: { id: Tab; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "natal", label: "ნატალური რუკა", hint: "დაბადების დღის სურათი — თქვენი ფსიქოლოგიური & სულიერი პორტრეტი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი ნატალური რუკის შედარება — ურთიერთობების თავსებადობა", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "დღევანდელი პლანეტების მოძრაობა თქვენს ნატალურ რუკასთან", icon: Activity },
];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("natal");

  return (
    <div className="space-y-8 sm:space-y-16">
      {/* Hero Section - Compact & Symmetrically Responsive */}
      <section className="relative pt-1 text-center sm:pt-4 px-2">
        <div className="mx-auto mb-3 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-purple-500/15 to-amber-500/10 px-3.5 py-1.5 backdrop-blur-xl shadow-sm max-w-full text-center">
          <Stars className="h-3.5 w-3.5 text-amber-300 animate-pulse shrink-0" />
          <span className="text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-[0.08em] sm:tracking-[0.15em] text-amber-300 text-center break-words leading-normal">
            ✦ შვეიცარიული ეფემერიდი & ასტროლოგიური ანალიზი
          </span>
        </div>

        <h1 className="font-display text-xl font-bold text-slate-100 sm:text-3xl px-2 leading-snug">
          ასტროლოგიური რუკების{" "}
          <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            პროფესიონალური გამოთვლა
          </span>
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300 px-3">
          შეიყვანეთ მონაცემები ნატალური, სინასტრიული ან ტრანზიტული ცის რუკის წამებში მისაღებად.
        </p>

        {/* Infographic Quick Stats Bar - Compact & Centered */}
        <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-4 px-1">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-2.5 py-2 backdrop-blur-xl">
            <span className="font-display text-sm sm:text-base font-black text-amber-300">99.9%</span>
            <span className="text-[0.65rem] font-bold text-slate-300">სიზუსტე</span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-2.5 py-2 backdrop-blur-xl">
            <span className="font-display text-sm sm:text-base font-black text-violet-300">4</span>
            <span className="text-[0.65rem] font-bold text-slate-300">სტიქია</span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-2.5 py-2 backdrop-blur-xl">
            <span className="font-display text-sm sm:text-base font-black text-amber-300">3</span>
            <span className="text-[0.65rem] font-bold text-slate-300">რეჟიმი</span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-2.5 py-2 backdrop-blur-xl">
            <span className="font-display text-sm sm:text-base font-black text-emerald-300">Auto</span>
            <span className="text-[0.65rem] font-bold text-slate-300">Timezone</span>
          </div>
        </div>
      </section>

      {/* Main Tabbed Calculator Section */}
      <section id="calculator" className="scroll-mt-20 sm:scroll-mt-28 space-y-6">
        {/* Impressive 12 Zodiac Wheel Hero Graphic Emblem */}
        <div className="mx-auto flex flex-col items-center justify-center pt-2 pb-2 w-full">
          <div className="group relative flex h-72 w-72 sm:h-96 sm:w-96 md:h-[460px] md:w-[460px] lg:h-[520px] lg:w-[520px] items-center justify-center rounded-full border-2 border-amber-400/50 bg-gradient-to-br from-purple-950/90 via-[#0a0422]/95 to-amber-950/80 shadow-[0_0_60px_rgba(245,158,11,0.45)] backdrop-blur-3xl transition-all hover:scale-[1.02] hover:shadow-[0_0_80px_rgba(245,158,11,0.65)] duration-500">
            <svg viewBox="0 0 380 380" className="h-full w-full p-2">
              <defs>
                <radialGradient id="zodiac-center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#080416" stopOpacity="0.95" />
                </radialGradient>
                <filter id="zodiac-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Glow Circle */}
              <circle cx="190" cy="190" r="170" fill="url(#zodiac-center-glow)" />

              {/* Concentric Ecliptic Rings */}
              <circle cx="190" cy="190" r="168" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
              <circle cx="190" cy="190" r="135" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.8" filter="url(#zodiac-gold-glow)" />
              <circle cx="190" cy="190" r="133" fill="none" stroke="#A855F7" strokeWidth="1" opacity="0.5" />
              <circle cx="190" cy="190" r="95" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.4" strokeDasharray="4 2" />
              <circle cx="190" cy="190" r="50" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />

              {/* 12 House Spokes */}
              {Array.from({ length: 12 }).map((_, i) => {
                const rad = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={190 + 50 * Math.cos(rad)}
                    y1={190 + 50 * Math.sin(rad)}
                    x2={190 + 135 * Math.cos(rad)}
                    y2={190 + 135 * Math.sin(rad)}
                    stroke="#F59E0B"
                    strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
                    opacity={i % 3 === 0 ? "0.6" : "0.3"}
                  />
                );
              })}

              {/* 12 Zodiac Signs OUTSIDE the ring & Ruling Planets INSIDE the ring */}
              {[
                { glyph: "♈", ruler: "♂", name: "ვერძი", element: "fire", color: "#FF5722", bgFill: "rgba(255,87,34,0.35)", rulerColor: "#EF4444", deg: 15 },
                { glyph: "♉", ruler: "♀", name: "კურო", element: "earth", color: "#10B981", bgFill: "rgba(16,185,129,0.35)", rulerColor: "#EC4899", deg: 45 },
                { glyph: "♊", ruler: "☿", name: "ტყუპები", element: "air", color: "#FBBF24", bgFill: "rgba(251,191,36,0.35)", rulerColor: "#F59E0B", deg: 75 },
                { glyph: "♋", ruler: "☽", name: "კირჩხიბი", element: "water", color: "#00E5FF", bgFill: "rgba(0,229,255,0.35)", rulerColor: "#E2E8F0", deg: 105 },
                { glyph: "♌", ruler: "☉", name: "ლომი", element: "fire", color: "#FF5722", bgFill: "rgba(255,87,34,0.35)", rulerColor: "#F59E0B", deg: 135 },
                { glyph: "♍", ruler: "☿", name: "ქალწული", element: "earth", color: "#10B981", bgFill: "rgba(16,185,129,0.35)", rulerColor: "#34D399", deg: 165 },
                { glyph: "♎", ruler: "♀", name: "სასწორი", element: "air", color: "#FBBF24", bgFill: "rgba(251,191,36,0.35)", rulerColor: "#EC4899", deg: 195 },
                { glyph: "♏", ruler: "♇", name: "მორიელი", element: "water", color: "#00E5FF", bgFill: "rgba(0,229,255,0.35)", rulerColor: "#A855F7", deg: 225 },
                { glyph: "♐", ruler: "♃", name: "მშვილდოსანი", element: "fire", color: "#FF5722", bgFill: "rgba(255,87,34,0.35)", rulerColor: "#38BDF8", deg: 255 },
                { glyph: "♑", ruler: "♄", name: "თხის რქა", element: "earth", color: "#10B981", bgFill: "rgba(16,185,129,0.35)", rulerColor: "#C084FC", deg: 285 },
                { glyph: "♒", ruler: "♅", name: "მერწყული", element: "air", color: "#FBBF24", bgFill: "rgba(251,191,36,0.35)", rulerColor: "#06B6D4", deg: 315 },
                { glyph: "♓", ruler: "♆", name: "თევზები", element: "water", color: "#00E5FF", bgFill: "rgba(0,229,255,0.35)", rulerColor: "#60A5FA", deg: 345 },
              ].map((z, idx) => {
                const rad = (z.deg * Math.PI) / 180;
                
                // Position of Zodiac Sign OUTSIDE the ring (r = 158)
                const signX = 190 + 158 * Math.cos(rad);
                const signY = 190 + 158 * Math.sin(rad);

                // Position of Ruling Planet INSIDE the ring (r = 112)
                const rulerX = 190 + 112 * Math.cos(rad);
                const rulerY = 190 + 112 * Math.sin(rad);

                return (
                  <g key={idx}>
                    {/* Glowing Element Orb Background Circle */}
                    <circle
                      cx={signX}
                      cy={signY}
                      r="15"
                      fill={z.bgFill}
                      stroke={z.color}
                      strokeWidth="2"
                      style={{ filter: `drop-shadow(0 0 8px ${z.color})` }}
                    />

                    {/* Zodiac Symbol (Outside Ring, Colored by Element) */}
                    <text
                      x={signX}
                      y={signY + 5}
                      textAnchor="middle"
                      fill={z.color}
                      fontSize="17"
                      fontWeight="900"
                      className="font-extrabold select-none"
                      style={{ textShadow: `0 0 10px ${z.color}` }}
                    >
                      {z.glyph}
                    </text>

                    {/* Ruling Planet Orb & Glyph Inside Ring */}
                    <circle
                      cx={rulerX}
                      cy={rulerY}
                      r="10"
                      fill="#0a041f"
                      stroke={z.rulerColor}
                      strokeWidth="1.2"
                      opacity="0.9"
                      style={{ filter: `drop-shadow(0 0 6px ${z.rulerColor}99)` }}
                    />
                    <text
                      x={rulerX}
                      y={rulerY + 4}
                      textAnchor="middle"
                      fill={z.rulerColor}
                      fontSize="12"
                      fontWeight="bold"
                      className="select-none"
                    >
                      {z.ruler}
                    </text>
                  </g>
                );
              })}

              {/* Central Cosmic Sun Ember */}
              <circle cx="190" cy="190" r="24" fill="#F59E0B" filter="url(#zodiac-gold-glow)" />
              <polygon points="190,148 199,179 232,190 199,201 190,232 181,201 148,190 181,179" fill="#FDE68A" />
              <polygon points="190,158 196,182 220,190 196,198 190,220 184,198 160,190 184,182" fill="#FFF" />
              <circle cx="190" cy="190" r="8" fill="#FFF" />
            </svg>

            {/* Glowing Aqua Cyan Accent Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.45)] pointer-events-none" />
          </div>

          {/* Element Colors Infographic Legend */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 max-w-3xl sm:max-w-4xl mx-auto gap-3 sm:gap-4 w-full px-2">
            {/* Fire Card */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-orange-500/50 bg-gradient-to-br from-rose-950/80 via-red-950/50 to-orange-950/80 p-3 sm:p-4 text-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5722] shadow-[0_0_10px_#FF5722]" />
                <span className="text-sm sm:text-base font-black tracking-wide text-orange-300">🔥 ცეცხლი</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-orange-100 tracking-widest drop-shadow">♈  ♌  ♐</span>
            </div>

            {/* Earth Card */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-emerald-500/50 bg-gradient-to-br from-emerald-950/80 via-teal-950/50 to-green-950/80 p-3 sm:p-4 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981]" />
                <span className="text-sm sm:text-base font-black tracking-wide text-emerald-300">🏔️ მიწა</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-emerald-100 tracking-widest drop-shadow">♉  ♍  ♑</span>
            </div>

            {/* Air Card */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-950/80 via-yellow-950/50 to-amber-900/80 p-3 sm:p-4 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FBBF24] shadow-[0_0_10px_#FBBF24]" />
                <span className="text-sm sm:text-base font-black tracking-wide text-amber-300">💨 ჰაერი</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-amber-100 tracking-widest drop-shadow">♊  ♎  ♒</span>
            </div>

            {/* Water Card */}
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-cyan-500/50 bg-gradient-to-br from-cyan-950/80 via-sky-950/50 to-blue-950/80 p-3 sm:p-4 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
                <span className="text-sm sm:text-base font-black tracking-wide text-cyan-300">💧 წყალი</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-cyan-100 tracking-widest drop-shadow">♋  ♏  ♓</span>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2 px-2">
          <h2 className="font-display text-2xl sm:text-4xl font-black text-white drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            აირჩიეთ გამოთვლის ტიპი
          </h2>
        </div>

        <div className="glass-panel mx-auto mb-4 sm:mb-6 grid grid-cols-3 max-w-xl lg:max-w-2xl gap-1.5 sm:gap-3 rounded-2xl sm:rounded-full p-2 sm:p-3 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-amber-500/40 bg-[#120833]/95 backdrop-blur-3xl ring-1 ring-amber-400/30">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1 sm:gap-2.5 rounded-xl sm:rounded-full px-2 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black transition-all duration-300 cursor-pointer text-center leading-tight ${
                  active
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-[1.03] ring-1 ring-white/40"
                    : "text-slate-200 hover:text-amber-300 hover:bg-amber-400/15"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-slate-950 stroke-[2.5]" : "text-amber-400"}`} />
                <span className="break-words text-center">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 sm:mb-8 text-center px-2">
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border border-amber-400/40 bg-purple-950/60 px-5 py-2 text-xs sm:text-sm font-bold text-amber-200 shadow-[0_0_20px_rgba(168,85,247,0.2)] max-w-full backdrop-blur-xl text-center break-words">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="break-words text-center">{TABS.find((t) => t.id === tab)?.hint}</span>
          </div>
        </div>

        {tab === "natal" && <NatalCalculator />}
        {tab === "synastry" && <SynastryCalculator />}
        {tab === "transit" && <TransitCalculator />}
      </section>

      {/* Bottom Features Grid - Enhanced Desktop & Mobile UI */}
      <section className="grid gap-4 sm:gap-6 border-t border-amber-500/25 pt-8 sm:pt-12 text-sm sm:grid-cols-3">
        <div className="glass-panel group rounded-2xl sm:rounded-[28px] p-5 sm:p-7 transition-all hover:-translate-y-1.5 hover:border-amber-400/50 shadow-xl bg-gradient-to-b from-[#120833]/85 to-[#080418]/90">
          <div className="mb-4 sm:mb-5 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
          </div>
          <h3 className="mb-2 font-display text-lg sm:text-xl font-bold text-amber-300">ზუსტი ეფემერიდი</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            პლანეტების პოზიციები ითვლება შვეიცარიული ეფემერიდის სიზუსტით, საათობრივი ცდომილების გამორიცხვით.
          </p>
        </div>

        <div className="glass-panel group rounded-2xl sm:rounded-[28px] p-5 sm:p-7 transition-all hover:-translate-y-1.5 hover:border-amber-400/50 shadow-xl bg-gradient-to-b from-[#120833]/85 to-[#080418]/90">
          <div className="mb-4 sm:mb-5 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <Globe2 className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
          </div>
          <h3 className="mb-2 font-display text-lg sm:text-xl font-bold text-amber-300">ისტორიული დროის ზონები</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            დაბადების ადგილიდან ავტომატურად იანგარიშება იმწუთიერი ისტორიული დროის ზონა და ზაფხულის დროც (DST).
          </p>
        </div>

        <div className="glass-panel group rounded-2xl sm:rounded-[28px] p-5 sm:p-7 transition-all hover:-translate-y-1.5 hover:border-amber-400/50 shadow-xl bg-gradient-to-b from-[#120833]/85 to-[#080418]/90">
          <div className="mb-4 sm:mb-5 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
          </div>
          <h3 className="mb-2 font-display text-lg sm:text-xl font-bold text-amber-300">პირადი კაბინეტი</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            რეგისტრირებულ მომხმარებელს რუკები უვადოდ ინახება კაბინეტში. სტუმარს — 12 საათით ამ მოწყობილობაზე.
          </p>
        </div>
      </section>
    </div>
  );
}
