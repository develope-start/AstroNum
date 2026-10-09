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
    <fieldset className="glass-panel relative z-40 space-y-4 sm:space-y-5 rounded-2xl sm:rounded-[28px] p-4 sm:p-7 border-white/10 bg-[#090d1e]/85 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)] w-full max-w-full">
      <legend className="mx-auto flex items-center justify-center gap-1.5 sm:gap-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-cyan-950/80 via-indigo-950/90 to-purple-950/80 px-4 py-1 sm:px-5 sm:py-1.5 font-display text-[0.7rem] sm:text-xs font-bold tracking-wide text-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.25)] max-w-[95%] text-center break-words">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300 animate-pulse shrink-0" />
        <span className="text-center break-words">{legend}</span>
      </legend>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <User className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <span>სახელი</span>
        </label>
        <div className="relative">
          <input
            className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-[#070a16] px-3 py-2.5 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:shadow-[0_0_25px_rgba(56,189,248,0.25)] focus:ring-2 focus:ring-cyan-500/20"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="შეიყვანეთ თქვენი სახელი და გვარი"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Calendar className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <span>დაბადების თარიღი</span>
        </label>
        <DateSelect value={value.date} onChange={(date) => onChange({ ...value, date })} />
      </div>

      <div>
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <Clock className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <span>დაბადების დრო (24-სთ ფორმატი)</span>
        </label>
        <TimeSelect value={value.time} onChange={(time) => onChange({ ...value, time })} />
      </div>

      <div className="relative z-50">
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-500/15 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
            <MapPin className="h-3.5 w-3.5 text-cyan-300" />
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
        <label className="mb-1.5 sm:mb-2 flex items-center justify-center gap-1.5 text-[0.7rem] sm:text-xs font-bold uppercase tracking-wider text-slate-200">
          <span>სქესი</span>
          <span className="text-[0.62rem] sm:text-[0.68rem] font-medium text-slate-400/80 lowercase tracking-normal">
            (არასავალდებულო)
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
          {/* Male Button - Cyan/Sky Aura */}
          <button
            type="button"
            onClick={() => onChange({ ...value, gender: value.gender === "male" ? null : "male" })}
            className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              value.gender === "male"
                ? "border-cyan-400 bg-gradient-to-r from-cyan-500/30 via-sky-600/30 to-blue-600/30 text-cyan-200 shadow-[0_0_25px_rgba(56,189,248,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] ring-2 ring-cyan-400/50 scale-[1.02]"
                : "border-white/10 bg-[#070a16] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-300"
            }`}
          >
            <span className={`text-base sm:text-lg font-black leading-none ${value.gender === "male" ? "text-cyan-300 drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" : "text-cyan-400/70"}`}>
              ♂
            </span>
            <span>მამრობითი</span>
          </button>

          {/* Female Button - Magenta/Rose Aura */}
          <button
            type="button"
            onClick={() => onChange({ ...value, gender: value.gender === "female" ? null : "female" })}
            className={`flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
              value.gender === "female"
                ? "border-pink-400 bg-gradient-to-r from-pink-500/30 via-rose-600/30 to-fuchsia-600/30 text-pink-200 shadow-[0_0_25px_rgba(244,63,94,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] ring-2 ring-pink-400/50 scale-[1.02]"
                : "border-white/10 bg-[#070a16] text-slate-400 hover:border-pink-500/40 hover:text-pink-300"
            }`}
          >
            <span className={`text-base sm:text-lg font-black leading-none ${value.gender === "female" ? "text-pink-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" : "text-pink-400/70"}`}>
              ♀
            </span>
            <span>მდედრობითი</span>
          </button>
        </div>
      </div>
    </fieldset>
  );
}
