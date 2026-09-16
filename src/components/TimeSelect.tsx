"use client";

import { useEffect, useState } from "react";

type TimePart = number | "";
type TimeParts = { hour: TimePart; minute: TimePart };

function parseTime(value: string): TimeParts {
  const [hStr, mStr] = value ? value.split(":") : ["", ""];
  return {
    hour: hStr !== "" ? Number(hStr) : "",
    minute: mStr !== "" ? Number(mStr) : "",
  };
}

export default function TimeSelect({
  value,
  onChange,
}: {
  value: string; // HH:mm ან ცარიელი
  onChange: (hhmm: string) => void;
}) {
  const [parts, setParts] = useState<TimeParts>(() => parseTime(value));

  // Keep hour/minute while the user is making a partial selection. The
  // parent receives a value only after both parts have been selected.
  useEffect(() => {
    if (value) setParts(parseTime(value));
  }, [value]);

  const { hour, minute } = parts;

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  function emit(newParts: TimeParts) {
    setParts(newParts);
    const { hour: newHour, minute: newMinute } = newParts;
    if (newHour === "" || newMinute === "") {
      onChange("");
      return;
    }
    onChange(`${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`);
  }

  const selectClass =
    "w-full rounded-xl sm:rounded-2xl border border-amber-500/25 bg-[#080418] px-2 py-2 sm:px-3 sm:py-2.5 text-[0.72rem] sm:text-xs font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-500/40 text-center";

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
      <div>
        <label className="mb-1 block text-[0.6rem] sm:text-[0.65rem] uppercase tracking-wider font-bold text-slate-300">საათი</label>
        <select
          className={selectClass}
          value={hour}
          onChange={(e) => emit({ ...parts, hour: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="" className="bg-[#0A051D] text-slate-300">სთ</option>
          {hours.map((h) => (
            <option key={h} value={h} className="bg-[#0A051D] text-slate-100">
              {String(h).padStart(2, "0")} : 00
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[0.6rem] sm:text-[0.65rem] uppercase tracking-wider font-bold text-slate-300">წუთი</label>
        <select
          className={selectClass}
          value={minute}
          onChange={(e) => emit({ ...parts, minute: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="" className="bg-[#0A051D] text-slate-300">წთ</option>
          {minutes.map((m) => (
            <option key={m} value={m} className="bg-[#0A051D] text-slate-100">
              : {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


