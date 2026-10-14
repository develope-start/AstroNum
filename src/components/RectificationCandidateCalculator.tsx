"use client";

import { useState } from "react";
import { Check, Clock, Plus, Trash2, Wand2 } from "lucide-react";
import { eclipticToSign } from "@/lib/astro/signs";
import type { RectificationEventType, RectificationResult } from "@/lib/astro/rectification";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";

interface LifeEvent {
  id: string;
  type: RectificationEventType;
  date: string;
}

const EVENT_TYPES: Array<{ id: RectificationEventType; label: string; ruler: string }> = [
  { id: "marriage", label: "ქორწინება / სერიოზული კავშირი", ruler: "ვენერა და VII სახლი" },
  { id: "child", label: "შვილის დაბადება", ruler: "მთვარე და V სახლი" },
  { id: "career", label: "კარიერული ნახტომი / ახალი პოზიცია", ruler: "MC, მზე და X სახლი" },
  { id: "relocation", label: "საცხოვრებლის შეცვლა / ემიგრაცია", ruler: "IC, მთვარე და IV სახლი" },
  { id: "graduation", label: "უნივერსიტეტის დასრულება / დიპლომი", ruler: "მერკური და IX სახლი" },
  { id: "crisis", label: "მნიშვნელოვანი კრიზისი / ოპერაცია", ruler: "მარსი, სატურნი და ASC" },
];

const ASPECT_LABELS: Record<string, string> = {
  conjunction: "შეერთება",
  sextile: "სექსტილი",
  square: "კვადრატი",
  trine: "ტრინი",
  opposition: "ოპოზიცია",
};

function pointLabel(value: string) {
  return ({
    ASC: "ASC",
    DSC: "DSC",
    MC: "MC",
    IC: "IC",
    "House 4": "IV სახლი",
    "House 5": "V სახლი",
    "House 7": "VII სახლი",
    "House 9": "IX სახლი",
    "House 10": "X სახლი",
  } as Record<string, string>)[value] ?? value;
}

function formatZodiac(longitude: number) {
  const position = eclipticToSign(longitude);
  return `${position.degreeInSign.toFixed(2)}° ${position.signName}`;
}

function isRectificationResult(value: unknown): value is RectificationResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<RectificationResult>;
  return result.method === "solar_arc_event_correlation"
    && (result.status === "candidate_found" || result.status === "no_clear_match")
    && Number.isInteger(result.scannedCandidates)
    && Number.isInteger(result.uncertaintyMinutes)
    && Array.isArray(result.candidates);
}

