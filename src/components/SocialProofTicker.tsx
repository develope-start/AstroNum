"use client";

import { Binary, Cpu, Globe, Lock, Orbit, ShieldCheck, Sparkles } from "lucide-react";

const PROOF_ITEMS = [
  {
    icon: Binary,
    label: "ორი ეფემერიდის ძრავა",
    subtext: "Swiss Ephemeris და Astronomy Engine fallback",
  },
  {
    icon: Orbit,
    label: "გამოთვლის პარამეტრები",
    subtext: "ტროპიკული/სიდერიული ზოდიაქო, კვანძი და ასტეროიდები",
  },
  {
    icon: Cpu,
    label: "სახლების 4 სისტემა",
    subtext: "პლაციდუსი, მთელი ნიშანი, თანაბარი სახლები და პორფირი",
  },
  {
    icon: Globe,
    label: "ადგილების ძებნა და რუკა",
    subtext: "Photon-ისა და OpenStreetMap-ის მონაცემები",
  },
  {
    icon: ShieldCheck,
    label: "დროის სარტყლის გამოთვლა",
    subtext: "კოორდინატებიდან tz-lookup-ით, თარიღის ოფსეტით Luxon-იდან",
  },
  {
    icon: Lock,
    label: "ანგარიშის დაცვა",
    subtext: "bcrypt პაროლის ჰეშისთვის და HTTP-only სესიის cookie",
  },
  {
    icon: Lock,
    label: "პირადი რუკების არქივი",
    subtext: "წვდომას API ანგარიშის მფლობელობითა და როლით ამოწმებს",
  },
  {
    icon: Sparkles,
    label: "სტიქიების სინთეზი",
    subtext: "განაწილება ნატალურ რუკაში პლანეტების პოზიციებიდან ითვლება",
  },
];

export default function SocialProofTicker() {
  return (
    <section
      aria-label="AstroNum-ის შესაძლებლობები"
      className="relative w-full overflow-hidden border-y border-white/[0.06] bg-[#070b11]/80 py-4 backdrop-blur-md"
    >
      {/* რბილი კიდეები უსასრულო მორბენალი სტრიქონის ეფექტისთვის */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#030208] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#030208] to-transparent" />

      <div className="ticker-track flex w-max animate-ticker" aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-10 pr-10 sm:gap-14 sm:pr-14">
            {PROOF_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${copy}-${idx}`}
                  className="flex shrink-0 items-center gap-3 opacity-75 transition-opacity duration-300 hover:opacity-100"
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
        ))}
      </div>
    </section>
  );
}
