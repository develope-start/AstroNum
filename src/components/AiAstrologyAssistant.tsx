"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Briefcase, Check, Copy, Flame, Heart, Loader2, MessageSquare, Orbit, Share2, Sparkles, Wand2 } from "lucide-react";
import BirthFields, { BirthValue, EMPTY_BIRTH } from "./BirthFields";
import AiFormattedText from "./AiFormattedText";

type AnalysisType = "natal" | "career" | "love" | "karmic" | "question";

const ANALYSIS_MODES: { id: AnalysisType; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: "natal", label: "პიროვნული პროფილი", icon: Sparkles, hint: "მზის, მთვარისა და ასცენდენტის ფსიქოლოგიური სინთეზი" },
  { id: "career", label: "კარიერა", icon: Briefcase, hint: "MC, მე-10, მე-2 და მე-6 სახლების თემები" },
  { id: "love", label: "ურთიერთობები", icon: Heart, hint: "ვენერა, მარსი, მთვარე და მე-7 სახლის თემები" },
  { id: "karmic", label: "კარმული მისია", icon: Orbit, hint: "ჩრდილოეთის კვანძი (Rahu), ქირონი და სულის ევოლუცია" },
  { id: "question", label: "შეკითხვა ასტროლოგს", icon: MessageSquare, hint: "დაუსვით კონკრეტული შეკითხვა თქვენს ნატალურ რუკაზე" },
];

