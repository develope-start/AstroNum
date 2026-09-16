"use client";

import { useEffect, useState } from "react";

const MONTHS_KA = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

const MIN_YEAR = 1940;
const MAX_YEAR = 2040;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

type DatePart = number | "";
type DateParts = { day: DatePart; month: DatePart; year: DatePart };

function parseDate(value: string): DateParts {
  const [y, m, d] = value ? value.split("-").map(Number) : [NaN, NaN, NaN];
  return {
    year: Number.isFinite(y) ? y : "",
    month: Number.isFinite(m) ? m : "",
    day: Number.isFinite(d) ? d : "",
  };
}

export default function DateSelect({
  value,
  onChange,
}: {
  value: string; // YYYY-MM-DD ან ცარიელი
  onChange: (isoDate: string) => void;
}) {
  const [parts, setParts] = useState<DateParts>(() => parseDate(value));

  // The parent stores only a complete ISO date. Keep partial selections here
  // so choosing day/month/year in any order does not clear the other fields.
  useEffect(() => {
    if (value) setParts(parseDate(value));
  }, [value]);

  const { day, month, year } = parts;

  const maxDay = typeof year === "number" && typeof month === "number" ? daysInMonth(year, month) : 31;
  const years = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i); // ახლიდან ძველისკენ
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function emit(newParts: DateParts) {
    setParts(newParts);
    const { day: newDay, month: newMonth, year: newYear } = newParts;
    if (newDay === "" || newMonth === "" || newYear === "") {
      onChange("");
      return;
    }
    const clampedDay = Math.min(newDay, daysInMonth(newYear, newMonth));
    const iso = `${newYear}-${String(newMonth).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
    onChange(iso);
  }

  const selectClass =
    "w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-500/40";

  return (
    <div className="grid grid-cols-3 gap-2.5">
      <div>
        <label className="mb-1 block text-[0.65rem] uppercase tracking-wider font-bold text-slate-300">დღე</label>
        <select
          className={selectClass}
          value={day}
          onChange={(e) => emit({ ...parts, day: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="" className="bg-[#0A051D] text-slate-300">დღე</option>
          {days.map((dd) => (
            <option key={dd} value={dd} className="bg-[#0A051D] text-slate-100">
              {dd}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[0.65rem] uppercase tracking-wider font-bold text-slate-300">თვე</label>
        <select
          className={selectClass}
          value={month}
          onChange={(e) => emit({ ...parts, month: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="" className="bg-[#0A051D] text-slate-300">თვე</option>
          {MONTHS_KA.map((label, i) => (
            <option key={label} value={i + 1} className="bg-[#0A051D] text-slate-100">
              {i + 1}. {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[0.65rem] uppercase tracking-wider font-bold text-slate-300">წელი</label>
        <select
          className={selectClass}
          value={year}
          onChange={(e) => emit({ ...parts, year: e.target.value ? Number(e.target.value) : "" })}
        >
          <option value="" className="bg-[#0A051D] text-slate-300">წელი</option>
          {years.map((yy) => (
            <option key={yy} value={yy} className="bg-[#0A051D] text-slate-100">
              {yy}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


