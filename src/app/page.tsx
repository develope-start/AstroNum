"use client";

import { useState } from "react";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import { Sun, Heart, Activity, Zap, Globe2, ShieldCheck, Stars, Compass, Sparkles } from "lucide-react";

type Tab = "natal" | "synastry" | "transit";

const TABS: { id: Tab; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "natal", label: "ნატალური რუკა", hint: "დაბადების დღის ცის სურათი — თქვენი ფსიქოლოგიური & სულიერი პორტრეტი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი ნატალური რუკის შედარება — ურთიერთობების თავსებადობის ანალიზი", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "დღევანდელი პლანეტების მოძრაობა თქვენს ნატალურ რუკასთან შედარებით", icon: Activity },
];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("natal");

  return (
    <div className="space-y-10 sm:space-y-20">
      {/* 1. Hero Section - Deep Cosmic Black & Ambient Neon Glow */}
      <section className="relative pt-2 text-center sm:pt-6 px-2">
        <div className="mx-auto mb-4 inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/35 bg-gradient-to-r from-amber-500/15 via-purple-500/20 to-amber-500/15 px-4 py-1.5 backdrop-blur-2xl shadow-[0_0_20px_rgba(229,169,59,0.25)] max-w-full text-center">
          <Stars className="h-4 w-4 text-amber-300 animate-pulse shrink-0" />
          <span className="text-[0.7rem] sm:text-xs font-black uppercase tracking-[0.12em] text-amber-300">
            ✦ შვეიცარიული ეფემერიდი & ასტროლოგიური ანალიზი
          </span>
        </div>

        <h1 className="font-display text-2xl font-black text-slate-100 sm:text-4xl lg:text-5xl px-2 leading-tight tracking-tight">
          ასტროლოგიური რუკების{" "}
          <span className="bg-gradient-to-r from-[#E5A93B] via-[#FFD26A] to-[#E5A93B] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(229,169,59,0.55)]">
            პროფესიონალური გამოთვლა
          </span>
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-base leading-relaxed text-slate-300 px-3 font-medium">
          შეიყვანეთ მონაცემები ნატალური, სინასტრიული ან ტრანზიტული ცის რუკის წამებში მისაღებად და გაშიფვრისთვის.
        </p>

        {/* Infographic Quick Stats Bar - Elevated Glassmorphism */}
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 px-1">
          <div className="glass-panel flex items-center justify-center gap-2.5 rounded-2xl p-3 sm:py-3.5 backdrop-blur-2xl">
            <span className="font-display text-base sm:text-lg font-black text-amber-300 text-glow-gold">99.9%</span>
            <span className="text-xs font-bold text-slate-300">სიზუსტე</span>
          </div>

          <div className="glass-panel flex items-center justify-center gap-2.5 rounded-2xl p-3 sm:py-3.5 backdrop-blur-2xl">
            <span className="font-display text-base sm:text-lg font-black text-cyan-300">4</span>
            <span className="text-xs font-bold text-slate-300">სტიქია</span>
          </div>

          <div className="glass-panel flex items-center justify-center gap-2.5 rounded-2xl p-3 sm:py-3.5 backdrop-blur-2xl">
            <span className="font-display text-base sm:text-lg font-black text-amber-300">3</span>
            <span className="text-xs font-bold text-slate-300">რეჟიმი</span>
          </div>

          <div className="glass-panel flex items-center justify-center gap-2.5 rounded-2xl p-3 sm:py-3.5 backdrop-blur-2xl">
            <span className="font-display text-base sm:text-lg font-black text-emerald-300">Auto</span>
            <span className="text-xs font-bold text-slate-300">Timezone</span>
          </div>
        </div>
      </section>

      {/* 2. Main Tabbed Calculator Section */}
      <section id="calculator" className="scroll-mt-20 sm:scroll-mt-28 space-y-8">
        {/* Impressive 12 Zodiac Wheel Hero Graphic Emblem */}
        <div className="mx-auto flex flex-col items-center justify-center pt-2 pb-2 w-full">
          <div className="zodiac-hero group relative flex h-72 w-72 sm:h-96 sm:w-96 md:h-[460px] md:w-[460px] lg:h-[520px] lg:w-[520px] items-center justify-center rounded-full border border-amber-400/40 bg-gradient-to-br from-purple-950/70 via-[#0a061b]/90 to-amber-950/60 shadow-[0_0_70px_rgba(229,169,59,0.35)] backdrop-blur-3xl transition-all hover:scale-[1.02] hover:shadow-[0_0_90px_rgba(229,169,59,0.55)] duration-500">
            <svg viewBox="0 0 380 380" className="zodiac-wheel h-full w-full p-2">
              <defs>
                <radialGradient id="zodiac-hero-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFD26A" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#07050f" stopOpacity="0.95" />
                </radialGradient>
                <filter id="zodiac-hero-gold-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Glow Circle */}
              <circle cx="190" cy="190" r="170" fill="url(#zodiac-hero-glow)" />

              {/* Concentric Ecliptic Rings */}
              <circle cx="190" cy="190" r="168" fill="none" stroke="#FFD26A" strokeWidth="1" opacity="0.3" strokeDasharray="3 3" />
              <circle cx="190" cy="190" r="135" fill="none" stroke="#FFD26A" strokeWidth="1.5" opacity="0.8" filter="url(#zodiac-hero-gold-glow)" />
              <circle cx="190" cy="190" r="133" fill="none" stroke="#A855F7" strokeWidth="1" opacity="0.5" />
              <circle cx="190" cy="190" r="95" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.4" strokeDasharray="4 2" />
              <circle cx="190" cy="190" r="50" fill="none" stroke="#FFD26A" strokeWidth="1" opacity="0.5" />

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
                    stroke="#FFD26A"
                    strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
                    opacity={i % 3 === 0 ? "0.6" : "0.25"}
                  />
                );
              })}

              {/* 12 Zodiac Signs OUTSIDE ring & Ruling Planets INSIDE ring */}
              {[
                { glyph: "♈", ruler: "♂", name: "ვერძი", element: "fire", color: "#FF5252", bgFill: "rgba(255,82,82,0.35)", rulerColor: "#FF5252", deg: 15 },
                { glyph: "♉", ruler: "♀", name: "კურო", element: "earth", color: "#10B981", bgFill: "rgba(16,185,129,0.35)", rulerColor: "#F472B6", deg: 45 },
                { glyph: "♊", ruler: "☿", name: "ტყუპები", element: "air", color: "#FFD26A", bgFill: "rgba(255,210,106,0.35)", rulerColor: "#FFD26A", deg: 75 },
                { glyph: "♋", ruler: "☽", name: "კირჩხიბი", element: "water", color: "#22D3EE", bgFill: "rgba(34,211,238,0.35)", rulerColor: "#F1F5F9", deg: 105 },
                { glyph: "♌", ruler: "☉", name: "ლომი", element: "fire", color: "#FF5252", bgFill: "rgba(255,82,82,0.35)", rulerColor: "#FFD26A", deg: 135 },
                { glyph: "♍", ruler: "☿", name: "ქალწული", element: "earth", color: "#10B981", bgFill: "rgba(16,185,129,0.35)", rulerColor: "#C084FC", deg: 165 },
                { glyph: "♎", ruler: "♀", name: "სასწორი", element: "air", color: "#FFD26A", bgFill: "rgba(255,210,106,0.35)", rulerColor: "#F472B6", deg: 195 },
                { glyph: "♏", ruler: "♇", name: "მორიელი", element: "water", color: "#22D3EE", bgFill: "rgba(34,211,238,0.35)", rulerColor: "#E879F9", deg: 225 },
                { glyph: "♐", ruler: "♃", name: "მშვილდოსანი", element: "fire", color: "#FF5252", bgFill: "rgba(255,82,82,0.35)", rulerColor: "#60A5FA", deg: 255 },
                { glyph: "♑", ruler: "♄", name: "თხის რქა", element: "earth", color: "#10B981", bgFill: "rgba(16,185,129,0.35)", rulerColor: "#F59E0B", deg: 285 },
                { glyph: "♒", ruler: "♅", name: "მერწყული", element: "air", color: "#FFD26A", bgFill: "rgba(255,210,106,0.35)", rulerColor: "#22D3EE", deg: 315 },
                { glyph: "♓", ruler: "♆", name: "თევზები", element: "water", color: "#22D3EE", bgFill: "rgba(34,211,238,0.35)", rulerColor: "#818CF8", deg: 345 },
              ].map((z, idx) => {
                const rad = (z.deg * Math.PI) / 180;
                const signX = 190 + 158 * Math.cos(rad);
                const signY = 190 + 158 * Math.sin(rad);
                const rulerX = 190 + 112 * Math.cos(rad);
                const rulerY = 190 + 112 * Math.sin(rad);

                return (
                  <g key={idx}>
                    <circle
                      cx={signX}
                      cy={signY}
                      r="15"
                      fill={z.bgFill}
                      stroke={z.color}
                      strokeWidth="1.5"
                      style={{ filter: `drop-shadow(0 0 8px ${z.color})` }}
                    />
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

                    <circle
                      cx={rulerX}
                      cy={rulerY}
                      r="10"
                      fill="#07050f"
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

              <circle cx="190" cy="190" r="24" fill="#E5A93B" filter="url(#zodiac-hero-gold-glow)" />
              <polygon points="190,148 199,179 232,190 199,201 190,232 181,201 148,190 181,179" fill="#FFD26A" />
              <polygon points="190,158 196,182 220,190 196,198 190,220 184,198 160,190 184,182" fill="#FFF" />
              <circle cx="190" cy="190" r="8" fill="#FFF" />
            </svg>

            <div className="absolute inset-0 rounded-full border border-cyan-400/40 shadow-[0_0_45px_rgba(34,211,238,0.35)] pointer-events-none" />
          </div>

          {/* Element Cards with Sleek Neon Glows */}
          <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 max-w-3xl sm:max-w-4xl mx-auto gap-3 sm:gap-4 w-full px-2">
            {/* Fire */}
            <div className="glass-panel group flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/50 p-4 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:border-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.5)] cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_#EF4444]" />
                <span className="text-sm font-black text-red-400">🔥 ცეცხლი</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xl font-black text-red-200 tracking-widest">
                <span>♈</span><span>♌</span><span>♐</span>
              </div>
            </div>

            {/* Earth */}
            <div className="glass-panel group flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-500/50 p-4 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400 hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_12px_#10B981]" />
                <span className="text-sm font-black text-emerald-400">🏔️ მიწა</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xl font-black text-emerald-200 tracking-widest">
                <span>♉</span><span>♍</span><span>♑</span>
              </div>
            </div>

            {/* Air */}
            <div className="glass-panel group flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-400/50 p-4 text-amber-200 shadow-[0_0_20px_rgba(255,210,106,0.2)] hover:border-amber-300 hover:shadow-[0_0_35px_rgba(255,210,106,0.5)] cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_12px_#FFD26A]" />
                <span className="text-sm font-black text-amber-300">💨 ჰაერი</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xl font-black text-amber-100 tracking-widest">
                <span>♊</span><span>♎</span><span>♒</span>
              </div>
            </div>

            {/* Water */}
            <div className="glass-panel group flex flex-col items-center justify-center gap-2 rounded-2xl border border-cyan-500/50 p-4 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:border-cyan-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.5)] cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22D3EE]" />
                <span className="text-sm font-black text-cyan-300">💧 წყალი</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-xl font-black text-cyan-100 tracking-widest">
                <span>♋</span><span>♏</span><span>♓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2 px-2">
          <h2 className="font-display text-2xl sm:text-4xl font-black text-white drop-shadow-[0_0_25px_rgba(229,169,59,0.35)]">
            აირჩიეთ გამოთვლის ტიპი
          </h2>
        </div>

        {/* Tab Selection Bar */}
        <div className="glass-panel mx-auto mb-4 sm:mb-6 grid grid-cols-3 max-w-xl lg:max-w-2xl gap-2 rounded-2xl sm:rounded-full p-2 shadow-[0_20px_60px_rgba(0,0,0,0.85)] border-amber-400/35 bg-[#0f0b22]/90 backdrop-blur-3xl">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-3 py-3 font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer ${
                  active
                    ? "btn-gold scale-[1.03]"
                    : "text-slate-200 hover:text-amber-300 hover:bg-amber-400/10"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#07050f] stroke-[2.5]" : "text-amber-400"}`} />
                <span className="break-words text-center">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 sm:mb-8 text-center px-2">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/35 bg-purple-950/50 px-5 py-2 text-xs sm:text-sm font-bold text-amber-200 shadow-[0_0_20px_rgba(168,85,247,0.2)] max-w-full backdrop-blur-xl text-center break-words">
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0 animate-pulse" />
            <span className="break-words text-center">{TABS.find((t) => t.id === tab)?.hint}</span>
          </div>
        </div>

        {tab === "natal" && <NatalCalculator />}
        {tab === "synastry" && <SynastryCalculator />}
        {tab === "transit" && <TransitCalculator />}
      </section>

      {/* Bottom Features Grid */}
      <section className="grid gap-4 sm:gap-6 border-t border-amber-500/20 pt-8 sm:pt-12 text-sm sm:grid-cols-3">
        <div className="glass-panel group rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_rgba(229,169,59,0.3)] group-hover:scale-110 transition-transform">
            <Zap className="h-6 w-6 text-amber-300" />
          </div>
          <h3 className="mb-2 font-display text-lg sm:text-xl font-black text-amber-300">ზუსტი ეფემერიდი</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            პლანეტების პოზიციები ითვლება შვეიცარიული ეფემერიდის სიზუსტით, საათობრივი ცდომილების გამორიცხვით.
          </p>
        </div>

        <div className="glass-panel group rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_rgba(229,169,59,0.3)] group-hover:scale-110 transition-transform">
            <Globe2 className="h-6 w-6 text-amber-300" />
          </div>
          <h3 className="mb-2 font-display text-lg sm:text-xl font-black text-amber-300">ისტორიული დროის ზონები</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            დაბადების ადგილიდან ავტომატურად იანგარიშება იმწუთიერი ისტორიული დროის ზონა და ზაფხულის დროც (DST).
          </p>
        </div>

        <div className="glass-panel group rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_rgba(229,169,59,0.3)] group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-6 w-6 text-amber-300" />
          </div>
          <h3 className="mb-2 font-display text-lg sm:text-xl font-black text-amber-300">პირადი კაბინეტი</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            რეგისტრირებულ მომხმარებელს რუკები უვადოდ ინახება კაბინეტში. სტუმარს — 12 საათით ამ მოწყობილობაზე.
          </p>
        </div>
      </section>
    </div>
  );
}
