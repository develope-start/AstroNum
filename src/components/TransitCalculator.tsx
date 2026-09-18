"use client";

import { useEffect, useState, useRef } from "react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import InterpretationText from "./InterpretationText";
import { saveGuestCache, loadGuestCache, validateGuestCache } from "@/lib/guestCache";
import { useMe } from "@/lib/useMe";
import { getRequestError, readApiResponse } from "@/lib/apiResponse";
import { Sparkles, Bookmark, Loader2, CheckCircle2, AlertCircle, Calendar, Clock, Info } from "lucide-react";
import { compareWideDates, formatWideDate, isWideDate, parseWideDate } from "@/lib/astro/wideDate";

interface CacheShape {
  birth: BirthValue;
  transitDate: string;
  transitStartDate?: string;
  transitEndDate?: string;
  inputMode?: "date" | "interval";
  interpretation: string;
  mapNumber?: string | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type TransitInputMode = "date" | "interval";

interface WideDateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  onActivate?: () => void;
}

function WideDateInput({ label, value, onChange, autoFocus = false, disabled = false, onActivate }: WideDateInputProps) {
  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);

  const parsed = parseWideDate(value);
  const [yearStr, setYearStr] = useState(() => (parsed ? (parsed.year < 0 ? `-${String(Math.abs(parsed.year)).padStart(4, "0")}` : String(parsed.year).padStart(4, "0")) : ""));
  const [monthStr, setMonthStr] = useState(() => (parsed ? String(parsed.month).padStart(2, "0") : ""));
  const [dayStr, setDayStr] = useState(() => (parsed ? String(parsed.day).padStart(2, "0") : ""));

  const nativeValue = parsed && parsed.year >= 1 && parsed.year <= 9999 ? value : "";
  const isValid = isWideDate(`${yearStr}-${monthStr}-${dayStr}`) && isWideDate(value);

  // Synchronize internal segment inputs when `value` prop changes externally
  useEffect(() => {
    if (editingRef.current) return;
    const p = parseWideDate(value);
    if (p) {
      const yStr = p.year < 0 ? `-${String(Math.abs(p.year)).padStart(4, "0")}` : String(p.year).padStart(4, "0");
      const mStr = String(p.month).padStart(2, "0");
      const dStr = String(p.day).padStart(2, "0");
      setYearStr(yStr);
      setMonthStr(mStr);
      setDayStr(dStr);
    } else if (!value) {
      setYearStr("");
      setMonthStr("");
      setDayStr("");
    }
  }, [value]);

  function tryEmit(y: string, m: string, d: string) {
    setYearStr(y);
    setMonthStr(m);
    setDayStr(d);
  }

  function handleYearChange(val: string) {
    if (!/^-?\d*$/.test(val)) return;
    tryEmit(val, monthStr, dayStr);
  }

  function handleMonthChange(val: string) {
    if (!/^\d*$/.test(val)) return;
    tryEmit(yearStr, val, dayStr);
  }

  function handleDayChange(val: string) {
    if (!/^\d*$/.test(val)) return;
    tryEmit(yearStr, monthStr, val);
  }

  function handleNativeChange(next: string) {
    const nextParts = parseWideDate(next);
    if (nextParts) {
      setYearStr(String(nextParts.year));
      setMonthStr(String(nextParts.month).padStart(2, "0"));
      setDayStr(String(nextParts.day).padStart(2, "0"));
      editingRef.current = false;
      onChange(next);
    }
  }

  function handleBlur() {
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    if (!isNaN(yearNum) && !isNaN(monthNum) && !isNaN(dayNum)) {
      const p = parseWideDate(formatWideDate({ year: yearNum, month: monthNum, day: dayNum }));
      if (p) {
        const normY = p.year < 0 ? `-${String(Math.abs(p.year)).padStart(4, "0")}` : String(p.year).padStart(4, "0");
        const normM = String(p.month).padStart(2, "0");
        const normD = String(p.day).padStart(2, "0");
        setYearStr(normY);
        setMonthStr(normM);
        setDayStr(normD);
        onChange(formatWideDate(p));
      }
    }
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (![yearRef.current, monthRef.current, dayRef.current].includes(activeElement as HTMLInputElement | null)) {
        editingRef.current = false;
      }
    }, 0);
  }

  function handleFocus(event: React.FocusEvent<HTMLInputElement>) {
    editingRef.current = true;
    onActivate?.();
    event.currentTarget.select();
  }

  return (
    <div className="flex min-w-0 w-full flex-1 flex-col gap-2 text-left">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1">
        <label className="text-[0.72rem] font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <span>{label}</span>
        </label>
        <span className="hidden text-[0.65rem] font-semibold text-slate-400/80 sm:inline">წელიწადი / თვე / რიცხვი</span>
      </div>

      <div
        className={`relative grid min-h-[54px] w-full min-w-0 grid-cols-[minmax(0,1.55fr)_auto_minmax(0,0.8fr)_auto_minmax(0,0.95fr)_auto] items-center gap-1 rounded-xl border bg-gradient-to-b from-[#130a35] via-[#09041b] to-[#0d0626] p-1.5 shadow-lg transition-all duration-300 sm:min-h-[62px] sm:gap-2 sm:rounded-2xl sm:p-2.5 ${
          isValid
            ? "border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)] focus-within:border-amber-400 focus-within:shadow-[0_0_35px_rgba(245,158,11,0.5)] focus-within:ring-2 focus-within:ring-amber-500/30"
            : "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
        }`}
      >
        {/* Year segment */}
        <div className="flex min-w-0 w-full items-center justify-center">
          <input
            ref={yearRef}
            type="text"
            value={yearStr}
            onChange={(e) => handleYearChange(e.target.value)}
            onFocus={handleFocus}
            onClick={(event) => event.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "/" || e.key === "." || e.key === "Enter") {
                e.preventDefault();
                monthRef.current?.focus();
              }
            }}
            onBlur={handleBlur}
            placeholder="წელიწადი"
            autoFocus={autoFocus}
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            maxLength={6}
            disabled={disabled}
            aria-label={`${label} — წელიწადი`}
            className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]"
          />
        </div>

        {/* Separator 1 */}
        <span className="select-none px-0.5 text-lg font-black text-amber-300/80 sm:px-1 sm:text-xl">/</span>

        {/* Month segment */}
        <div className="flex min-w-0 w-full items-center justify-center">
          <input
            ref={monthRef}
            type="text"
            value={monthStr}
            onChange={(e) => handleMonthChange(e.target.value)}
            onFocus={handleFocus}
            onClick={(event) => event.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "/" || e.key === "." || e.key === "Enter") {
                e.preventDefault();
                dayRef.current?.focus();
              } else if (e.key === "Backspace" && monthStr === "") {
                yearRef.current?.focus();
              }
            }}
            onBlur={handleBlur}
            placeholder="თვე"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            maxLength={2}
            disabled={disabled}
            aria-label={`${label} — თვე`}
            className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]"
          />
        </div>

        {/* Separator 2 */}
        <span className="select-none px-0.5 text-lg font-black text-amber-300/80 sm:px-1 sm:text-xl">/</span>

        {/* Day segment */}
        <div className="flex min-w-0 w-full items-center justify-center">
          <input
            ref={dayRef}
            type="text"
            value={dayStr}
            onChange={(e) => handleDayChange(e.target.value)}
            onFocus={handleFocus}
            onClick={(event) => event.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && dayStr === "") {
                monthRef.current?.focus();
              }
            }}
            onBlur={handleBlur}
            placeholder="რიცხვი"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            maxLength={2}
            disabled={disabled}
            aria-label={`${label} — რიცხვი`}
            className="w-full min-w-0 bg-transparent px-0 text-center text-[clamp(0.78rem,2.6vw,1.125rem)] font-black font-mono tracking-tight text-amber-300 outline-none placeholder:text-slate-400/70 placeholder:font-medium caret-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]"
          />
        </div>

        {/* Calendar Picker Trigger */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/35 bg-purple-950/60 pl-0.5 text-amber-300 shadow-sm transition-colors hover:border-amber-300 hover:bg-purple-900 sm:h-9 sm:w-9">
          <Calendar className="pointer-events-none h-4 w-4 text-amber-300 sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
          <input
            type="date"
            value={nativeValue}
            min="0001-01-01"
            max="9999-12-31"
            onChange={(event) => handleNativeChange(event.target.value)}
            onFocus={handleFocus}
            disabled={disabled}
            aria-label={`${label} — კალენდრით არჩევა`}
            title="კალენდრით არჩევა / სქროლვა; ძველი წელთაღრიცხვისთვის გამოიყენეთ ხელით ჩაწერილი წელი"
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
}

