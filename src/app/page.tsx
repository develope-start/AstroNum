"use client";

import { useState } from "react";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import { Sparkles, Sun, Heart, Activity, Zap, Globe2, ShieldCheck, Stars, Compass, CheckCircle2 } from "lucide-react";

type Tab = "natal" | "synastry" | "transit";

const TABS: { id: Tab; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "natal", label: "ნატალური რუკა", hint: "დაბადების ცის სურათი — თქვენი ფსიქოლოგიური & სულიერი პორტრეტი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი ნატალური რუკის შედარება — ურთიერთობების თავსებადობა", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "დღევანდელი პლანეტების მოძრაობა თქვენს ნატალურ ცასთან", icon: Activity },
];

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("natal");

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section - Compact & Aesthetic */}
      <section className="relative pt-2 text-center sm:pt-4">
        <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-purple-500/15 to-amber-500/10 px-4 py-1 backdrop-blur-xl shadow-sm">
          <Stars className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-300">
            ✦ შვეიცარიული ეფემერიდი & ასტროლოგიური ანალიზი
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-slate-100 sm:text-3xl">
          ასტროლოგიური რუკების{" "}
          <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            პროფესიონალური გამოთვლა
          </span>
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300">
          შეიყვანეთ მონაცემები ნატალური, სინასტრიული ან ტრანზიტული ცის რუკის წამებში მისაღებად.
        </p>

        {/* Infographic Quick Stats Bar - Compact */}
        <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-3 py-2 backdrop-blur-xl">
            <span className="font-display text-base font-black text-amber-300">99.9%</span>
            <span className="text-[0.65rem] font-bold text-slate-300">სიზუსტე</span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-3 py-2 backdrop-blur-xl">
            <span className="font-display text-base font-black text-violet-300">12</span>
            <span className="text-[0.65rem] font-bold text-slate-300">სახლები</span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-3 py-2 backdrop-blur-xl">
            <span className="font-display text-base font-black text-amber-300">3</span>
            <span className="text-[0.65rem] font-bold text-slate-300">რეჟიმი</span>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/20 bg-gradient-to-b from-[#130a35]/70 to-[#09041a]/90 px-3 py-2 backdrop-blur-xl">
            <span className="font-display text-base font-black text-emerald-300">Auto</span>
            <span className="text-[0.65rem] font-bold text-slate-300">Timezone</span>
          </div>
        </div>
      </section>

      {/* Main Tabbed Calculator Section */}
      <section id="calculator" className="scroll-mt-24">
        <div className="glass-panel mx-auto mb-6 flex max-w-xl flex-wrap justify-center gap-2 rounded-full p-2 shadow-2xl border-amber-500/30 bg-[#120833]/90">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-3 text-xs sm:text-sm font-bold transition-all duration-300 ${
                  active
                    ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)] scale-105"
                    : "text-slate-300 hover:text-amber-300 hover:bg-amber-400/10"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-slate-950" : "text-amber-400"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span>{TABS.find((t) => t.id === tab)?.hint}</span>
          </span>
        </div>

        {tab === "natal" && <NatalCalculator />}
        {tab === "synastry" && <SynastryCalculator />}
        {tab === "transit" && <TransitCalculator />}
      </section>

      {/* Bottom Features Grid */}
      <section className="grid gap-6 border-t border-amber-500/25 pt-12 text-sm sm:grid-cols-3">
        <div className="glass-panel group rounded-[28px] p-7 transition-all hover:-translate-y-1.5 hover:border-amber-400/50 shadow-xl bg-gradient-to-b from-[#120833]/85 to-[#080418]/90">
          <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <Zap className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold text-amber-300">ზუსტი ეფემერიდი</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            პლანეტების პოზიციები ითვლება შვეიცარიული ეფემერიდის სიზუსტით, საათობრივი ცდომილების გამორიცხვით.
          </p>
        </div>

        <div className="glass-panel group rounded-[28px] p-7 transition-all hover:-translate-y-1.5 hover:border-amber-400/50 shadow-xl bg-gradient-to-b from-[#120833]/85 to-[#080418]/90">
          <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <Globe2 className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold text-amber-300">ისტორიული დროის ზონები</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            დაბადების ადგილიდან ავტომატურად იანგარიშება იმწუთიერი ისტორიული დროის ზონა და ზაფხულის დროც (DST).
          </p>
        </div>

        <div className="glass-panel group rounded-[28px] p-7 transition-all hover:-translate-y-1.5 hover:border-amber-400/50 shadow-xl bg-gradient-to-b from-[#120833]/85 to-[#080418]/90">
          <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-6 w-6 text-amber-400" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold text-amber-300">პირადი კაბინეტი</h3>
          <p className="text-xs leading-relaxed text-slate-300">
            რეგისტრირებულ მომხმარებელს რუკები უვადოდ ინახება კაბინეტში. სტუმარს — 12 საათით ამ მოწყობილობაზე.
          </p>
        </div>
      </section>
    </div>
  );
}



