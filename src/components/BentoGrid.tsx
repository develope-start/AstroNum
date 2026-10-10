"use client";

import { Activity, Binary, Compass, Download, Flame, Heart, Layers, Lock, Orbit, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

export default function BentoGrid() {
  return (
    <section id="features" className="relative my-20 w-full scroll-mt-24">
      {/* Background radial aura */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.04] blur-[140px]" />

      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3.5 py-1 text-xs font-medium text-cyan-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>არქიტექტურა & შესაძლებლობები</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          პროფესიონალური ასტროლოგიის <br />
          <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-rose-300 bg-clip-text text-transparent">
            ახალი თაობის სტანდარტი
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
          Swiss Ephemeris-ის მათემატიკური ალგორითმები, მრავალშრიანი სინთეზი და დახვეწილი მუქი ინტერფეისი ერთ ეკოსისტემაში.
        </p>
      </div>

      {/* Bento Grid: 6-card layout */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Large Bento (Span 2 on lg) - Swiss Ephemeris Engine */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_-5px_rgba(56,189,248,0.15)] lg:col-span-2">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl transition-all group-hover:bg-cyan-500/20" />
          
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/40 text-cyan-300 shadow-inner">
                  <Binary className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs font-semibold text-cyan-400/80 bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  0.0001° ACCURACY
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white sm:text-2xl">
                Swiss Ephemeris v2.1 ციური გამოთვლების ბირთვი
              </h3>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-slate-400">
                უმაღლესი სიზუსტის შვეიცარული ეფემერიდი ასტრონომიულ კოორდინატებს ითვლის წამის მეასედების სიზუსტით.
                მხარდაჭერილია პლაციდუსი, კოხი, თანაბარსახლიანი და მთლიანი ნიშნის სისტემები.
              </p>
            </div>

            {/* Visual Interactive Simulation Box */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#070b13]/80 p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  MERCURY · VENUS · MARS · PLUTO
                </span>
                <span className="text-slate-500">J2000.0 / TOPO</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[10px] text-slate-500">მზე (Sun)</span>
                  <p className="text-sm font-semibold text-amber-300 mt-0.5">24° 12' 08" ♈</p>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[10px] text-slate-500">მთვარე (Moon)</span>
                  <p className="text-sm font-semibold text-sky-200 mt-0.5">11° 45' 32" ♋</p>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[10px] text-slate-500">ასცენდენტი (ASC)</span>
                  <p className="text-sm font-semibold text-indigo-300 mt-0.5">04° 18' 54" ♏</p>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.03]">
                  <span className="text-[10px] text-slate-500">მედიუმ ცელი (MC)</span>
                  <p className="text-sm font-semibold text-rose-300 mt-0.5">19° 52' 10" ♌</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 4-Element Temperament Synthesis */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)]">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl transition-all group-hover:bg-amber-500/20" />
          
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-950/40 text-amber-300 shadow-inner">
            <Flame className="h-5 w-5" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            4 სტიქიის ტემპერამენტის სინთეზი
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            ჰიპოკრატესა და კლასიკური ასტროლოგიის ტემპერამენტების (ქოლერიკი, სანგვინიკი, მელანქოლიკი, ფლეგმატიკი) ავტომატური ბალანსირება.
          </p>

          <div className="mt-5 space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>ცეცხლი (Fire) · ქოლერიკი</span>
                <span className="text-amber-400 font-mono font-semibold">35%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500" style={{ width: "35%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>მიწა (Earth) · მელანქოლიკი</span>
                <span className="text-emerald-400 font-mono font-semibold">25%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: "25%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>ჰაერი (Air) · სანგვინიკი</span>
                <span className="text-sky-400 font-mono font-semibold">25%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400" style={{ width: "25%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                <span>წყალი (Water) · ფლეგმატიკი</span>
                <span className="text-cyan-400 font-mono font-semibold">15%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: "15%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Aspect Matrix & Synastry */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-pink-500/30 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.15)]">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl transition-all group-hover:bg-pink-500/20" />
          
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-950/40 text-pink-300 shadow-inner">
            <Heart className="h-5 w-5" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            სინასტრიული ასპექტების მატრიცა
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            ორი რუკის შედარება, ჰარმონიული და დისონანსური ასპექტების წონითი ანალიზი და ურთიერთობის დინამიკის გაშიფვრა.
          </p>

          <div className="mt-5 rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="text-pink-400 font-bold">☉ △ ☽</span> მზე ტრიგონი მთვარე
              </span>
              <span className="text-emerald-400 font-mono font-semibold">+9.2 Orb 1.1°</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-300 border-t border-white/[0.04] pt-2">
              <span className="flex items-center gap-1.5">
                <span className="text-indigo-400 font-bold">♀ ☌ ♂</span> ვენერა შეერთება მარსი
              </span>
              <span className="text-emerald-400 font-mono font-semibold">+8.5 Orb 0.8°</span>
            </div>
          </div>
        </div>

        {/* Card 4: Gemini AI Astrology Intelligence */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-violet-500/30 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl transition-all group-hover:bg-violet-500/20" />
          
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-950/40 text-violet-300 shadow-inner">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            Gemini AI ასტროლოგიური ინტელექტი
          </h3>
          <p className="mt-2 text-sm text-slate-400">
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

        {/* Card 5: Birth Time Rectification Module */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl transition-all group-hover:bg-emerald-500/20" />
          
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-950/40 text-emerald-300 shadow-inner">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="mt-5 font-display text-xl font-bold text-white">
            დაბადების დროის რექტიფიკაცია
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            დაადგინეთ დაბადების ზუსტი წუთი და ასცენდენტის გრადუსი ცხოვრებისეული მოვლენების (ქორწინება, კარიერა, შვილი) Solar Arc სკანირებით.
          </p>

          <div className="mt-5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#070b13]/80 p-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Primary Directions Alg
            </span>
            <span className="text-emerald-400 font-mono text-[11px]">სიზუსტე ±1 წთ</span>
          </div>
        </div>

        {/* Card 6: Large Bento (Span 2 or 3) - Vector & PDF Export */}
        <div className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/30 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.15)] lg:col-span-3">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl transition-all group-hover:bg-indigo-500/20" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-950/40 text-indigo-300 shadow-inner">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white sm:text-2xl">
                პროფესიონალური PDF & SVG ვექტორული ექსპორტი
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                დააგენერირეთ კრისტალურად სუფთა, ბეჭდვისთვის მზა ანგარიშები ქართულ ენაზე. მოიცავს რუკის დისკს, პლანეტარულ ასპექტების ცხრილებს, სტიქიურ ბალანსს და სიღრმისეულ განმარტებებს.
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