export default function TransitCalculator() {
  const me = useMe();
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [transitDate, setTransitDate] = useState(today());
  const [transitStartDate, setTransitStartDate] = useState(today());
  const [transitEndDate, setTransitEndDate] = useState(offsetDays(7));
  const [inputMode, setInputMode] = useState<TransitInputMode>("date");
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [mapNumber, setMapNumber] = useState<string | null>(null);

  useEffect(() => {
    const cached = loadGuestCache<CacheShape>("transit");
    if (!cached) return;
    validateGuestCache("transit").then((active) => {
      if (!active) {
        setBirth(EMPTY_BIRTH);
        setTransitDate(today());
        setTransitStartDate(today());
        setTransitEndDate(offsetDays(7));
        setInputMode("date");
        setInterpretation(null);
        setMapNumber(null);
        return;
      }
      setBirth(cached.birth);
      setTransitDate(cached.transitDate);
      setTransitStartDate(cached.transitStartDate ?? cached.transitDate);
      setTransitEndDate(cached.transitEndDate ?? cached.transitDate);
      setInputMode("date");
      setInterpretation(cached.interpretation);
      setMapNumber(cached.mapNumber ?? null);
    });
  }, []);

  async function calculate(save = false) {
    if (!birth.name || !birth.date || !birth.time || birth.lat === null || birth.timezone === null) {
      setError("შეავსეთ დაბადების მონაცემები და დაადასტურეთ ადგილის მოძებნა.");
      return;
    }
    const selectedMode = inputMode ?? "date";
    const calculationDate = selectedMode === "interval" ? transitStartDate : transitDate;
    const calculationStartDate = selectedMode === "interval" ? transitStartDate : transitDate;
    const calculationEndDate = selectedMode === "interval" ? transitEndDate : transitDate;
    if (!isWideDate(calculationStartDate) || !isWideDate(calculationEndDate)) {
      setError(selectedMode === "interval" ? "ინტერვალში მიუთითეთ სწორი საწყისი და საბოლოო თარიღები." : "მიუთითეთ სწორი ტრანზიტის თარიღი.");
      return;
    }
    if (compareWideDates(calculationStartDate, calculationEndDate) > 0) {
      setError("ტრანზიტის ინტერვალის „დან“ თარიღი უნდა იყოს „მდე“ თარიღზე ადრე ან იგივე.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chart/transit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          natal: {
            name: birth.name,
            date: birth.date,
            time: birth.time,
            place: birth.place,
            lat: birth.lat,
            lon: birth.lon,
            timezone: birth.timezone,
          },
          transitDate: calculationDate,
          transitStartDate: calculationStartDate,
          transitEndDate: calculationEndDate,
          save,
        }),
      });
      const data = await readApiResponse(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setInterpretation(data.interpretation);
      setMapNumber(data.mapNumber ?? null);
      if (save) setSaved(true);
      else saveGuestCache<CacheShape>("transit", { birth, transitDate: calculationDate, transitStartDate: calculationStartDate, transitEndDate: calculationEndDate, inputMode: selectedMode, interpretation: data.interpretation, mapNumber: data.mapNumber ?? null });
    } catch (error) {
      setError(getRequestError(error));
    } finally {
      setLoading(false);
    }
  }

  function activateMode(mode: TransitInputMode) {
    setInputMode(mode);
    setError(null);
  }

  return (
    <div className="mx-auto w-full max-w-full space-y-4 sm:space-y-6 text-center overflow-x-hidden">
      <div className="grid w-full min-w-0 gap-4 text-center sm:gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="relative z-30 min-w-0 w-full text-center lg:col-span-7">
          <BirthFields value={birth} onChange={setBirth} legend="01. ნატალური მონაცემები" />
        </div>

        <div className="glass-panel relative z-10 flex min-w-0 w-full flex-col justify-center space-y-5 overflow-hidden rounded-2xl border-amber-500/25 bg-gradient-to-r from-[#120833]/90 via-[#0e0728]/95 to-[#120833]/90 p-4 text-center shadow-xl backdrop-blur-2xl sm:rounded-[28px] sm:p-7 lg:col-span-5 lg:h-full">
          <div
            className={`mx-auto w-full max-w-2xl space-y-3 rounded-2xl border border-purple-400/20 bg-purple-950/25 p-3.5 text-left transition-all sm:p-4 ${
              inputMode === "interval" ? "transit-board-active" : "opacity-[0.45] grayscale"
            }`}
            onPointerDown={() => inputMode !== "interval" && activateMode("interval")}
            aria-disabled={inputMode !== "interval"}
          >
            <div className="flex items-start justify-center gap-2 text-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-purple-300/30 bg-purple-500/15 text-purple-300">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის ინტერვალი</p>
                <p className="mx-auto mt-0.5 max-w-[34rem] text-[0.65rem] leading-relaxed text-slate-400">ძველი წელთაღრიცხვის 10 000 წლიდან ახალი წელთაღრიცხვის 10 000 წლამდე</p>
              </div>
            </div>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <WideDateInput label="დან" value={transitStartDate} onChange={setTransitStartDate} onActivate={() => activateMode("interval")} />
              <WideDateInput label="მდე" value={transitEndDate} onChange={setTransitEndDate} onActivate={() => activateMode("interval")} />
            </div>
            <p className="mx-auto max-w-xl text-center text-[0.65rem] leading-relaxed text-slate-500">შეგიძლიათ გამოიყენოთ კალენდრის ამოსქროლავი არჩევა ან პირდაპირ ჩაწეროთ თარიღი. ძველი წელთაღრიცხვისთვის გამოიყენეთ მინუსი, მაგალითად: -10000-01-01.</p>
          </div>

          <div
            className={`flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl p-1 transition-all ${
              inputMode === "date" ? "transit-board-active" : "opacity-[0.45] grayscale"
            }`}
            onPointerDown={() => inputMode !== "date" && activateMode("date")}
            aria-disabled={inputMode !== "date"}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-400">
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200">ტრანზიტის თარიღი:</label>
            </div>

            <WideDateInput label="გამოთვლის თარიღი" value={transitDate} onChange={setTransitDate} onActivate={() => activateMode("date")} />

            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold w-full pt-1">
              <button
                type="button"
                onClick={() => { activateMode("date"); setTransitDate(today()); }}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  transitDate === today()
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold"
                    : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
                }`}
              >
                დღეს
              </button>
              <button
                type="button"
                onClick={() => { activateMode("date"); setTransitDate(offsetDays(1)); }}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  transitDate === offsetDays(1)
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold"
                    : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
                }`}
              >
                ხვალ
              </button>
              <button
                type="button"
                onClick={() => { activateMode("date"); setTransitDate(offsetDays(7)); }}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  transitDate === offsetDays(7)
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40 font-bold"
                    : "bg-purple-950/40 text-slate-300 hover:text-amber-300 border border-purple-500/20"
                }`}
              >
                +1 კვირა
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => calculate(false)}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 px-6 text-xs sm:text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all hover:scale-[1.03] hover:shadow-[0_0_35px_rgba(245,158,11,0.65)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>ითვლის…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-slate-950" />
                  <span>✦ ტრანზიტების გამოთვლა</span>
                </>
              )}
            </button>

            {me && (
              <button
                onClick={() => calculate(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-purple-600/20 py-3 px-6 text-xs sm:text-sm font-bold text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.2)] transition-all hover:scale-[1.03] hover:border-amber-400 cursor-pointer"
              >
                <Bookmark className="h-4 w-4 text-amber-400" />
                <span>შენახვა</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3.5 text-xs font-semibold text-rose-300 shadow-lg justify-center">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3.5 text-xs font-semibold text-emerald-300 shadow-lg justify-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>✓ წარმატებით შენახულია კაბინეტში!</span>
        </div>
      )}

      {!me && interpretation && (
        <div className="flex items-start justify-center gap-2.5 rounded-2xl border border-amber-500/30 bg-purple-950/40 p-3.5 sm:p-4 text-xs font-medium text-slate-200 backdrop-blur-md text-center">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            დაურეგისტრირებელი მომხმარებელი — ეს შედეგი შენახული იქნება ამ მოწყობილობაზე 12 საათის განმავლობაში. მუდმივი
            შენახვისთვის გახსენით <a href="/cabinet" className="font-bold text-amber-300 underline decoration-amber-400/50">კაბინეტი</a>.
          </p>
        </div>
      )}

      {interpretation && (
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-8 shadow-2xl border-amber-500/25 bg-[#120833]/90 backdrop-blur-2xl text-left w-full">
          <p className="mb-4 text-xs font-bold tracking-wide text-amber-300">რუკის ნომერი: {mapNumber ?? "—"}</p>
          <InterpretationText text={interpretation} />
        </div>
      )}
    </div>
  );
}
