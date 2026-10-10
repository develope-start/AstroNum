"use client";

import { useState } from "react";
import { Check, Compass, Sparkles, Zap } from "lucide-react";

export default function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <section id="pricing" className="relative my-24 w-full scroll-mt-24">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.04] blur-[150px]" />

      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-950/30 px-3.5 py-1 text-xs font-medium text-violet-300 backdrop-blur-md">
          <Zap className="h-3.5 w-3.5" />
          <span>გამჭვირვალე პირობები</span>
        </div>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          აირჩიეთ თქვენი <br />
          <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
            შესაძლებლობების დონე
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
          საბაზისო გამოთვლები ყოველთვის ხელმისაწვდომია უფასოდ. გაფართოებული ხელსაწყოები პროფესიონალი ასტროლოგებისთვის.
        </p>

        {/* Monthly / Yearly Switcher */}
        <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-[#070b13]/80 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              billingCycle === "monthly"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            თვიური
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all ${
              billingCycle === "yearly"
                ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>წლიური</span>
            <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] text-cyan-300">
              -25% ფასდაკლება
            </span>
          </button>
        </div>
      </div>

      {/* 3-Tier Cards Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-8 items-stretch">
        {/* Tier 1: Starter / Free */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c101a]/70 p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-white/20">
          <div>
            <h3 className="font-display text-lg font-bold text-white">საბაზისო (Starter)</h3>
            <p className="mt-1 text-xs text-slate-400">დამწყებთათვის და პირადი ინტერესისთვის</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-white">0 ₾</span>
              <span className="text-xs text-slate-400">/ მუდმივად</span>
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>ნატალური რუკის ულიმიტო გამოთვლა</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>10 ძირითადი პლანეტა და ასცენდენტი</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>ძირითადი მაჟორული ასპექტები</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>4 სტიქიის საბაზისო მიმოხილვა</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600 ml-1.5 mr-1" />
                <span>სინასტრია და ტრანზიტები შეზღუდულია</span>
              </li>
            </ul>
          </div>

          <a
            href="#calculator"
            className="mt-8 block w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-xs font-semibold text-white transition-all hover:bg-white/10"
          >
            დაიწყეთ უფასოდ
          </a>
        </div>

        {/* Tier 2: Pro Practitioner - HIGHLIGHTED WITH GLOW BORDER */}
        <div className="relative flex flex-col justify-between rounded-2xl border-2 border-indigo-500/80 bg-gradient-to-b from-[#131b2e]/90 to-[#0c101a]/95 p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] md:-translate-y-2">
          {/* Popular Tag */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="h-3 w-3" /> ყველაზე პოპულარული
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-white">პროფესიონალი (Pro)</h3>
                <p className="mt-1 text-xs text-indigo-300">პრაქტიკოსი ასტროლოგებისთვის</p>
              </div>
              <span className="rounded-lg bg-indigo-500/10 px-2 py-1 text-[10px] font-mono font-semibold text-indigo-300 border border-indigo-500/20">
                PRO
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-white">
                {billingCycle === "yearly" ? "24 ₾" : "29 ₾"}
              </span>
              <span className="text-xs text-slate-400">/ თვეში</span>
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-slate-200">
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>სრული Swiss Ephemeris v2.1 სიზუსტე</span>
              </li>
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>სინასტრია (თავსებადობა) და ორბების მორგება</span>
              </li>
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>დროის ტრანზიტები და ასპექტების კალენდარი</span>
              </li>
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>4 სტიქიის ტემპერამენტის სრული სინთეზი</span>
              </li>
              <li className="flex items-center gap-2.5 font-medium">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>რუკების შენახვა კაბინეტში და PDF ექსპორტი</span>
              </li>
            </ul>
          </div>

          <a
            href="#calculator"
            className="mt-8 block w-full rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3 text-center text-xs font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-102 hover:shadow-indigo-500/40"
          >
            გააქტიურეთ Pro რეჟიმი
          </a>
        </div>

        {/* Tier 3: Studio / Lifetime */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c101a]/70 p-7 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-white/20">
          <div>
            <h3 className="font-display text-lg font-bold text-white">სტუდია & ოსტატი (Studio)</h3>
            <p className="mt-1 text-xs text-slate-400">სააგენტოებისა და კვლევითი ცენტრებისთვის</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-4xl font-extrabold text-white">
                {billingCycle === "yearly" ? "59 ₾" : "69 ₾"}
              </span>
              <span className="text-xs text-slate-400">/ თვეში</span>
            </div>

            <ul className="mt-8 space-y-3.5 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>ყველა Pro ფუნქციონალი შეუზღუდავად</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Secondary Progressions & Solar Arc</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>დაბნელებები, ჰარმონიკები და ფიქსირებული ვარსკვლავები</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>შეუზღუდავი არქივი და პრიორიტეტული დამუშავება</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>API წვდომა და ვექტორული SVG ექსპორტი</span>
              </li>
            </ul>
          </div>

          <a
            href="#calculator"
            className="mt-8 block w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 text-center text-xs font-semibold text-white transition-all hover:bg-white/10"
          >
            სტუდიის არჩევა
          </a>
        </div>
      </div>
    </section>
  );
}
