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
      const shouldOpenAbove = spaceBelow < Math.min(popupHeight, 320) && spaceAbove > spaceBelow;
      const left = Math.max(viewportPadding, Math.min(rect.right - width, window.innerWidth - width - viewportPadding));
      const top = shouldOpenAbove
        ? Math.max(viewportPadding, rect.top - Math.min(popupHeight, spaceAbove) - 6)
        : Math.min(window.innerHeight - popupHeight - viewportPadding, rect.bottom + 6);
      const maxHeight = Math.max(220, shouldOpenAbove ? spaceAbove - 6 : spaceBelow - 6);

      setCalendarPosition({ top, left, width, maxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [calendarOpen]);

  function notifyDraft(year: string, month: string, day: string) {
    if (!onDraftChange) return;
    const y = year.trim();
    const m = month.trim();
    const d = day.trim();
    if (!y && !m && !d) {
      onDraftChange("");
      return;
    }
    const cleanYear = y || "0";
    const cleanMonth = m ? m.padStart(2, "0") : "01";
    const cleanDay = d ? d.padStart(2, "0") : "01";
    onDraftChange(`${cleanYear}-${cleanMonth}-${cleanDay}`);
  }

  function updateParts(year: string, month: string, day: string) {
    setYearStr(year);
    setMonthStr(month);
    setDayStr(day);
  }

  function handleFocus() {
    editingRef.current = true;
    onActivate?.();
  }

  function handleBlur() {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active === yearRef.current || active === monthRef.current || active === dayRef.current) return;
      editingRef.current = false;
      commitIfComplete();
    }, 0);
  }

  function normalizeMonthDraft() {
    if (!monthStr) return;
    const num = Number(monthStr);
    if (num >= 1 && num <= 12) setMonthStr(String(num).padStart(2, "0"));
  }

  function commitIfComplete() {
    const y = Number(yearStr);
    const m = Number(monthStr);
    const d = Number(dayStr);
    if (Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && m >= 1 && m <= 12 && d >= 1 && d <= daysInWideMonth(y, m)) {
      const normalized = formatWideDate({ year: y, month: m, day: d });
      onChange(normalized);
      setCalendarYear(y);
      setCalendarYearDraft(String(y));
      setCalendarMonth(m);
    }
  }

  function handleNativeChange(nextValue: string) {
    const next = parseWideDate(nextValue);
    if (!next) {
      onChange("");
      updateParts("", "", "");
      return;
    }
    onChange(nextValue);
    updateParts(displayYear(next.year), String(next.month).padStart(2, "0"), String(next.day).padStart(2, "0"));
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
    <div className={`wide-date-editor relative grid min-h-[54px] w-full min-w-0 grid-cols-[minmax(0,1.55fr)_auto_minmax(0,0.8fr)_auto_minmax(0,0.95fr)_auto] items-center gap-1 rounded-2xl border bg-[#070914] p-2 shadow-inner transition-all duration-300 sm:min-h-[60px] sm:gap-2 sm:p-2.5 ${
      isValid
        ? "border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.15)] focus-within:border-sky-400 focus-within:shadow-[0_0_25px_rgba(56,189,248,0.25)] focus-within:ring-1 focus-within:ring-sky-500/20"
        : isPartial
          ? "border-white/10 focus-within:border-sky-400/60 focus-within:ring-1 focus-within:ring-sky-400/20"
          : "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
    }`}>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={yearRef} type="text" value={yearStr} onChange={(e) => { const next = e.target.value; if (!/^-?\d*$/.test(next)) return; if (next && next !== "-" && (Number(next) < MIN_WIDE_YEAR || Number(next) > MAX_WIDE_YEAR)) return; updateParts(next, monthStr, dayStr); notifyDraft(next, monthStr, dayStr); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (["/", ".", "Enter"].includes(e.key)) { e.preventDefault(); monthRef.current?.focus(); } }} onBlur={handleBlur} placeholder="წელიწადი" inputMode="text" autoComplete="off" spellCheck={false} maxLength={6} aria-label={`${label} — წელიწადი`} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.85rem,2.6vw,1.15rem)] font-bold font-mono tracking-tight text-white outline-none transition-colors placeholder:text-slate-400 placeholder:font-medium caret-sky-400 focus:border-sky-400/30 focus:bg-white/[0.02]" />
      </div>
      <span className="select-none px-0.5 text-lg font-black text-sky-400 sm:px-1 sm:text-xl">/</span>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={monthRef} type="text" value={monthStr} onChange={(e) => { const next = e.target.value; if (!/^\d*$/.test(next) || (next && Number(next) > 12)) return; updateParts(yearStr, next, dayStr); notifyDraft(yearStr, next, dayStr); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (["/", ".", "Enter"].includes(e.key)) { e.preventDefault(); normalizeMonthDraft(); dayRef.current?.focus(); } else if (e.key === "Backspace" && monthStr === "") yearRef.current?.focus(); }} onBlur={handleBlur} placeholder="თვე" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`${label} — თვე`} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.85rem,2.6vw,1.15rem)] font-bold font-mono tracking-tight text-white outline-none transition-colors placeholder:text-slate-400 placeholder:font-medium caret-sky-400 focus:border-sky-400/30 focus:bg-white/[0.02]" />
      </div>
      <span className="select-none px-0.5 text-lg font-black text-sky-400 sm:px-1 sm:text-xl">/</span>
      <div className="flex min-w-0 w-full items-center justify-center">
        <input ref={dayRef} type="text" value={dayStr} onChange={(e) => { const next = e.target.value; const year = Number(yearStr); const month = Number(monthStr); const maxDay = Number.isInteger(year) && month >= 1 && month <= 12 ? daysInWideMonth(year, month) : 31; if (!/^\d*$/.test(next) || (next && Number(next) > maxDay)) return; updateParts(yearStr, monthStr, next); notifyDraft(yearStr, monthStr, next); }} onFocus={handleFocus} onClick={(e) => e.currentTarget.select()} onKeyDown={(e) => { if (e.key === "Backspace" && dayStr === "") monthRef.current?.focus(); }} onBlur={handleBlur} placeholder="რიცხვი" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={2} aria-label={`${label} — რიცხვი`} className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.85rem,2.6vw,1.15rem)] font-bold font-mono tracking-tight text-white outline-none transition-colors placeholder:text-slate-400 placeholder:font-medium caret-sky-400 focus:border-sky-400/30 focus:bg-white/[0.02]" />
      </div>
      <div ref={calendarRef} className="relative flex shrink-0 items-center gap-1.5">
        <button type="button" onClick={goToToday} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[0.62rem] font-bold text-slate-300 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white cursor-pointer" aria-label="ახლა-ზე გადასვლა">
          ახლა
        </button>
        <button type="button" onClick={toggleCalendar} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sky-300 shadow-sm transition-colors hover:border-sky-400/50 hover:bg-sky-500/15 cursor-pointer" aria-label={`${label} — კალენდრის გახსნა`} aria-expanded={calendarOpen}>
          <Calendar className="h-4 w-4 text-sky-400" aria-hidden="true" />
        </button>

        {calendarOpen && calendarPosition && typeof document !== "undefined" && createPortal(
          <div ref={calendarPopupRef} style={{ position: "fixed", top: calendarPosition.top, left: calendarPosition.left, width: calendarPosition.width, maxHeight: calendarPosition.maxHeight, overflowY: "auto", zIndex: 1000 }} className="calendar-popup rounded-3xl border border-white/20 bg-[#060813]/98 p-4 text-white shadow-[0_20px_70px_rgba(0,0,0,0.9)] ring-1 ring-sky-500/30 backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button type="button" onClick={() => moveCalendarMonth(-1)} className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white cursor-pointer" aria-label="წინა თვე"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={goToToday} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white cursor-pointer">ახლა</button>
              <button type="button" onClick={() => moveCalendarMonth(1)} className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white cursor-pointer" aria-label="შემდეგი თვე"><ChevronRight className="h-4 w-4" /></button>
            </div>

            <div className="mb-3 grid grid-cols-[1fr_auto] gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                წელი
                <input type="text" value={calendarYearDraft} onChange={(event) => { const next = event.target.value; if (!/^-?\d*$/.test(next)) return; setCalendarYearDraft(next); if (next && next !== "-") { const numeric = Number(next); if (numeric >= MIN_WIDE_YEAR && numeric <= MAX_WIDE_YEAR) setCalendarYear(numeric); } }} onBlur={() => setCalendarYearDraft(String(calendarYear))} className="calendar-popup-control mt-1 w-full rounded-xl border border-white/10 bg-[#070914] px-3 py-2 text-sm font-bold text-white outline-none focus:border-sky-400" inputMode="text" maxLength={6} />
              </label>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                თვე
                <select value={calendarMonth} onChange={(event) => setCalendarMonth(Number(event.target.value))} className="calendar-popup-control mt-1 rounded-xl border border-white/10 bg-[#070914] px-3 py-2 text-sm font-bold text-white outline-none focus:border-sky-400">
                  {Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1} className="bg-[#070914] text-white">{String(index + 1).padStart(2, "0")}</option>)}
                </select>
              </label>
            </div>

            <div className="calendar-weekdays mb-2 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
              {['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: calendarLeadingDays }, (_, index) => <span key={`empty-${index}`} className="h-8" />)}
              {calendarDays.map((day) => {
                const selected = selectedDate?.year === calendarYear && selectedDate.month === calendarMonth && selectedDate.day === day;
                return <button key={day} type="button" onClick={() => selectCalendarDate(calendarYear, calendarMonth, day)} className={`calendar-day-option h-8 rounded-xl text-xs font-bold transition cursor-pointer ${selected ? "is-selected bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] font-black" : "text-slate-200 hover:bg-sky-400/15 hover:text-white"}`}>{String(day).padStart(2, "0")}</button>;
              })}
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );

  if (hideHeader) return editor;
  return <div className="flex min-w-0 w-full flex-1 flex-col gap-2 text-left"><div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1"><label className="text-xs font-bold uppercase tracking-wider text-sky-300">{label}</label><span className="hidden text-xs font-semibold text-slate-400 sm:inline">წელი / თვე / რიცხვი</span></div>{editor}</div>;
}
