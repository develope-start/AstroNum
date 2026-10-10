"use client";

import DateSelect from "./DateSelect";
import TimeSelect from "./TimeSelect";
import PlaceAutocomplete from "./PlaceAutocomplete";
import { User, Calendar, Clock, MapPin, Sparkles } from "lucide-react";

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
    <fieldset className="prism-card relative z-40 space-y-4 sm:space-y-5 rounded-3xl p-5 sm:p-7 w-full max-w-full">
      <legend className="mx-auto flex items-center justify-center gap-2 rounded-full border border-sky-400/40 bg-sky-950/80 px-4 py-1.5 font-display text-xs font-bold tracking-wide text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.25)] max-w-[95%] text-center break-words">
        <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse shrink-0" />
        <span className="text-center break-words">{legend}</span>
      </legend>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <User className="h-3.5 w-3.5 text-sky-300" />
          </div>
          <span>სახელი და გვარი</span>
        </label>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-center text-xs sm:text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:shadow-[0_0_25px_rgba(56,189,248,0.25)] focus:ring-2 focus:ring-sky-500/20"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="შეიყვანეთ თქვენი სახელი და გვარი"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Calendar className="h-3.5 w-3.5 text-sky-300" />
          </div>
          <span>დაბადების თარიღი</span>
        </label>
        <DateSelect value={value.date} onChange={(date) => onChange({ ...value, date })} />
      </div>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Clock className="h-3.5 w-3.5 text-sky-300" />
          </div>
          <span>დაბადების დრო (24-სთ ფორმატი)</span>
        </label>
        <TimeSelect value={value.time} onChange={(time) => onChange({ ...value, time })} />
      </div>

      <div className="relative z-50">
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <MapPin className="h-3.5 w-3.5 text-sky-300" />
          </div>
          <span>დაბადების ადგილი</span>
        </label>
        <PlaceAutocomplete
          value={{ place: value.place, lat: value.lat, lon: value.lon, timezone: value.timezone }}
          onChange={(p) => onChange({ ...value, ...p })}
        />
      </div>

      {/* Optional Gender Selection Field */}
      <div className="pt-1">
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">
          <span>სქესი</span>
          <span className="text-[0.68rem] font-medium text-slate-300 lowercase tracking-normal">
            (არასავალდებულო)
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Male Button - Cyan/Sky Aura */}
          <button
            type="button"
            onClick={() => onChange({ ...value, gender: value.gender === "male" ? null : "male" })}
            aria-pressed={value.gender === "male"}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              value.gender === "male"
                ? "border-sky-400 bg-gradient-to-r from-sky-500/30 via-indigo-600/30 to-blue-600/30 text-white shadow-[0_0_25px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] ring-2 ring-sky-400/50 scale-[1.02]"
                : "border-white/10 bg-[#070914] text-slate-200 hover:border-sky-500/40 hover:text-white"
            }`}
          >
            <span className={`text-base sm:text-lg font-black leading-none ${value.gender === "male" ? "text-sky-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" : "text-sky-400"}`}>
              ♂
            </span>
            <span>მამრობითი</span>
          </button>

          {/* Female Button - Magenta/Rose Aura */}
          <button
            type="button"
            onClick={() => onChange({ ...value, gender: value.gender === "female" ? null : "female" })}
            aria-pressed={value.gender === "female"}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              value.gender === "female"
                ? "border-pink-400 bg-gradient-to-r from-pink-500/30 via-rose-600/30 to-fuchsia-600/30 text-white shadow-[0_0_25px_rgba(244,63,94,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] ring-2 ring-pink-400/50 scale-[1.02]"
                : "border-white/10 bg-[#070914] text-slate-200 hover:border-pink-500/40 hover:text-white"
            }`}
          >
            <span className={`text-base sm:text-lg font-black leading-none ${value.gender === "female" ? "text-pink-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" : "text-pink-400"}`}>
              ♀
            </span>
            <span>მდედრობითი</span>
          </button>
        </div>
      </div>
    </fieldset>
  );
}
