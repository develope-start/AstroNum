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
            <svg viewBox="0 0 340 340" className="h-full w-full p-2">
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
              <circle cx="170" cy="170" r="150" fill="url(#zodiac-center-glow)" />

              {/* Concentric Ecliptic Rings */}
              <circle cx="170" cy="170" r="148" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
              <circle cx="170" cy="170" r="120" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.7" filter="url(#zodiac-gold-glow)" />
              <circle cx="170" cy="170" r="118" fill="none" stroke="#A855F7" strokeWidth="1" opacity="0.5" />
              <circle cx="170" cy="170" r="80" fill="none" stroke="#38BDF8" strokeWidth="1" opacity="0.4" strokeDasharray="4 2" />
              <circle cx="170" cy="170" r="45" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />

              {/* 12 House Spokes */}
              {Array.from({ length: 12 }).map((_, i) => {
                const rad = (i * 30 * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={170 + 45 * Math.cos(rad)}
                    y1={170 + 45 * Math.sin(rad)}
                    x2={170 + 120 * Math.cos(rad)}
                    y2={170 + 120 * Math.sin(rad)}
                    stroke="#F59E0B"
                    strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
                    opacity={i % 3 === 0 ? "0.6" : "0.3"}
                  />
                );
              })}

              {/* 12 Zodiac Signs OUTSIDE the ring & Ruling Planets INSIDE the ring */}
              {[
                { glyph: "♈", ruler: "♂", name: "ვერძი", element: "fire", color: "#FF4500", rulerColor: "#EF4444", deg: 15 },
                { glyph: "♉", ruler: "♀", name: "კურო", element: "earth", color: "#10B981", rulerColor: "#EC4899", deg: 45 },
                { glyph: "♊", ruler: "☿", name: "ტყუპები", element: "air", color: "#F59E0B", rulerColor: "#FBBF24", deg: 75 },
                { glyph: "♋", ruler: "☽", name: "კირჩხიბი", element: "water", color: "#06B6D4", rulerColor: "#E2E8F0", deg: 105 },
                { glyph: "♌", ruler: "☉", name: "ლომი", element: "fire", color: "#EF4444", rulerColor: "#F59E0B", deg: 135 },
                { glyph: "♍", ruler: "☿", name: "ქალწული", element: "earth", color: "#10B981", rulerColor: "#34D399", deg: 165 },
                { glyph: "♎", ruler: "♀", name: "სასწორი", element: "air", color: "#F59E0B", rulerColor: "#EC4899", deg: 195 },
                { glyph: "♏", ruler: "♇", name: "მორიელი", element: "water", color: "#06B6D4", rulerColor: "#8B5CF6", deg: 225 },
                { glyph: "♐", ruler: "♃", name: "მშვილდოსანი", element: "fire", color: "#FF4500", rulerColor: "#38BDF8", deg: 255 },
                { glyph: "♑", ruler: "♄", name: "თხის რქა", element: "earth", color: "#059669", rulerColor: "#C084FC", deg: 285 },
                { glyph: "♒", ruler: "♅", name: "მერწყული", element: "air", color: "#FDE047", rulerColor: "#06B6D4", deg: 315 },
                { glyph: "♓", ruler: "♆", name: "თევზები", element: "water", color: "#38BDF8", rulerColor: "#60A5FA", deg: 345 },
              ].map((z, idx) => {
                const rad = (z.deg * Math.PI) / 180;
                
                // Position of Zodiac Sign OUTSIDE the ring (r = 138)
                const signX = 170 + 138 * Math.cos(rad);
                const signY = 170 + 138 * Math.sin(rad);

                // Position of Ruling Planet INSIDE the ring (r = 98)
                const rulerX = 170 + 98 * Math.cos(rad);
                const rulerY = 170 + 98 * Math.sin(rad);

                return (
                  <g key={idx}>
                    {/* Zodiac Symbol (Outside Ring, Colored by Element) */}
                    <text
                      x={signX}
                      y={signY + 6}
                      textAnchor="middle"
                      fill={z.color}
                      fontSize="20"
                      fontWeight="900"
                      className="font-extrabold select-none"
                      style={{ textShadow: `0 0 14px ${z.color}aa` }}
                    >
                      {z.glyph}
                    </text>

                    {/* Ruling Planet (Inside Ring, Directly Under Zodiac Sign) */}
                    <text
                      x={rulerX}
                      y={rulerY + 4}
                      textAnchor="middle"
                      fill={z.rulerColor}
                      fontSize="14"
                      fontWeight="bold"
                      className="select-none"
                      style={{ textShadow: `0 0 10px ${z.rulerColor}bb` }}
                    >
                      {z.ruler}
                    </text>
                  </g>
                );
              })}

              {/* Central Cosmic Sun Ember */}
              <circle cx="170" cy="170" r="22" fill="#F59E0B" filter="url(#zodiac-gold-glow)" />
              <polygon points="170,132 178,160 208,170 178,180 170,208 162,180 132,170 162,160" fill="#FDE68A" />
              <polygon points="170,142 175,163 198,170 175,177 170,198 165,177 142,170 165,163" fill="#FFF" />
              <circle cx="170" cy="170" r="7" fill="#FFF" />
            </svg>

            {/* Glowing Aqua Cyan Accent Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.45)] pointer-events-none" />
          </div>

          {/* Element Colors Infographic Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-bold px-2">
            <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/40 px-3.5 py-1 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF4500]" />
              <span>ცეცხლი: ♈ ♌ ♐</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
              <span>მიწა: ♉ ♍ ♑</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3.5 py-1 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              <span>ჰაერი: ♊ ♎ ♒</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-950/40 px-3.5 py-1 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#06B6D4]" />
              <span>წყალი: ♋ ♏ ♓</span>
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
