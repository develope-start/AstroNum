"use client";

import { ArrowRight, Compass, Lock, ShieldCheck, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative my-24 w-full">
      {/* Background ambient aurora bloom */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[380px] w-[750px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-500/20 via-indigo-500/25 to-pink-500/20 blur-[130px]" />

      <div className="relative overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-b from-[#111726]/85 to-[#090d16]/95 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-14 lg:p-16">
        {/* Specular top border light ray */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75" />

        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "8s" }} />
            <span>მზად ხართ უფრო ღრმა ასტროლოგიური ხედვისთვის?</span>
          </div>

          <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            დაიწყეთ თქვენი ციური რუკის კვლევა <br />
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-rose-300 bg-clip-text text-transparent">
              შვეიცარული სიზუსტით დღესვე
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
            არანაირი წინასწარი გადახდა. შექმენით ნატალური, სინასტრიული ან ტრანზიტული რუკა რამდენიმე წამში.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#calculator"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 hover:shadow-cyan-500/35 sm:w-auto"
            >
              <Compass className="h-4 w-4" />
              <span>რუკის შექმნა უფასოდ</span>
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/cabinet"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-white/10 sm:w-auto"
            >
              <span>პირადი კაბინეტი</span>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-white/[0.06] pt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              Swiss Ephemeris v2.1 სერტიფიკაცია
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-indigo-400" />
              100% კონფიდენციალური და დაცული
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              მყისიერი გამოთვლა
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
