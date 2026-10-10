"use client";

import { Award, Binary, Cpu, Globe, Lock, Orbit, ShieldCheck, Sparkles } from "lucide-react";

const PROOF_ITEMS = [
  {
    icon: Binary,
    label: "SWISS EPHEMERIS v2.1",
    subtext: "Sub-Arcsecond Precision",
  },
  {
    icon: Orbit,
    label: "ASTRONOMY ENGINE",
    subtext: "Keplerian Planetary Mechanics",
  },
  {
    icon: Cpu,
    label: "12 HOUSE SYSTEMS",
    subtext: "Placidus, Koch, Whole Sign, Equal",
  },
  {
    icon: Globe,
    label: "DUAL GEOCODING",
    subtext: "GeoNames + OpenStreetMap Engine",
  },
  {
    icon: ShieldCheck,
    label: "ZERO TIMEZONE DRIFT",
    subtext: "IANA Database Real-Time Verification",
  },
  {
    icon: Lock,
    label: "SECURE CHART VAULT",
    subtext: "End-to-End Privacy Storage",
  },
  {
    icon: Award,
    label: "SWISS CALCULATION CERTIFIED",
    subtext: "Accurate to 0.0001°",
  },
  {
    icon: Sparkles,
    label: "4-ELEMENT SYNTHESIS",
    subtext: "Hippocratic Temperament Balance",
  },
];

export default function SocialProofTicker() {
  return (
    <section className="relative w-full overflow-hidden border-y border-white/[0.06] bg-[#070b11]/80 py-4 backdrop-blur-md">
      {/* Subtle edge fades for infinite ticker look */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0b0f14] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0b0f14] to-transparent" />

      <div className="ticker-track flex w-max items-center gap-10 sm:gap-14 animate-ticker">
        {/* Render twice for seamless loop */}
        {[...PROOF_ITEMS, ...PROOF_ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex shrink-0 items-center gap-3 opacity-60 transition-opacity duration-300 hover:opacity-100"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-cyan-300 shadow-inner">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs font-semibold tracking-wider text-slate-200">
                  {item.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {item.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
