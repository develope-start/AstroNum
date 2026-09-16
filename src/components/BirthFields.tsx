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
}

export const EMPTY_BIRTH: BirthValue = {
  name: "",
  date: "",
  time: "",
  place: "",
  lat: null,
  lon: null,
  timezone: null,
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
    <fieldset className="glass-panel relative z-40 space-y-5 rounded-[28px] p-6 sm:p-7 border-amber-500/25 bg-gradient-to-b from-[#130a35]/90 via-[#0e0728]/95 to-[#080417]/95 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.6)]">
      <legend className="mx-auto flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-purple-950 via-violet-900 to-amber-950/80 px-5 py-1.5 font-display text-xs font-bold tracking-wide text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
        <Sparkle className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span>{legend}</span>
      </legend>

      <div>
        <label className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <User className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>სახელი</span>
        </label>
        <div className="relative">
          <input
            className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-center text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)] focus:ring-2 focus:ring-amber-500/20"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="მაგ. ნინო"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>დაბადების თარიღი</span>
        </label>
        <DateSelect value={value.date} onChange={(date) => onChange({ ...value, date })} />
      </div>

      <div>
        <label className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>დაბადების დრო (24-სთ ფორმატი)</span>
        </label>
        <TimeSelect value={value.time} onChange={(time) => onChange({ ...value, time })} />
      </div>

      <div className="relative z-50">
        <label className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-400">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <span>დაბადების ადგილი</span>
        </label>
        <PlaceAutocomplete
          value={{ place: value.place, lat: value.lat, lon: value.lon, timezone: value.timezone }}
          onChange={(p) => onChange({ ...value, ...p })}
        />
      </div>
    </fieldset>
  );
}



