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
  { id: "transit", label: "ტრანზიტები", hint: "დღევანდელი პლანეტების მოძრაობა თქვენს ნატალურ ცასთან", icon: Activity },
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
            <span className="font-display text-sm sm:text-base font-black text-violet-300">12</span>
            <span className="text-[0.65rem] font-bold text-slate-300">სახლი</span>
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
      <section id="calculator" className="scroll-mt-20 sm:scroll-mt-28 space-y-4">
        {/* Prominent Calculator Section Header */}
        <div className="text-center space-y-2 px-2">
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-amber-500/20 px-4 py-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] text-center max-w-full">
            <Compass className="h-4 w-4 text-amber-300 shrink-0" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300 break-words text-center">
              ასტროლოგიური გამოთვლელი
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-black text-white drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]">
            აირჩიეთ გამოთვლის ტიპი
          </h2>
        </div>

        <div className="glass-panel mx-auto mb-4 sm:mb-6 grid grid-cols-3 max-w-xl gap-1 sm:gap-2.5 rounded-2xl sm:rounded-full p-1.5 sm:p-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-amber-500/40 bg-[#120833]/95 backdrop-blur-3xl ring-1 ring-amber-400/30">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-full px-1.5 py-2.5 sm:px-5 sm:py-3.5 text-[0.7rem] sm:text-sm font-black transition-all duration-300 cursor-pointer text-center leading-tight ${
                  active
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-[1.02] ring-1 ring-white/40"
                    : "text-slate-200 hover:text-amber-300 hover:bg-amber-400/15"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${active ? "text-slate-950 stroke-[2.5]" : "text-amber-400"}`} />
                <span className="break-words text-center">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 sm:mb-8 text-center px-2">
          <div className="inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border border-amber-400/40 bg-purple-950/60 px-4 py-2 text-xs font-bold text-amber-200 shadow-[0_0_20px_rgba(168,85,247,0.2)] max-w-full backdrop-blur-xl text-center break-words">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="break-words text-center">{TABS.find((t) => t.id === tab)?.hint}</span>
          </div>
        </div>

        {tab === "natal" && <NatalCalculator />}
        {tab === "synastry" && <SynastryCalculator />}
        {tab === "transit" && <TransitCalculator />}
      </section>

      {/* Bottom Features Grid */}
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
