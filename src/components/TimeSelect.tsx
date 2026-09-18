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
  onDraftChange,
}: {
  value: string;
  onChange: (hhmm: string) => void;
  onDraftChange?: (value: string) => void;
}) {
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef(false);
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerHour, setPickerHour] = useState(() => Number.isInteger(Number(parsed.hour)) && Number(parsed.hour) >= 0 && Number(parsed.hour) <= 23 ? Number(parsed.hour) : new Date().getHours());
  const [pickerMinute, setPickerMinute] = useState(() => Number.isInteger(Number(parsed.minute)) && Number(parsed.minute) >= 0 && Number(parsed.minute) <= 59 ? Number(parsed.minute) : new Date().getMinutes());

  useEffect(() => {
    if (editingRef.current) return;
    const next = parseTime(value);
    setHour(next.hour);
    setMinute(next.minute);
  }, [value]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [pickerOpen]);

  function focusField(event: React.FocusEvent<HTMLInputElement>) {
    editingRef.current = true;
    event.currentTarget.select();
  }

  function commit(nextHour = hour, nextMinute = minute) {
    if (!isCompleteTime(nextHour, nextMinute)) return;
    const formattedHour = nextHour.padStart(2, "0");
    const formattedMinute = nextMinute.padStart(2, "0");
    setHour(formattedHour);
    setMinute(formattedMinute);
    onChange(`${formattedHour}:${formattedMinute}`);
  }

  function notifyDraft(nextHour: string, nextMinute: string) {
    if (!onDraftChange) return;
    if (nextHour) onDraftChange(nextMinute ? `${nextHour}:${nextMinute}` : nextHour);
    else onDraftChange(nextMinute);
  }

  function finishEditing() {
    commit();
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active !== hourRef.current && active !== minuteRef.current) editingRef.current = false;
    }, 0);
  }

  function openPicker() {
    const currentHour = Number(hour);
    const currentMinute = Number(minute);
    setPickerHour(Number.isInteger(currentHour) && currentHour >= 0 && currentHour <= 23 ? currentHour : new Date().getHours());
    setPickerMinute(Number.isInteger(currentMinute) && currentMinute >= 0 && currentMinute <= 59 ? currentMinute : new Date().getMinutes());
    setPickerOpen(true);
  }

  function selectPickerHour(nextHour: number) {
    setPickerHour(nextHour);
    setHour(String(nextHour).padStart(2, "0"));
    notifyDraft(String(nextHour).padStart(2, "0"), minute);
  }

  function selectPickerMinute(nextMinute: number) {
    const nextHour = String(pickerHour).padStart(2, "0");
    const nextMinuteText = String(nextMinute).padStart(2, "0");
    setPickerMinute(nextMinute);
    setHour(nextHour);
    setMinute(nextMinuteText);
    editingRef.current = false;
    onChange(`${nextHour}:${nextMinuteText}`);
    setPickerOpen(false);
  }

  function selectCurrentTime() {
    const current = new Date();
    const nextHour = current.getHours();
    const nextMinute = current.getMinutes();
    const nextHourText = String(nextHour).padStart(2, "0");
    const nextMinuteText = String(nextMinute).padStart(2, "0");
    setPickerHour(nextHour);
    setPickerMinute(nextMinute);
    setHour(nextHourText);
    setMinute(nextMinuteText);
    editingRef.current = false;
    onChange(`${nextHourText}:${nextMinuteText}`);
    setPickerOpen(false);
  }

  const partial = hour === "" || minute === "" || hour === "0" || minute === "0";
  const valid = isCompleteTime(hour, minute);
  const border = valid
    ? "border-amber-500/25 focus-within:border-amber-400/70 focus-within:shadow-[0_0_18px_rgba(245,158,11,0.18)]"
    : partial
      ? "border-slate-500/50 focus-within:border-emerald-300/60"
      : "border-rose-500/50";

  return (
    <div className={`time-editor grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-1 rounded-xl border bg-[#080418] p-1.5 transition-all sm:min-h-[62px] sm:gap-2 sm:rounded-2xl sm:p-2.5 ${border}`}>
      <input
        ref={hourRef}
        type="text"
        value={hour}
        onChange={(e) => { const next = e.target.value; if (!/^\d*$/.test(next) || (next && Number(next) > 23)) return; setHour(next); notifyDraft(next, minute); }}
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
        className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono text-amber-300 outline-none transition-colors placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 focus:border-violet-300/25 focus:bg-white/[0.025]"
      />
      <span className="select-none text-lg font-black text-amber-300/80">:</span>
      <input
        ref={minuteRef}
        type="text"
        value={minute}
        onChange={(e) => { const next = e.target.value; if (!/^\d*$/.test(next) || (next && Number(next) > 59)) return; setMinute(next); notifyDraft(hour, next); }}
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
        className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono text-amber-300 outline-none transition-colors placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 focus:border-violet-300/25 focus:bg-white/[0.025]"
      />
      <div ref={pickerRef} className="time-picker-trigger relative flex shrink-0 items-center justify-center">
        <button type="button" onClick={openPicker} className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/35 bg-purple-950/60 text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-purple-900 sm:h-9 sm:w-9" aria-label="დროის არჩევა" aria-expanded={pickerOpen}>
          <Clock className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
        </button>

        {pickerOpen && (
          <div className="absolute right-0 top-full z-[80] mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-amber-400/35 bg-[#0a0422]/98 p-3 text-slate-200 shadow-[0_20px_70px_rgba(0,0,0,0.75)] ring-1 ring-purple-300/10 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">24-საათიანი დრო</span>
              <button type="button" onClick={selectCurrentTime} className="rounded-lg border border-slate-400/20 bg-slate-300/5 px-2.5 py-1 text-[0.65rem] font-bold text-slate-300 transition hover:border-amber-300/50 hover:bg-amber-400/10 hover:text-amber-200">ახლა</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1 text-center text-[0.6rem] font-bold uppercase tracking-wider text-slate-500">საათი</p>
                <div className="grid max-h-48 grid-cols-4 gap-1 overflow-y-auto rounded-xl border border-slate-500/20 bg-[#080418] p-1.5">
                  {Array.from({ length: 24 }, (_, index) => <button key={index} type="button" onClick={() => selectPickerHour(index)} className={`h-8 rounded-lg text-xs font-bold transition ${pickerHour === index ? "bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.35)]" : "text-slate-200 hover:bg-amber-400/15 hover:text-amber-200"}`}>{String(index).padStart(2, "0")}</button>)}
                </div>
              </div>
              <div>
                <p className="mb-1 text-center text-[0.6rem] font-bold uppercase tracking-wider text-slate-500">წუთი</p>
                <div className="grid max-h-48 grid-cols-4 gap-1 overflow-y-auto rounded-xl border border-slate-500/20 bg-[#080418] p-1.5">
                  {Array.from({ length: 60 }, (_, index) => <button key={index} type="button" onClick={() => selectPickerMinute(index)} className={`h-8 rounded-lg text-xs font-bold transition ${pickerMinute === index ? "bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.35)]" : "text-slate-200 hover:bg-amber-400/15 hover:text-amber-200"}`}>{String(index).padStart(2, "0")}</button>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
