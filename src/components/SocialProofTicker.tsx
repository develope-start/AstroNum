"use client";

import { Award, Binary, Cpu, Globe, Lock, Orbit, ShieldCheck, Sparkles } from "lucide-react";

const PROOF_ITEMS = [
  {
    icon: Binary,
    label: "შვეიცარიული ეფემერიდა · ვერსია 2.1",
    subtext: "რკალის წამზე ნაკლები ცდომილება",
  },
  {
    icon: Orbit,
    label: "ასტრონომიული გამოთვლების ძრავა",
    subtext: "კეპლერისეული პლანეტური მექანიკა",
  },
  {
    icon: Cpu,
    label: "სახლების 12 სისტემა",
    subtext: "პლაციდუსი, კოხი, მთლიანი ნიშანი, თანაბარი სახლები",
  },
  {
    icon: Globe,
    label: "ორმაგი გეოკოდირება",
    subtext: "GeoNames-ისა და OpenStreetMap-ის სერვისები",
  },
  {
    icon: ShieldCheck,
    label: "დროის სარტყლის ცდომილების გარეშე",
    subtext: "IANA-ს მონაცემთა ბაზით დროის სარტყლის რეალურ დროში გადამოწმება",
  },
  {
    icon: Lock,
    label: "რუკების დაცული საცავი",
    subtext: "მონაცემების კონფიდენციალურობის სრული დაცვით შენახვა",
  },
  {
    icon: Award,
    label: "შვეიცარიული გამოთვლების სერტიფიცირებული სიზუსტე",
    subtext: "სიზუსტე: 0.0001°-მდე",
  },
  {
    icon: Sparkles,
    label: "ოთხი სტიქიის სინთეზი",
    subtext: "ჰიპოკრატეს ტემპერამენტთა დაბალანსება",
  },
];

export default function SocialProofTicker() {
  return (
    <section className="relative w-full overflow-hidden border-y border-white/[0.06] bg-[#070b11]/80 py-4 backdrop-blur-md">
      {/* რბილი კიდეები უსასრულო მორბენალი სტრიქონის ეფექტისთვის */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0b0f14] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0b0f14] to-transparent" />

      <div className="ticker-track flex w-max items-center gap-10 sm:gap-14 animate-ticker">
        {/* ორჯერ გამოტანა შეუფერხებელი ციკლისთვის */}
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
