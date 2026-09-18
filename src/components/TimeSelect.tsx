"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface TimeParts {
  hour: string;
  minute: string;
}

function parseTime(value: string): TimeParts {
  const [hour = "", minute = ""] = value ? value.split(":") : [];
  return { hour, minute };
}

function isCompleteTime(hour: string, minute: string): boolean {
  const h = Number(hour);
  const m = Number(minute);
  return /^\d{1,2}$/.test(hour) && /^\d{1,2}$/.test(minute) && h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export default function TimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (hhmm: string) => void;
}) {
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  useEffect(() => {
    if (editingRef.current) return;
    const next = parseTime(value);
    setHour(next.hour);
    setMinute(next.minute);
  }, [value]);

  function focusField(event: React.FocusEvent<HTMLInputElement>) {
    editingRef.current = true;
    event.currentTarget.select();
  }

  function commit(nextHour = hour, nextMinute = minute) {
    if (!isCompleteTime(nextHour, nextMinute)) return;
    onChange(`${nextHour.padStart(2, "0")}:${nextMinute.padStart(2, "0")}`);
  }

  function finishEditing() {
    commit();
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active !== hourRef.current && active !== minuteRef.current) editingRef.current = false;
    }, 0);
  }

  function handleNativeChange(next: string) {
    const nextParts = parseTime(next);
    if (!isCompleteTime(nextParts.hour, nextParts.minute)) return;
    setHour(nextParts.hour);
    setMinute(nextParts.minute);
    editingRef.current = false;
    onChange(`${nextParts.hour.padStart(2, "0")}:${nextParts.minute.padStart(2, "0")}`);
  }

  const partial = hour === "" || minute === "" || hour === "0" || minute === "0";
  const valid = isCompleteTime(hour, minute);
  const border = valid
    ? "border-amber-500/25 focus-within:border-amber-400 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
    : partial
      ? "border-slate-500/50 focus-within:border-emerald-300/70"
      : "border-rose-500/50";

  return (
    <div className={`time-editor grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-1 rounded-xl border bg-[#080418] p-1.5 transition-all sm:min-h-[62px] sm:gap-2 sm:rounded-2xl sm:p-2.5 ${border}`}>
      <input
        ref={hourRef}
        type="text"
        value={hour}
        onChange={(e) => /^\d*$/.test(e.target.value) && setHour(e.target.value)}
        onFocus={focusField}
        onClick={(e) => e.currentTarget.select()}
        onKeyDown={(e) => { if ([":", ".", "/", "Enter"].includes(e.key)) { e.preventDefault(); minuteRef.current?.focus(); } }}
        onBlur={finishEditing}
        placeholder="საათი"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={2}
        aria-label="საათი"
        className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400"
      />
      <span className="select-none text-lg font-black text-amber-300/80">:</span>
      <input
        ref={minuteRef}
        type="text"
        value={minute}
        onChange={(e) => /^\d*$/.test(e.target.value) && setMinute(e.target.value)}
        onFocus={focusField}
        onClick={(e) => e.currentTarget.select()}
        onKeyDown={(e) => { if (e.key === "Backspace" && minute === "") hourRef.current?.focus(); }}
        onBlur={finishEditing}
        placeholder="წუთი"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        maxLength={2}
        aria-label="წუთი"
        className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400"
      />
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/35 bg-purple-950/60 text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-purple-900 sm:h-9 sm:w-9">
        <Clock className="pointer-events-none h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        <input type="time" value={isCompleteTime(hour, minute) ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}` : ""} onChange={(e) => handleNativeChange(e.target.value)} aria-label="დროის არჩევა" className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [color-scheme:dark]" />
      </div>
    </div>
  );
}
