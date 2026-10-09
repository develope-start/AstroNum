"use client";

import { useState } from "react";
import type { CalculationOptions } from "@/lib/astro/ephemeris";

export const DEFAULT_UI_CALCULATION: CalculationOptions = {
  ephemeris: "swiss",
  zodiac: "tropical",
  siderealMode: 1,
  nodeType: "mean",
  topocentric: false,
  altitudeMeters: 0,
  includeAsteroids: false,
};

const SIDEREAL_MODES = [
  [0, "ფაგან-ბრედლი"],
  [1, "ლაჰირი"],
  [2, "დე ლუსი"],
  [3, "რამანი"],
  [4, "უშაშაში"],
  [5, "კრიშნამურტი"],
] as const;

export default function CalculationSettings({
  value,
  onChange,
}: {
  value: CalculationOptions;
  onChange: (value: CalculationOptions) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = <K extends keyof CalculationOptions>(key: K, next: CalculationOptions[K]) => {
    onChange({ ...value, [key]: next });
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#090d1e]/85 backdrop-blur-2xl p-3 text-left sm:p-4 shadow-[0_12px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-200">გამოთვლის პარამეტრები</span>
          <span className="mt-0.5 block text-[0.68rem] text-slate-400">Swiss Ephemeris-ის რეჟიმი და დამატებითი კოორდინატები</span>
        </span>
        <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[0.68rem] font-bold text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition hover:bg-white/[0.08] hover:border-cyan-400/40">
          {open ? "დახურვა" : "გახსნა"}
        </span>
      </button>

      {open && (
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
          <label className="text-[0.7rem] font-semibold text-slate-300">
            ეფემერიდის ძრავი
            <select value={value.ephemeris ?? "swiss"} onChange={(event) => set("ephemeris", event.target.value as CalculationOptions["ephemeris"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400">
              <option value="swiss" className="bg-[#070a16]">Swiss Ephemeris — მთავარი</option>
              <option value="astronomy" className="bg-[#070a16]">Astronomy Engine — fallback/შედარება</option>
            </select>
          </label>

          <label className="text-[0.7rem] font-semibold text-slate-300">
            ზოდიაქოს სისტემა
            <select value={value.zodiac ?? "tropical"} onChange={(event) => set("zodiac", event.target.value as CalculationOptions["zodiac"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400">
              <option value="tropical" className="bg-[#070a16]">ტროპიკული</option>
              <option value="sidereal" className="bg-[#070a16]">სიდერიული</option>
            </select>
          </label>

          {value.zodiac === "sidereal" && (
            <label className="text-[0.7rem] font-semibold text-slate-300">
              აიანამშას სისტემა
              <select value={value.siderealMode ?? 1} onChange={(event) => set("siderealMode", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400">
                {SIDEREAL_MODES.map(([mode, label]) => <option key={mode} value={mode} className="bg-[#070a16]">{label}</option>)}
              </select>
            </label>
          )}

          <label className="text-[0.7rem] font-semibold text-slate-300">
            მთვარის კვანძი
            <select value={value.nodeType ?? "mean"} onChange={(event) => set("nodeType", event.target.value as CalculationOptions["nodeType"])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400">
              <option value="mean" className="bg-[#070a16]">საშუალო კვანძი</option>
              <option value="true" className="bg-[#070a16]">ჭეშმარიტი კვანძი</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070a16]/60 px-3 py-2 text-xs font-semibold text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={value.topocentric ?? false} onChange={(event) => set("topocentric", event.target.checked)} className="h-4 w-4 accent-cyan-400" />
            ტოპოცენტრული გამოთვლა — პლანეტის მდებარეობასთან ერთად დამკვირვებლის რეალური ადგილი
          </label>

          {value.topocentric && (
            <label className="text-[0.7rem] font-semibold text-slate-300">
              სიმაღლე ზღვის დონიდან (მ)
              <input type="number" min={-500} max={10000} step={1} value={value.altitudeMeters ?? 0} onChange={(event) => set("altitudeMeters", Number(event.target.value) || 0)} className="mt-1 w-full rounded-xl border border-white/10 bg-[#070a16] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400" />
            </label>
          )}

          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070a16]/60 px-3 py-2 text-xs font-semibold text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={value.includeAsteroids ?? false} onChange={(event) => set("includeAsteroids", event.target.checked)} className="h-4 w-4 accent-cyan-400" />
            დამატებითი ასტეროიდები — Ceres, Pallas, Juno და Vesta (Chiron რუკაში ყოველთვის ჩანს)
          </label>
        </div>
      )}
    </div>
  );
}
