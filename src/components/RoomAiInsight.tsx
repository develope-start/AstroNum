"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";
import type { HouseSystem } from "@/lib/astro/positions";
import AiFormattedText from "./AiFormattedText";

type AnalysisType = "natal" | "career" | "love" | "karmic" | "question";

const MODES: Array<{ id: AnalysisType; label: string }> = [
  { id: "natal", label: "პიროვნული პროფილი" },
  { id: "career", label: "კარიერა" },
  { id: "love", label: "ურთიერთობები" },
  { id: "karmic", label: "სიმბოლური მიმართულება" },
  { id: "question", label: "ჩემი კითხვა" },
];

export default function RoomAiInsight({ birth, houseSystem }: {
  houseSystem: HouseSystem;
  birth: { name: string; date: string; time: string; place: string; lat: number | null; lon: number | null; timezone: string | null };
}) {
  const [mode, setMode] = useState<AnalysisType>("natal");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  function selectMode(nextMode: AnalysisType) {
    requestController.current?.abort();
    requestController.current = null;
    setMode(nextMode);
    setLoading(false);
    setResult(null);
    setProvider(null);
    setError(null);
    setNotice(null);
  }

  async function generate() {
    if (birth.lat === null || birth.lon === null || !birth.timezone) {
      setError("AI ანალიზისთვის საჭიროა დაბადების ადგილის კოორდინატები და დროის სარტყელი.");
      return;
    }
    if (mode === "question" && !question.trim()) {
      setError("ჯერ ჩაწერეთ კონკრეტული კითხვა.");
      return;
    }
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setResult(null);
    setProvider(null);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          type: mode,
          name: birth.name || "მომხმარებელი",
          birthDate: birth.date,
          birthTime: birth.time || "12:00",
          birthPlace: birth.place || "მიუთითებელი არ არის",
          lat: birth.lat,
          lon: birth.lon,
          timezone: birth.timezone,
          houseSystem,
          question: mode === "question" ? question.trim() : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (!response.ok || typeof data.analysis !== "string") {
        setError(typeof data.error === "string" ? data.error : "AI ინტერპრეტაცია ვერ მივიღეთ. სცადეთ მოგვიანებით.");
        return;
      }
      setResult(data.analysis);
      setProvider(typeof data.provider === "string" ? data.provider : "AI პროვაიდერი");
      setNotice(typeof data.notice === "string" ? data.notice : null);
    } catch {
      if (!controller.signal.aborted) {
        setError("ქსელთან კავშირი ვერ მოხერხდა. სცადეთ მოგვიანებით.");
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <section className="cr-glass cr-accent p-5 sm:p-6" aria-label="ხელოვნური ინტელექტით ინტერპრეტაცია">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300"><Bot className="h-5 w-5" /></span>
          <div>
            <h3 className="text-base font-bold text-white">ხელოვნური ინტელექტით სრული ინტერპრეტაცია</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              რუკის შედგენა ჯერ გამოთვლილ მონაცემებსა და ბიბლიოთეკის განმარტებებს აჩვენებს. ქვემოთ ღილაკით მიიღებთ ამ კონკრეტულ რუკაზე მორგებულ, ვრცელ AI ანალიზს.
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              გამოიყენება OpenRouter, ხოლო საჭიროებისას Groq. AI-ს გადაეცემა რუკის პოზიციები და თქვენ მიერ მითითებული შეკითხვა; Tavily მხოლოდ ვებ-ძიებისთვის გამოიყენება.
            </p>
          </div>
        </div>
        {provider && <span className="shrink-0 text-[11px] text-cyan-300">{provider}</span>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button key={item.id} type="button" onClick={() => selectMode(item.id)} aria-pressed={mode === item.id} className={`cr-chip text-xs ${mode === item.id ? "cr-on font-bold" : ""}`}>
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-cyan-100/80">არჩეული ფოკუსი: {MODES.find((item) => item.id === mode)?.label}. ახალი ფოკუსისთვის დააჭირეთ გენერირების ღილაკს.</p>

      {mode === "question" && (
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={2000}
          placeholder="დაწერეთ კითხვა ამ რუკასთან დაკავშირებით…"
          className="mt-4 w-full resize-y rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/70" />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={generate} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950/40 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "AI ამუშავებს რუკის მონაცემებს…" : "ხელოვნური ინტელექტით ინტერპრეტაცია"}
        </button>
        <span className="text-[11px] text-slate-500">საჭიროა ანგარიშში შესვლა და შესაბამისი პაკეტი.</span>
      </div>

      {error && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-950/20 p-3 text-xs leading-5 text-rose-200">{error}</p>}
      {result && (
        <div className="mt-5 border-t border-white/10 pt-5">
          <h4 className="mb-3 text-sm font-bold text-cyan-100">{MODES.find((item) => item.id === mode)?.label}</h4>
          {notice && <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100">{notice}</p>}
          <AiFormattedText text={result} />
        </div>
      )}
    </section>
  );
}
