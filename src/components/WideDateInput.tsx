"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { formatWideDate, isWideDate, parseWideDate } from "@/lib/astro/wideDate";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayYear(year: number): string {
  return year < 0 ? `-${String(Math.abs(year)).padStart(4, "0")}` : String(year).padStart(4, "0");
}

export interface WideDateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onDraftChange?: (value: string) => void;
  onActivate?: () => void;
  hideHeader?: boolean;
}

export default function WideDateInput({ label = "თარიღი", value, onChange, onDraftChange, onActivate, hideHeader = false }: WideDateInputProps) {
  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);
  const parsed = parseWideDate(value);
  const [yearStr, setYearStr] = useState(() => (parsed ? displayYear(parsed.year) : ""));
  const [monthStr, setMonthStr] = useState(() => (parsed ? String(parsed.month).padStart(2, "0") : ""));
  const [dayStr, setDayStr] = useState(() => (parsed ? String(parsed.day).padStart(2, "0") : ""));
  const nativeValue = parsed && parsed.year >= 1 && parsed.year <= 9999 ? value : "";
  const isValid = isWideDate(`${yearStr}-${monthStr}-${dayStr}`);
  const isPartial = yearStr === "" || yearStr === "-" || monthStr === "" || monthStr === "0" || dayStr === "" || dayStr === "0";

  useEffect(() => {
    if (editingRef.current) return;
    const next = parseWideDate(value);
    if (!next) {
      if (!value) updateParts("", "", "");
      return;
    }
    setYearStr(displayYear(next.year));
    setMonthStr(String(next.month).padStart(2, "0"));
    setDayStr(String(next.day).padStart(2, "0"));
  }, [value]);

  function updateParts(year: string, month: string, day: string) {
    setYearStr(year);
    setMonthStr(month);
    setDayStr(day);
  }

  function notifyDraft(year: string, month: string, day: string) {
    if (!onDraftChange) return;
    if (year) onDraftChange(month ? `${year}-${month}${day ? `-${day}` : ""}` : year);
    else if (month) onDraftChange(month);
    else onDraftChange(day);
  }

  function commitParts() {
    if (!/^-?\d{1,5}$/.test(yearStr) || !/^\d{1,2}$/.test(monthStr) || !/^\d{1,2}$/.test(dayStr)) return;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    const next = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
      ? parseWideDate(formatWideDate({ year, month, day }))
      : null;
    if (!next) return;
    const formatted = formatWideDate(next);
    updateParts(displayYear(next.year), String(next.month).padStart(2, "0"), String(next.day).padStart(2, "0"));
    onChange(formatted);
  }

  function handleBlur() {
    commitParts();
    window.setTimeout(() => {
      const active = document.activeElement;
      if (![yearRef.current, monthRef.current, dayRef.current].includes(active as HTMLInputElement | null)) editingRef.current = false;
    }, 0);
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    editingRef.current = true;
    onActivate?.();
    event.currentTarget.select();
  }

  function handleNativeChange(next: string) {
    const parts = parseWideDate(next);
    if (!parts) return;
    updateParts(displayYear(parts.year), String(parts.month).padStart(2, "0"), String(parts.day).padStart(2, "0"));
    editingRef.current = false;
    onChange(formatWideDate(parts));
  }

  function handleCalendarClick() {
    handleNativeChange(today());
  }

  const editor = (
    <div className={`wide-date-editor relative grid min-h-[54px] w-full min-w-0 grid-cols-[minmax(0,1.55fr)_auto_minmax(0,0.8fr)_auto_minmax(0,0.95fr)_auto] items-center gap-1 rounded-xl border bg-gradient-to-b from-[#130a35] via-[#09041b] to-[#0d0626] p-1.5 shadow-lg transition-all duration-300 sm:min-h-[62px] sm:gap-2 sm:rounded-2xl sm:p-2.5 ${
      isValid
        ? "border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] focus-within:border-amber-400 focus-within:shadow-[0_0_35px_rgba(245,158,11,0.5)] focus-within:ring-2 focus-within:ring-amber-500/30"
        : isPartial
          ? "border-slate-500/50 shadow-[0_0_16px_rgba(148,163,184,0.12)] focus-within:border-emerald-300/70 focus-within:ring-2 focus-within:ring-emerald-300/20"
          : "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
    }`}>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={yearRef} type="text" value={yearStr} onChange={(e) => { if (!/^-?\d*$/.test(e.target.value)) return; updateParts(e.target.value, monthStr, dayStr); notifyDraft(e.target.value, monthStr, dayStr); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (["/", ".", "Enter"].includes(e.key)) { e.preventDefault(); monthRef.current?.focus(); } }} onBlur={handleBlur} placeholder="წელიწადი" inputMode="text" autoComplete="off" spellCheck={false} maxLength={6} aria-label={`${label} — წელიწადი`} className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400" />
      </div>
      <span className="select-none px-0.5 text-lg font-black text-amber-300/80 sm:px-1 sm:text-xl">/</span>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={monthRef} type="text" value={monthStr} onChange={(e) => { if (!/^\d*$/.test(e.target.value)) return; updateParts(yearStr, e.target.value, dayStr); notifyDraft(yearStr, e.target.value, dayStr); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (["/", ".", "Enter"].includes(e.key)) { e.preventDefault(); dayRef.current?.focus(); } else if (e.key === "Backspace" && monthStr === "") yearRef.current?.focus(); }} onBlur={handleBlur} placeholder="თვე" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`${label} — თვე`} className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400" />
      </div>
      <span className="select-none px-0.5 text-lg font-black text-amber-300/80 sm:px-1 sm:text-xl">/</span>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={dayRef} type="text" value={dayStr} onChange={(e) => { if (!/^\d*$/.test(e.target.value)) return; updateParts(yearStr, monthStr, e.target.value); notifyDraft(yearStr, monthStr, e.target.value); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (e.key === "Backspace" && dayStr === "") monthRef.current?.focus(); }} onBlur={handleBlur} placeholder="რიცხვი" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`${label} — რიცხვი`} className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400" />
      </div>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/35 bg-purple-950/60 pl-0.5 text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-purple-900 sm:h-9 sm:w-9">
        <Calendar className="pointer-events-none h-4 w-4 text-amber-300 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        <input type="date" value={nativeValue} min="0001-01-01" max="9999-12-31" onChange={(e) => handleNativeChange(e.target.value)} onClick={handleCalendarClick} onFocus={onActivate} aria-label={`${label} — კალენდრით არჩევა`} className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [color-scheme:dark]" />
      </div>
    </div>
  );

  if (hideHeader) return editor;
  return <div className="flex min-w-0 w-full flex-1 flex-col gap-2 text-left"><div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1"><label className="text-[0.72rem] font-extrabold uppercase tracking-wider text-amber-300">{label}</label><span className="hidden text-[0.65rem] font-semibold text-slate-400/80 sm:inline">წელიწადი / თვე / რიცხვი</span></div>{editor}</div>;
}