export default function RectificationCandidateCalculator() {
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [uncertaintyMinutes, setUncertaintyMinutes] = useState(30);
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RectificationResult | null>(null);

  const addEvent = () => {
    setEvents((current) => [...current, {
      id: crypto.randomUUID(),
      type: "career",
      date: "",
    }]);
  };

  const removeEvent = (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  const updateEvent = (id: string, field: "type" | "date", value: string) => {
    setEvents((current) => current.map((event) =>
      event.id === id ? { ...event, [field]: value } : event,
    ));
  };

  const calculateRectification = async () => {
    if (!birth.date || !birth.time || birth.lat === null || birth.lon === null || !birth.timezone) {
      setError("გთხოვთ მიუთითოთ დაბადების თარიღი, დრო და რუკიდან/შემოთავაზებული სიიდან არჩეული ადგილი.");
      return;
    }
    if (events.length < 3 || events.some((event) => !event.date)) {
      setError("დაამატეთ მინიმუმ 3 მნიშვნელოვანი მოვლენა და თითოეულის ზუსტი თარიღი.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/chart/rectification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth: {
            name: birth.name || "მაძიებელი",
            date: birth.date,
            time: birth.time,
            place: birth.place,
            lat: birth.lat,
            lon: birth.lon,
            timezone: birth.timezone,
          },
          uncertaintyMinutes,
          events: events.map(({ type, date }) => ({ type, date })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "რექტიფიკაციის გამოთვლა ვერ შესრულდა.");
        return;
      }
      if (!isRectificationResult(data.result)) {
        setError("სერვერისგან რექტიფიკაციის მოსალოდნელი შედეგი ვერ მივიღეთ.");
        return;
      }
      setResult(data.result);
    } catch {
      setError("ქსელთან დაკავშირება ვერ მოხერხდა. სცადეთ მოგვიანებით.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-full space-y-6 text-left">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-950/20 p-4 text-xs leading-relaxed text-amber-100">
        რექტიფიკაცია ასტროლოგიური ინტერპრეტაციის მეთოდია და დაბადების დადასტურებულ დროს ვერ ადგენს.
        შედეგი აჩვენებს მხოლოდ მითითებულ მოვლენებთან შედარებულ Solar Arc კანდიდატებს — არა ალბათობას,
        გარანტიას ან პროფესიონალის მიერ დადასტურებულ დროს.
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-6">
          <BirthFields value={birth} onChange={setBirth} legend="01. სავარაუდო დაბადების მონაცემები" />

          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#090d1e]/85 p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                02. დროის ცდომილების დიაპაზონი
              </span>
              <span className="rounded-full border border-cyan-500/20 bg-cyan-950/40 px-2.5 py-1 font-mono text-xs font-semibold text-cyan-300">
                ± {uncertaintyMinutes} წუთი
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={uncertaintyMinutes}
              onChange={(event) => setUncertaintyMinutes(Number(event.target.value))}
              className="w-full cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-400">
              ყოველი წუთი დიაპაზონში ცალ-ცალკე გამოითვლება. უფრო დიდი დიაპაზონი მეტ დროს მოითხოვს.
            </p>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-6">
          <div className="rounded-2xl border border-white/10 bg-[#090d1e]/85 p-5 shadow-xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-white sm:text-base">
                  03. ცხოვრებისეული მოვლენები
                </h3>
                <p className="mt-1 text-[11px] text-slate-400">
                  საჭიროა მინიმუმ 3 რეალური, განსხვავებული თარიღი
                </p>
              </div>
              <button
                type="button"
                onClick={addEvent}
                disabled={events.length >= 10}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-950/40 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-900/50 disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>მოვლენის დამატება</span>
              </button>
            </div>

            {events.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-400">
                დაამატეთ თქვენს ცხოვრებაში მომხდარი მნიშვნელოვანი მოვლენები და მათი თარიღები.
              </p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {events.map((event) => {
                  const eventType = EVENT_TYPES.find((item) => item.id === event.type)!;
                  return (
                    <div key={event.id} className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <select
                          value={event.type}
                          onChange={(inputEvent) => {
                            const type = EVENT_TYPES.find((item) => item.id === inputEvent.target.value)?.id;
                            if (type) updateEvent(event.id, "type", type);
                          }}
                          aria-label="მოვლენის ტიპი"
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#070a16] p-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
                        >
                          {EVENT_TYPES.map((item) => (
                            <option key={item.id} value={item.id} className="bg-[#070a16]">{item.label}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={event.date}
                          onChange={(inputEvent) => updateEvent(event.id, "date", inputEvent.target.value)}
                          aria-label="მოვლენის თარიღი"
                          className="w-[138px] shrink-0 rounded-lg border border-white/10 bg-[#070a16] p-2 text-xs text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeEvent(event.id)}
                          aria-label="მოვლენის წაშლა"
                          className="shrink-0 p-1.5 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">{eventType.ruler}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-200">{error}</p>}

            <button
              type="button"
              onClick={calculateRectification}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/35 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>თითოეული დროის კანდიდატი გამოითვლება...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>Solar Arc კანდიდატების შედარება</span>
                </>
              )}
            </button>
          </div>

          {result && (
            <section
              aria-live="polite"
              className={`rounded-2xl border p-5 shadow-2xl backdrop-blur-xl ${
                result.status === "candidate_found"
                  ? "border-emerald-500/30 bg-[#09151c]/90"
                  : "border-amber-500/30 bg-[#18130b]/90"
              }`}
            >
              <div className="flex items-start gap-3 border-b border-white/10 pb-3">
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${result.status === "candidate_found" ? "text-emerald-400" : "text-amber-300"}`} />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {result.status === "candidate_found"
                      ? "შეფასების კრიტერიუმებს დამთხვევა აქვს"
                      : "ამ დიაპაზონში მკაფიო დამთხვევა არ გამოვლინდა"}
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Solar Arc-ის 1-წუთიანი სკანირება · {result.scannedCandidates} კანდიდატი ·
                    {" "}±{result.uncertaintyMinutes} წთ
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
                დამთხვევის კრიტერიუმი: ჩამოთვლილი კუთხე/პლანეტისა და მოვლენის ტიპის შესაბამისი
                მაჟორული ასპექტი მაქსიმუმ 2° ორბით. ეს მხოლოდ რანჟირების ჰეურისტიკაა და არა
                სტატისტიკური სიზუსტე ან რეალური დაბადების დროის მტკიცებულება.
                მოვლენის ზუსტი დროის არქონისას გამოთვლა მის თარიღს დაბადების ადგილის დროის ზონაში შუადღედ მიიჩნევს.
              </p>

              <div className="mt-4 space-y-3">
                {result.candidates.map((candidate, index) => (
                  <article key={candidate.offsetMinutes} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">კანდიდატი {index + 1}</span>
                        <p className="font-mono text-2xl font-black text-white">{candidate.time}</p>
                        {candidate.date !== birth.date && <p className="text-[10px] text-slate-400">{candidate.date}</p>}
                      </div>
                      <div className="text-right text-[10px] text-slate-300">
                        <p>{candidate.matchedEventCount}/{events.length} მოვლენის დამთხვევა</p>
                        <p>საშუალო ორბი: {candidate.meanMatchedOrb === null ? "—" : `${candidate.meanMatchedOrb}°`}</p>
                        <p>ASC {formatZodiac(candidate.ascendant)} · MC {formatZodiac(candidate.mc)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBirth((current) => ({ ...current, date: candidate.date, time: candidate.time }))}
                        className="rounded-lg border border-cyan-400/30 px-3 py-2 text-[10px] font-semibold text-cyan-200 hover:bg-cyan-950/40"
                      >
                        ამ დროის გამოყენება
                      </button>
                    </div>
                    <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                      {candidate.eventMatches.map((match, matchIndex) => (
                        <li key={`${match.date}-${matchIndex}`} className="text-[10px] leading-relaxed text-slate-300">
                          <span className={match.matched ? "text-emerald-300" : "text-slate-500"}>
                            {match.matched ? "დამთხვევა" : "არ ემთხვევა"}
                          </span>
                          {" · "}{EVENT_TYPES.find((item) => item.id === match.type)?.label}
                          {" · "}{pointLabel(match.directedPoint)} {ASPECT_LABELS[match.aspect]} natal {pointLabel(match.natalPoint)}
                          {" · ორბი "}{match.orb}°
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
