"use client";

import DateSelect from "./DateSelect";
import TimeSelect from "./TimeSelect";
import PlaceAutocomplete from "./PlaceAutocomplete";
import { User, Calendar, Clock, MapPin, Sparkle } from "lucide-react";

export interface BirthValue {
  name: string;
  date: string;
  time: string;
  place: string;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
  gender?: "male" | "female" | null;
}

export const EMPTY_BIRTH: BirthValue = {
  name: "",
  date: "",
  time: "",
  place: "",
  lat: null,
  lon: null,
  timezone: null,
  gender: null,
};

export default function BirthFields({
  value,
  onChange,
  legend,
}: {
  value: BirthValue;
  onChange: (v: BirthValue) => void;
  legend: string;
}) {
  return (
    <fieldset className="glass-panel relative z-40 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-[28px] p-4 sm:p-7 border-amber-500/25 bg-gradient-to-b from-[#130a35]/90 via-[#0e0728]/95 to-[#080417]/95 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.6)] w-full max-w-full">
      <legend className="mx-auto flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-purple-950 via-violet-900 to-amber-950/80 px-4 py-1 sm:px-5 sm:py-1.5 font-display text-[0.7rem] sm:text-xs font-bold tracking-wide text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] max-w-[95%] text-center break-words">
        <Sparkle className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
        <span className="text-center break-words">{legend}</span>
      </legend>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <User className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>სახელი</span>
        </label>
        <div className="relative">
          <input
            className="w-full rounded-xl sm:rounded-2xl border border-amber-500/25 bg-[#080418] px-3 py-2.5 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)] focus:ring-2 focus:ring-amber-500/20"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="მაგ. ნინო"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>დაბადების თარიღი</span>
        </label>
        <DateSelect value={value.date} onChange={(date) => onChange({ ...value, date })} />
      </div>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>დაბადების დრო (24-სთ ფორმატი)</span>
        </label>
        <TimeSelect value={value.time} onChange={(time) => onChange({ ...value, time })} />
      </div>

      <div className="relative z-50">
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>დაბადების ადგილი</span>
        </label>
        <PlaceAutocomplete
          value={{ place: value.place, lat: value.lat, lon: value.lon, timezone: value.timezone }}
          onChange={(p) => onChange({ ...value, ...p })}
        />
      </div>

      {/* Optional Gender Selection Field (Right below Birthplace) */}
      <div className="pt-1">
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-1.5 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <span>სქესი</span>
          <span className="text-[0.62rem] sm:text-[0.68rem] font-medium text-slate-400/80 lowercase tracking-normal">
            (არასავალდებულო)
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {/* Male Button - Mars ♂ symbol in Bright Glowing Blue */}
          <button
            type="button"
            onClick={() => onChange({ ...value, gender: value.gender === "male" ? null : "male" })}
            className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              value.gender === "male"
                ? "border-sky-400 bg-gradient-to-r from-sky-500/25 via-blue-600/30 to-sky-500/25 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.6)] ring-2 ring-sky-400/50 scale-[1.02]"
                : "border-amber-500/20 bg-[#080418] text-slate-400 hover:border-sky-500/40 hover:text-sky-300"
            }`}
          >
            <span className={`text-base sm:text-lg font-black leading-none ${value.gender === "male" ? "text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" : "text-sky-400/70"}`}>
              ♂
            </span>
            <span>მამრობითი</span>
          </button>

          {/* Female Button - Venus ♀ symbol in Deep Glowing Pink */}
          <button
            type="button"
            onClick={() => onChange({ ...value, gender: value.gender === "female" ? null : "female" })}
            className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              value.gender === "female"
                ? "border-pink-400 bg-gradient-to-r from-pink-500/25 via-rose-600/30 to-pink-500/25 text-pink-300 shadow-[0_0_24px_rgba(236,72,153,0.6)] ring-2 ring-pink-400/50 scale-[1.02]"
                : "border-amber-500/20 bg-[#080418] text-slate-400 hover:border-pink-500/40 hover:text-pink-300"
            }`}
          >
            <span className={`text-base sm:text-lg font-black leading-none ${value.gender === "female" ? "text-pink-300 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" : "text-pink-400/70"}`}>
              ♀
            </span>
            <span>მდედრობითი</span>
          </button>
        </div>
      </div>
    </fieldset>
  );
}
