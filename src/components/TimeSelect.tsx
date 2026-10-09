"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";

interface TimeParts {
  hour: string;
  minute: string;
}

interface PopupPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
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
  const pickerPopupRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef(false);
  const parsed = parseTime(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<PopupPosition | null>(null);
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
      const target = event.target as Node;
      if (!pickerRef.current?.contains(target) && !pickerPopupRef.current?.contains(target)) setPickerOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) {
      setPickerPosition(null);
      return;
    }

    const updatePosition = () => {
      const trigger = pickerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 8;
      const width = Math.min(288, Math.max(0, window.innerWidth - viewportPadding * 2));
      const popupHeight = pickerPopupRef.current?.getBoundingClientRect().height ?? 310;
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
      setPickerPosition({ top, left, width, maxHeight: availableHeight });
    };

    const animationFrame = window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 640px)").matches) {
        pickerRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
      updatePosition();
    });

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [pickerOpen]);

  function notifyDraft(h: string, m: string) {
    if (!onDraftChange) return;
    const cleanHour = h.trim();
    const cleanMinute = m.trim();
    if (!cleanHour && !cleanMinute) {
      onDraftChange("");
      return;
    }
    const safeHour = cleanHour ? cleanHour.padStart(2, "0") : "12";
    const safeMinute = cleanMinute ? cleanMinute.padStart(2, "0") : "00";
    onDraftChange(`${safeHour}:${safeMinute}`);
  }

  function commitValue(h: string, m: string) {
    if (isCompleteTime(h, m)) {
      const normalizedHour = h.padStart(2, "0");
      const normalizedMinute = m.padStart(2, "0");
      setHour(normalizedHour);
      setMinute(normalizedMinute);
      setPickerHour(Number(normalizedHour));
      setPickerMinute(Number(normalizedMinute));
      onChange(`${normalizedHour}:${normalizedMinute}`);
    }
  }

  function focusField(event: React.FocusEvent<HTMLInputElement>) {
    editingRef.current = true;
    event.currentTarget.select();
  }

  function finishEditing() {
    window.setTimeout(() => {
      const active = document.activeElement;
      if (active === hourRef.current || active === minuteRef.current) return;
      editingRef.current = false;
      commitValue(hour, minute);
    }, 0);
  }

  function togglePicker() {
    if (pickerOpen) {
      setPickerOpen(false);
      return;
    }
    const current = parseTime(value);
    const validHour = Number.isInteger(Number(current.hour)) && Number(current.hour) >= 0 && Number(current.hour) <= 23;
    const validMinute = Number.isInteger(Number(current.minute)) && Number(current.minute) >= 0 && Number(current.minute) <= 59;
    const fallbackDate = new Date();
    const nextHour = validHour ? Number(current.hour) : fallbackDate.getHours();
    const nextMinute = validMinute ? Number(current.minute) : fallbackDate.getMinutes();
    setPickerHour(nextHour);
    setPickerMinute(nextMinute);
    if (!isCompleteTime(current.hour, current.minute)) {
      const nextHourText = String(nextHour).padStart(2, "0");
      const nextMinuteText = String(nextMinute).padStart(2, "0");
      setHour(nextHourText);
      setMinute(nextMinuteText);
      onChange(`${nextHourText}:${nextMinuteText}`);
    }
    setPickerOpen(true);
  }

  function selectPickerHour(nextHour: number) {
    setPickerHour(nextHour);
    const nextHourText = String(nextHour).padStart(2, "0");
    const nextMinuteText = (minute || String(pickerMinute)).padStart(2, "0");
    setHour(nextHourText);
    setMinute(nextMinuteText);
    editingRef.current = false;
    onChange(`${nextHourText}:${nextMinuteText}`);
  }

  function selectPickerMinute(nextMinute: number) {
    setPickerMinute(nextMinute);
    const nextHourText = (hour || String(pickerHour)).padStart(2, "0");
    const nextMinuteText = String(nextMinute).padStart(2, "0");
    setHour(nextHourText);
    setMinute(nextMinuteText);
    editingRef.current = false;
    onChange(`${nextHourText}:${nextMinuteText}`);
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
    ? "border-sky-400/40 focus-within:border-sky-400 focus-within:shadow-[0_0_25px_rgba(56,189,248,0.25)]"
    : partial
      ? "border-white/10 focus-within:border-sky-400/60"
      : "border-rose-500/50";

  return (
    <div className={`time-editor grid min-h-[54px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-1 rounded-2xl border bg-[#070914] p-2 shadow-inner transition-all sm:min-h-[60px] sm:gap-2 sm:p-2.5 ${border}`}>
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
        className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.85rem,2.6vw,1.15rem)] font-bold font-mono text-white outline-none transition-colors placeholder:text-slate-400 placeholder:font-medium caret-sky-400 focus:border-sky-400/30 focus:bg-white/[0.02]"
      />
      <span className="select-none text-lg font-black text-sky-400">:</span>
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
        className="w-full min-w-0 rounded-lg border border-transparent bg-transparent px-0 text-center text-[clamp(0.85rem,2.6vw,1.15rem)] font-bold font-mono text-white outline-none transition-colors placeholder:text-slate-400 placeholder:font-medium caret-sky-400 focus:border-sky-400/30 focus:bg-white/[0.02]"
      />
      <div ref={pickerRef} className="time-picker-trigger relative flex shrink-0 items-center justify-center">
        <button type="button" onClick={togglePicker} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sky-300 shadow-sm transition-colors hover:border-sky-400/50 hover:bg-sky-500/15 cursor-pointer" aria-label="დროის არჩევა" aria-expanded={pickerOpen}>
          <Clock className="h-4 w-4 text-sky-400" aria-hidden="true" />
        </button>

        {pickerOpen && pickerPosition && typeof document !== "undefined" && createPortal(
          <div ref={pickerPopupRef} style={{ position: "fixed", top: pickerPosition.top, left: pickerPosition.left, width: pickerPosition.width, maxHeight: pickerPosition.maxHeight, overflowY: "auto", zIndex: 1000 }} className="time-picker-popup rounded-3xl border border-white/20 bg-[#060813]/98 p-4 text-white shadow-[0_20px_70px_rgba(0,0,0,0.9)] ring-1 ring-sky-500/30 backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">24-საათიანი დრო</span>
              <button type="button" onClick={selectCurrentTime} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-400/10 hover:text-white cursor-pointer">ახლა</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-300">საათი</p>
                <div className="time-picker-grid grid max-h-48 grid-cols-4 gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#070914] p-2">
                  {Array.from({ length: 24 }, (_, index) => <button key={index} type="button" onClick={() => selectPickerHour(index)} className={`time-picker-option h-8 rounded-xl text-xs font-bold transition cursor-pointer ${pickerHour === index ? "is-selected bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] font-black" : "text-slate-200 hover:bg-sky-400/15 hover:text-white"}`}>{String(index).padStart(2, "0")}</button>)}
                </div>
              </div>
              <div>
                <p className="mb-1 text-center text-xs font-bold uppercase tracking-wider text-slate-300">წუთი</p>
                <div className="time-picker-grid grid max-h-48 grid-cols-4 gap-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#070914] p-2">
                  {Array.from({ length: 60 }, (_, index) => <button key={index} type="button" onClick={() => selectPickerMinute(index)} className={`time-picker-option h-8 rounded-xl text-xs font-bold transition cursor-pointer ${pickerMinute === index ? "is-selected bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] font-black" : "text-slate-200 hover:bg-sky-400/15 hover:text-white"}`}>{String(index).padStart(2, "0")}</button>)}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
}