export default function AiAstrologyAssistant() {
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [mode, setMode] = useState<AnalysisType>("natal");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teaserPreview, setTeaserPreview] = useState<{ mode: AnalysisType; name: string; planRequired?: boolean } | null>(null);
  const requestController = useRef<AbortController | null>(null);

  const activeMode = ANALYSIS_MODES.find((m) => m.id === mode) ?? ANALYSIS_MODES[0];

  useEffect(() => () => requestController.current?.abort(), []);

  function selectMode(nextMode: AnalysisType) {
    requestController.current?.abort();
    requestController.current = null;
    setMode(nextMode);
    setLoading(false);
    setResult(null);
    setProvider("");
    setError(null);
    setNotice(null);
    setTeaserPreview(null);
  }

  async function handleAnalyze() {
    if (!birth.date) {
      setError("გთხოვთ მიუთითოთ დაბადების თარიღი.");
      return;
    }
    if (birth.lat === null || birth.lon === null || !birth.timezone) {
      setError("აირჩიეთ დაბადების ადგილი შემოთავაზებული სიიდან ან მიუთითეთ რუკაზე.");
      return;
    }

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    setNotice(null);

    try {
      const res = await fetch("/api/ai/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          type: mode,
          name: birth.name || "მაძიებელი",
          birthDate: birth.date,
          birthTime: birth.time || "12:00",
          birthPlace: birth.place || "თბილისი",
          lat: birth.lat,
          lon: birth.lon,
          timezone: birth.timezone,
          question: mode === "question" ? question : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (controller.signal.aborted) return;
      if (res.status === 401 || data?.code === "AUTH_REQUIRED" || data?.code === "PLAN_REQUIRED") {
        setTeaserPreview({
          mode,
          name: birth.name || "მაძიებელი",
          planRequired: data?.code === "PLAN_REQUIRED",
        });
        setError(null);
        return;
      }
      if (!res.ok || data.error) {
        setError(data.error || "შეცდომა ანალიზის გენერირებისას");
        return;
      }
      if (typeof data.analysis !== "string" || !data.analysis.trim()
        || typeof data.provider !== "string" || !data.provider.trim()) {
        setError("სერვერმა AI პროვაიდერისა და ინტერპრეტაციის დადასტურებული შედეგი ვერ დააბრუნა.");
        return;
      }

      setResult(data.analysis);
      setProvider(data.provider);
      setNotice(typeof data.notice === "string" ? data.notice : null);
    } catch {
      if (!controller.signal.aborted) {
        setError("ქსელის შეცდომა. გთხოვთ სცადოთ მოგვიანებით.");
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  }

  const copyText = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-full space-y-6 text-left">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Side: Birth Fields & Mode Controls */}
        <div className="space-y-4 lg:col-span-5">
          <BirthFields value={birth} onChange={setBirth} legend="01. ასტროლოგიური ანალიზის მონაცემები" />

          {/* Mode Selector */}
          <div className="rounded-2xl border border-white/10 bg-[#090d1e]/85 p-5 shadow-xl backdrop-blur-xl">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              02. ანალიზის ფოკუსი
            </span>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {ANALYSIS_MODES.map((item) => {
                const Icon = item.icon;
                const isSelected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectMode(item.id)}
                    aria-pressed={isSelected}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/40 text-white shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                        : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        isSelected
                          ? "border-cyan-400/30 bg-cyan-500/20 text-cyan-300"
                          : "border-white/10 bg-white/[0.04] text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-200">{item.label}</span>
                      <span className="block text-[11px] text-slate-400 leading-tight mt-0.5">
                        {item.hint}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {mode === "question" && (
              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  თქვენი შეკითხვა ასტროლოგს
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="მაგ: რომელ სფეროში მელის უდიდესი წარმატება? რა გამოწვევები მაქვს მიმდინარე წელს?"
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-[#070a16] p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400"
                />
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-102 hover:shadow-cyan-500/35 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>AI ამუშავებს ციურ მონაცემებს...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  <span>AI ინტერპრეტაციის გენერირება</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: AI Output & Synthesis Display */}
        <div className="lg:col-span-7">
          <div className="relative min-h-[460px] rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0e1322]/90 to-[#070b14]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-950/50 text-cyan-300 shadow-inner">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white sm:text-lg">
                    ხელოვნური ინტელექტით ასტროლოგიური ანალიზი
                  </h3>
                  <span className="text-[11px] text-cyan-400/80 font-mono">
                    {provider || "პასუხის პროვაიდერი ჯერ არ არის დადასტურებული"}
                  </span>
                </div>
              </div>

              {result && (
                <button
                  type="button"
                  onClick={copyText}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">დაკოპირდა</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>კოპირება</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                  <Sparkles className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-cyan-300 animate-pulse" />
                </div>
                <p className="mt-6 font-display text-base font-bold text-white">
                  დაბადების რუკის გამოთვლა და ინტერპრეტაცია...
                </p>
                <p className="mt-1.5 max-w-sm text-xs text-slate-400">
                  მითითებული დროის ზონისა და კოორდინატების გათვალისწინებით
                </p>
              </div>
            ) : teaserPreview ? (
              <div className="py-8 text-center animate-in fade-in duration-300">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.35)]">
                  <Bot className="h-7 w-7 text-cyan-300 animate-pulse" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-bold text-cyan-300 shadow-md">
                  <span>ხელოვნური ინტელექტით ასტროლოგიური ანალიზი</span>
                </div>
                <h3 className="mt-3 font-display text-lg sm:text-xl font-black text-white">
                  {teaserPreview.name} · {activeMode.label}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  შეიყვანეთ მონაცემები და შესაბამისი პაკეტის შემთხვევაში შექმენით თქვენი რუკის პოზიციებზე დაფუძნებული სრული ქართული ინტერპრეტაცია.
                </p>

                <div className="relative mx-auto mt-6 max-w-lg rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-center">
                  <div className="filter blur-sm select-none opacity-40 text-xs text-slate-300 pointer-events-none space-y-2">
                    <p>თქვენი ნატალური რუკის მიხედვით, მზისა და ასცენდენტის კომბინაცია ქმნის უნიკალურ ლიდერულ პოტენციალს...</p>
                    <p>მე-10 სახლის მმართველის ასპექტები მიუთითებს მაღალ ინტელექტუალურ და სტრატეგიულ უნარებზე...</p>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 bg-[#0a0f1d]/85 backdrop-blur-xs rounded-2xl">
                    <p className="text-xs sm:text-sm font-extrabold text-white">
                      {teaserPreview.planRequired
                        ? "AI ინტერპრეტაცია ხელმისაწვდომია Pro ან Enterprise პაკეტით"
                        : "სრული AI ინტერპრეტაციის გასახსნელად შედით ანგარიშში"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
                      <a
                        href="/cabinet"
                        className="rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/30 hover:brightness-110 transition-all cursor-pointer"
                      >
                        ✦ AI ანალიზის გახსნა (ანგარიში)
                      </a>
                      <a
                        href="/#pricing"
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
                      >
                        პაკეტების ნახვა
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="mt-6 max-h-[550px] overflow-y-auto pr-2 text-sm leading-relaxed text-slate-200">
                {notice && <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100">{notice}</p>}
                <AiFormattedText text={result} className="text-sm leading-relaxed text-slate-200" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-400 mb-4 shadow-inner">
                  <Sparkles className="h-8 w-8 text-cyan-400/60" />
                </div>
                <h4 className="font-display text-base font-semibold text-slate-200">
                  მზად არის ანალიზისთვის
                </h4>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
                  შეიყვანეთ დაბადების თარიღი მარცხენა პანელზე, აირჩიეთ სასურველი მიმართულება (პიროვნული პროფილი, კარიერა, სიყვარული ან კარმული გზა) და დააჭირეთ გენერირებას.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span className="rounded-full bg-white/[0.03] px-3 py-1 border border-white/5">
                    ✓ სრული ქართული ენა
                  </span>
                  <span className="rounded-full bg-white/[0.03] px-3 py-1 border border-white/5">
                    ✓ ასპექტების ღრმა ანალიზი
                  </span>
                  <span className="rounded-full bg-white/[0.03] px-3 py-1 border border-white/5">
                    ✓ გამოთვლილ პოზიციებზე მორგებული განმარტება
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
