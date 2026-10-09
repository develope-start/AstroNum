"use client";

import { Sliders } from "lucide-react";
import type { HouseSystem } from "@/lib/astro/positions";

const HOUSE_SYSTEM_OPTIONS: Array<[HouseSystem, string]> = [
  ["placidus", "პლაციდუსი (Placidus)"],
  ["whole_sign", "მთელი ნიშანი (Whole Sign)"],
  ["equal", "თანაბარი (Equal)"],
  ["porphyry", "პორფირი (Porphyry)"],
];

export default function HouseSystemSelect({
  value,
  onChange,
}: {
  value: HouseSystem;
  onChange: (value: HouseSystem) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
          <Sliders className="h-4 w-4" />
        </div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-200">სახლთა სისტემა:</label>
      </div>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value as HouseSystem)}
        className="w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2.5 text-xs font-semibold text-slate-100 outline-none transition-all focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(56,189,248,0.2)] text-center cursor-pointer"
      >
        {HOUSE_SYSTEM_OPTIONS.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue} className="bg-[#070a16] text-slate-100">
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
