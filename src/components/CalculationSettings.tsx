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
    <div className="w-full rounded-2xl border border-slate-500/25 bg-slate-950/30 p-3 text-left sm:p-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-200">გამოთვლის პარამეტრები</span>
          <span className="mt-0.5 block text-[0.68rem] text-slate-400">Swiss Ephemeris-ის რეჟიმი და დამატებითი კოორდინატები</span>
        </span>
        <span className="rounded-full border border-slate-500/30 px-2 py-1 text-[0.65rem] font-bold text-slate-300">{open ? "დახურვა" : "გახსნა"}</span>
      </button>

      {open && (
        <div className="mt-4 grid gap-3 border-t border-slate-500/20 pt-4 sm:grid-cols-2">
          <label className="text-[0.7rem] font-semibold text-slate-300">
            ეფემერიდის ძრავი
            <select value={value.ephemeris ?? "swiss"} onChange={(event) => set("ephemeris", event.target.value as CalculationOptions["ephemeris"])} className="mt-1 w-full rounded-xl border border-slate-500/30 bg-[#080418] px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400">
              <option value="swiss">Swiss Ephemeris — მთავარი</option>
              <option value="astronomy">Astronomy Engine — fallback/შედარება</option>
            </select>
          </label>

          <label className="text-[0.7rem] font-semibold text-slate-300">
            ზოდიაქოს სისტემა
            <select value={value.zodiac ?? "tropical"} onChange={(event) => set("zodiac", event.target.value as CalculationOptions["zodiac"])} className="mt-1 w-full rounded-xl border border-slate-500/30 bg-[#080418] px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400">
              <option value="tropical">ტროპიკული</option>
              <option value="sidereal">სიდერიული</option>
            </select>
          </label>

          {value.zodiac === "sidereal" && (
            <label className="text-[0.7rem] font-semibold text-slate-300">
              აიანამშას სისტემა
              <select value={value.siderealMode ?? 1} onChange={(event) => set("siderealMode", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-500/30 bg-[#080418] px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400">
                {SIDEREAL_MODES.map(([mode, label]) => <option key={mode} value={mode}>{label}</option>)}
              </select>
            </label>
          )}

          <label className="text-[0.7rem] font-semibold text-slate-300">
            მთვარის კვანძი
            <select value={value.nodeType ?? "mean"} onChange={(event) => set("nodeType", event.target.value as CalculationOptions["nodeType"])} className="mt-1 w-full rounded-xl border border-slate-500/30 bg-[#080418] px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400">
              <option value="mean">საშუალო კვანძი</option>
              <option value="true">ჭეშმარიტი კვანძი</option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-xl border border-slate-500/20 bg-slate-900/30 px-3 py-2 text-xs font-semibold text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={value.topocentric ?? false} onChange={(event) => set("topocentric", event.target.checked)} className="h-4 w-4 accent-amber-400" />
            ტოპოცენტრული გამოთვლა — პლანეტის მდებარეობასთან ერთად დამკვირვებლის რეალური ადგილი
          </label>

          {value.topocentric && (
            <label className="text-[0.7rem] font-semibold text-slate-300">
              სიმაღლე ზღვის დონიდან (მ)
              <input type="number" min={-500} max={10000} step={1} value={value.altitudeMeters ?? 0} onChange={(event) => set("altitudeMeters", Number(event.target.value) || 0)} className="mt-1 w-full rounded-xl border border-slate-500/30 bg-[#080418] px-3 py-2 text-xs text-slate-100 outline-none focus:border-amber-400" />
            </label>
          )}

          <label className="flex items-center gap-2 rounded-xl border border-slate-500/20 bg-slate-900/30 px-3 py-2 text-xs font-semibold text-slate-300 sm:col-span-2">
            <input type="checkbox" checked={value.includeAsteroids ?? false} onChange={(event) => set("includeAsteroids", event.target.checked)} className="h-4 w-4 accent-amber-400" />
            დამატებითი სხეულები — Chiron, Ceres, Pallas, Juno და Vesta
          </label>
        </div>
      )}
    </div>
  );
}
