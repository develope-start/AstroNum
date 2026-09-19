"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { daysInWideMonth, formatWideDate, isWideDate, MAX_WIDE_YEAR, MIN_WIDE_YEAR, parseWideDate } from "@/lib/astro/wideDate";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function displayYear(year: number): string {
  return String(year);
}

function weekdayOf(year: number, month: number, day: number): number {
  let adjustedYear = year;
  let adjustedMonth = month;
  if (adjustedMonth < 3) {
    adjustedMonth += 12;
    adjustedYear -= 1;
  }
  const century = Math.floor(adjustedYear / 100);
  const yearOfCentury = ((adjustedYear % 100) + 100) % 100;
  const zeller = (day + Math.floor((13 * (adjustedMonth + 1)) / 5) + yearOfCentury + Math.floor(yearOfCentury / 4) + Math.floor(century / 4) + 5 * century) % 7;
  return (zeller + 6) % 7;
}

interface PopupPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
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
  const calendarRef = useRef<HTMLDivElement>(null);
  const calendarPopupRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef(false);
  const parsed = parseWideDate(value);
  const [yearStr, setYearStr] = useState(() => (parsed ? displayYear(parsed.year) : ""));
  const [monthStr, setMonthStr] = useState(() => (parsed ? String(parsed.month).padStart(2, "0") : ""));
  const [dayStr, setDayStr] = useState(() => (parsed ? String(parsed.day).padStart(2, "0") : ""));
  const initialCalendarDate = parsed ?? parseWideDate(today())!;
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(initialCalendarDate.year);
  const [calendarYearDraft, setCalendarYearDraft] = useState(String(initialCalendarDate.year));
  const [calendarMonth, setCalendarMonth] = useState(initialCalendarDate.month);
  const [calendarPosition, setCalendarPosition] = useState<PopupPosition | null>(null);
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

  useEffect(() => {
    if (!calendarOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!calendarRef.current?.contains(target) && !calendarPopupRef.current?.contains(target)) setCalendarOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [calendarOpen]);

  useEffect(() => {
    if (!calendarOpen) {
      setCalendarPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = calendarRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const width = Math.min(320, Math.max(0, window.innerWidth - viewportPadding * 2));
      const popupHeight = calendarPopupRef.current?.getBoundingClientRect().height ?? 390;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placeAbove = popupHeight > spaceBelow && spaceAbove > spaceBelow;
      const top = placeAbove
        ? Math.max(viewportPadding, rect.top - popupHeight - 8)
        : Math.min(rect.bottom + 8, Math.max(viewportPadding, window.innerHeight - viewportPadding - 180));
      const left = Math.min(
        Math.max(viewportPadding, rect.right - width),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
      );
      const availableHeight = placeAbove
        ? Math.max(180, rect.top - top - 8)
        : Math.max(180, window.innerHeight - top - viewportPadding);
      setCalendarPosition({ top, left, width, maxHeight: availableHeight });
    };

    const animationFrame = window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 640px)").matches) {
        calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
      updatePosition();
    });
    const delayedUpdate = window.setTimeout(updatePosition, 220);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(delayedUpdate);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [calendarOpen]);

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

  function commitParts(nextYearStr = yearStr, nextMonthStr = monthStr, nextDayStr = dayStr) {
    if (!/^-?\d{1,5}$/.test(nextYearStr) || !/^\d{1,2}$/.test(nextMonthStr) || !/^\d{1,2}$/.test(nextDayStr)) return;
    const year = Number(nextYearStr);
    const month = Number(nextMonthStr);
    const day = Number(nextDayStr);
    const next = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
      ? parseWideDate(formatWideDate({ year, month, day }))
      : null;
    if (!next) return;
    const formatted = formatWideDate(next);
    updateParts(displayYear(next.year), String(next.month).padStart(2, "0"), String(next.day).padStart(2, "0"));
    onChange(formatted);
  }

  function handleBlur() {
    const normalizedMonth = /^\d$/.test(monthStr) ? `0${monthStr}` : monthStr;
    const normalizedDay = /^\d$/.test(dayStr) ? `0${dayStr}` : dayStr;
    if (normalizedMonth !== monthStr || normalizedDay !== dayStr) {
      updateParts(yearStr, normalizedMonth, normalizedDay);
      notifyDraft(yearStr, normalizedMonth, normalizedDay);
    }
    commitParts(yearStr, normalizedMonth, normalizedDay);
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

  function normalizeMonthDraft() {
    if (/^\d$/.test(monthStr)) {
      const next = `0${monthStr}`;
      updateParts(yearStr, next, dayStr);
      notifyDraft(yearStr, next, dayStr);
    }
  }

  function normalizeDayDraft() {
    if (/^\d$/.test(dayStr)) {
      const next = `0${dayStr}`;
      updateParts(yearStr, monthStr, next);
      notifyDraft(yearStr, monthStr, next);
    }
  }

  function toggleCalendar() {
    if (calendarOpen) {
      setCalendarOpen(false);
      return;
    }
    const current = parseWideDate(value) ?? parseWideDate(today())!;
    setCalendarYear(current.year);
    setCalendarYearDraft(String(current.year));
    setCalendarMonth(current.month);
    if (!parseWideDate(value)) handleNativeChange(formatWideDate(current));
    onActivate?.();
    setCalendarOpen(true);
  }

  function selectCalendarDate(year: number, month: number, day: number) {
    handleNativeChange(formatWideDate({ year, month, day }));
    setCalendarYear(year);
    setCalendarYearDraft(String(year));
    setCalendarMonth(month);
    setCalendarOpen(false);
  }

  function moveCalendarMonth(offset: number) {
    let nextYear = calendarYear;
    let nextMonth = calendarMonth + offset;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    if (nextYear < -10000 || nextYear > 10000) return;
    setCalendarYear(nextYear);
    setCalendarYearDraft(String(nextYear));
    setCalendarMonth(nextMonth);
  }

  function goToToday() {
    const current = parseWideDate(today())!;
    setCalendarYear(current.year);
    setCalendarYearDraft(String(current.year));
    setCalendarMonth(current.month);
  }

  const calendarDays = Array.from({ length: daysInWideMonth(calendarYear, calendarMonth) }, (_, index) => index + 1);
  const calendarLeadingDays = weekdayOf(calendarYear, calendarMonth, 1);
  const selectedDate = parseWideDate(value);

  const editor = (
    <div className={`wide-date-editor relative grid min-h-[54px] w-full min-w-0 grid-cols-[minmax(0,1.55fr)_auto_minmax(0,0.8fr)_auto_minmax(0,0.95fr)_auto] items-center gap-1 rounded-xl border bg-gradient-to-b from-[#130a35] via-[#09041b] to-[#0d0626] p-1.5 shadow-lg transition-all duration-300 sm:min-h-[62px] sm:gap-2 sm:rounded-2xl sm:p-2.5 ${
      isValid
        ? "border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.18)] focus-within:border-amber-400/70 focus-within:shadow-[0_0_24px_rgba(245,158,11,0.22)] focus-within:ring-1 focus-within:ring-amber-500/20"
        : isPartial
          ? "border-slate-500/50 shadow-[0_0_14px_rgba(148,163,184,0.1)] focus-within:border-emerald-300/60 focus-within:ring-1 focus-within:ring-emerald-300/15"
          : "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
    }`}>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={yearRef} type="text" value={yearStr} onChange={(e) => { const next = e.target.value; if (!/^-?\d*$/.test(next)) return; if (next && next !== "-" && (Number(next) < MIN_WIDE_YEAR || Number(next) > MAX_WIDE_YEAR)) return; updateParts(next, monthStr, dayStr); notifyDraft(next, monthStr, dayStr); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (["/", ".", "Enter"].includes(e.key)) { e.preventDefault(); monthRef.current?.focus(); } }} onBlur={handleBlur} placeholder="წელიწადი" inputMode="text" autoComplete="off" spellCheck={false} maxLength={6} aria-label={`${label} — წელიწადი`} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none transition-colors placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 focus:border-violet-300/25 focus:bg-white/[0.025]" />
      </div>
      <span className="select-none px-0.5 text-lg font-black text-amber-300/80 sm:px-1 sm:text-xl">/</span>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={monthRef} type="text" value={monthStr} onChange={(e) => { const next = e.target.value; if (!/^\d*$/.test(next) || (next && Number(next) > 12)) return; updateParts(yearStr, next, dayStr); notifyDraft(yearStr, next, dayStr); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (["/", ".", "Enter"].includes(e.key)) { e.preventDefault(); normalizeMonthDraft(); dayRef.current?.focus(); } else if (e.key === "Backspace" && monthStr === "") yearRef.current?.focus(); }} onBlur={handleBlur} placeholder="თვე" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`${label} — თვე`} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none transition-colors placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 focus:border-violet-300/25 focus:bg-white/[0.025]" />
      </div>
      <span className="select-none px-0.5 text-lg font-black text-amber-300/80 sm:px-1 sm:text-xl">/</span>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={dayRef} type="text" value={dayStr} onChange={(e) => { const next = e.target.value; const year = Number(yearStr); const month = Number(monthStr); const maxDay = Number.isInteger(year) && month >= 1 && month <= 12 ? daysInWideMonth(year, month) : 31; if (!/^\d*$/.test(next) || (next && Number(next) > maxDay)) return; updateParts(yearStr, monthStr, next); notifyDraft(yearStr, monthStr, next); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (e.key === "Backspace" && dayStr === "") monthRef.current?.focus(); }} onBlur={handleBlur} placeholder="რიცხვი" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`${label} — რიცხვი`} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none transition-colors placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 focus:border-violet-300/25 focus:bg-white/[0.025]" />
      </div>
      <div ref={calendarRef} className="relative flex shrink-0 items-center gap-1">
        <button type="button" onClick={goToToday} className="rounded-md border border-slate-400/20 bg-slate-300/5 px-1.5 py-1 text-[0.55rem] font-bold text-slate-400 transition hover:border-amber-300/50 hover:bg-amber-400/10 hover:text-amber-200" aria-label="ახლა-ზე გადასვლა">
          ახლა
        </button>
        <button type="button" onClick={toggleCalendar} className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/35 bg-purple-950/60 pl-0.5 text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-purple-900 sm:h-9 sm:w-9" aria-label={`${label} — კალენდრის გახსნა`} aria-expanded={calendarOpen}>
          <Calendar className="h-4 w-4 text-amber-300 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        </button>

        {calendarOpen && calendarPosition && typeof document !== "undefined" && createPortal(
          <div ref={calendarPopupRef} style={{ position: "fixed", top: calendarPosition.top, left: calendarPosition.left, width: calendarPosition.width, maxHeight: calendarPosition.maxHeight, overflowY: "auto", zIndex: 1000 }} className="rounded-2xl border border-amber-400/35 bg-[#0a0422]/98 p-3 text-slate-200 shadow-[0_20px_70px_rgba(0,0,0,0.75)] ring-1 ring-purple-300/10 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => moveCalendarMonth(-1)} className="rounded-lg border border-slate-400/20 p-1.5 text-slate-300 transition hover:border-amber-300/50 hover:bg-amber-400/10 hover:text-amber-200" aria-label="წინა თვე"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={goToToday} className="rounded-lg border border-slate-400/20 bg-slate-300/5 px-2.5 py-1 text-[0.65rem] font-bold text-slate-300 transition hover:border-amber-300/50 hover:bg-amber-400/10 hover:text-amber-200">ახლა</button>
              <button type="button" onClick={() => moveCalendarMonth(1)} className="rounded-lg border border-slate-400/20 p-1.5 text-slate-300 transition hover:border-amber-300/50 hover:bg-amber-400/10 hover:text-amber-200" aria-label="შემდეგი თვე"><ChevronRight className="h-4 w-4" /></button>
            </div>

            <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
              <label className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
                წელი
                <input type="text" value={calendarYearDraft} onChange={(event) => { const next = event.target.value; if (!/^-?\d*$/.test(next)) return; setCalendarYearDraft(next); if (next && next !== "-") { const numeric = Number(next); if (numeric >= MIN_WIDE_YEAR && numeric <= MAX_WIDE_YEAR) setCalendarYear(numeric); } }} onBlur={() => setCalendarYearDraft(String(calendarYear))} className="mt-1 w-full rounded-lg border border-slate-500/30 bg-[#080418] px-2 py-1.5 text-sm font-bold text-amber-200 outline-none focus:border-amber-400" inputMode="text" maxLength={6} />
              </label>
              <label className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
                თვე
                <select value={calendarMonth} onChange={(event) => setCalendarMonth(Number(event.target.value))} className="mt-1 rounded-lg border border-slate-500/30 bg-[#080418] px-2 py-2 text-sm font-bold text-amber-200 outline-none focus:border-amber-400">
                  {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}
                </select>
              </label>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[0.6rem] font-bold text-slate-500">
              {['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarLeadingDays }, (_, index) => <span key={`empty-${index}`} className="h-8" />)}
              {calendarDays.map((day) => {
                const selected = selectedDate?.year === calendarYear && selectedDate.month === calendarMonth && selectedDate.day === day;
                return <button key={day} type="button" onClick={() => selectCalendarDate(calendarYear, calendarMonth, day)} className={`h-8 rounded-lg text-xs font-bold transition ${selected ? "bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.45)]" : "text-slate-200 hover:bg-amber-400/15 hover:text-amber-200"}`}>{String(day).padStart(2, "0")}</button>;
              })}
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );

  if (hideHeader) return editor;
  return <div className="flex min-w-0 w-full flex-1 flex-col gap-2 text-left"><div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1"><label className="text-[0.72rem] font-extrabold uppercase tracking-wider text-amber-300">{label}</label><span className="hidden text-[0.65rem] font-semibold text-slate-400/80 sm:inline">წელიწადი / თვე / რიცხვი</span></div>{editor}</div>;
}
