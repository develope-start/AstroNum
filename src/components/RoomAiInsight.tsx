"use client";

import { useState } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";

type AnalysisType = "natal" | "career" | "love" | "karmic" | "question";

const MODES: Array<{ id: AnalysisType; label: string }> = [
  { id: "natal", label: "პიროვნული პროფილი" },
  { id: "career", label: "კარიერა" },
  { id: "love", label: "ურთიერთობები" },
  { id: "karmic", label: "სიმბოლური მიმართულება" },
  { id: "question", label: "ჩემი კითხვა" },
];

function renderText(text: string) {
  return text.split(/\n{2,}/).map((block, index) => {
    const heading = block.match(/^#{1,3}\s+(.+)$/);
    if (heading) return <h4 key={index} className="pt-2 text-base font-bold text-cyan-100">{heading[1]}</h4>;
    return <p key={index} className="whitespace-pre-line text-sm leading-7 text-slate-200">{block}</p>;
  });
}

export default function RoomAiInsight({ birth }: {
  birth: { name: string; date: string; time: string; place: string; lat: number | null; lon: number | null; timezone: string | null };
}) {
  const [mode, setMode] = useState<AnalysisType>("natal");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (birth.lat === null || birth.lon === null || !birth.timezone) {
      setError("AI ანალიზისთვის საჭიროა დაბადების ადგილის კოორდინატები და დროის სარტყელი.");
      return;
    }
    if (mode === "question" && !question.trim()) {
      setError("ჯერ ჩაწერეთ კონკრეტული კითხვა.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          name: birth.name || "მომხმარებელი",
          birthDate: birth.date,
          birthTime: birth.time || "12:00",
          birthPlace: birth.place || "მიუთითებელი არ არის",
          lat: birth.lat,
          lon: birth.lon,
          timezone: birth.timezone,
          question: mode === "question" ? question.trim() : undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.analysis !== "string") {
        setError(typeof data.error === "string" ? data.error : "Gemini AI-ის პასუხი ვერ მივიღეთ. სცადეთ მოგვიანებით.");
        return;
      }
      setResult(data.analysis);
      setProvider(typeof data.provider === "string" ? data.provider : "Gemini AI");
    } catch {
      setError("ქსელთან კავშირი ვერ მოხერხდა. სცადეთ მოგვიანებით.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="cr-glass cr-accent p-5 sm:p-6" aria-label="Gemini AI ანალიზი">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300"><Bot className="h-5 w-5" /></span>
          <div>
            <h3 className="text-base font-bold text-white">Gemini AI — დამატებითი ანალიზი</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">ინტერპრეტაცია ეფუძნება უკვე გამოთვლილ Swiss Ephemeris მონაცემებს; ის სიმბოლური, არადიაგნოსტიკური წაკითხვაა.</p>
          </div>
        </div>
        {provider && <span className="shrink-0 text-[11px] text-cyan-300">{provider}</span>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {MODES.map((item) => (
          <button key={item.id} type="button" onClick={() => setMode(item.id)} className={`cr-chip text-xs ${mode === item.id ? "cr-on font-bold" : ""}`}>
            {item.label}
          </button>
        ))}
      </div>

      {mode === "question" && (
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} maxLength={2000}
          placeholder="დაწერეთ კითხვა ამ რუკასთან დაკავშირებით…"
          className="mt-4 w-full resize-y rounded-xl border border-white/15 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/70" />
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={generate} disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950/40 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Gemini ამუშავებს რუკას…" : "AI ანალიზის შექმნა"}
        </button>
        <span className="text-[11px] text-slate-500">შესაძლოა მოითხოვოს თქვენს პაკეტზე AI წვდომა.</span>
      </div>

      {error && <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-950/20 p-3 text-xs leading-5 text-rose-200">{error}</p>}
      {result && <div className="mt-5 space-y-4 border-t border-white/10 pt-5">{renderText(result)}</div>}
    </section>
  );
}
