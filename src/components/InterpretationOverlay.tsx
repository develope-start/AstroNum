"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Sparkles, X } from "lucide-react";
import InterpretationText from "./InterpretationText";

type InterpretationOverlayProps = {
  open: boolean;
  loading: boolean;
  title: string;
  subtitle: string;
  interpretation?: string | null;
  mapNumber?: string | null;
  onClose: () => void;
  children?: ReactNode;
};

/**
 * A focused, full-screen reading surface. While a calculation is in flight it
 * keeps the calculator context softly blurred and makes progress visible; when
 * the response arrives, the same surface becomes the reading view.
 */
export default function InterpretationOverlay({
  open,
  loading,
  title,
  subtitle,
  interpretation,
  mapNumber,
  onClose,
  children,
}: InterpretationOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    if (!loading) {
      setProgress(100);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // The bar advances with the actual elapsed request time and deliberately
      // slows near completion instead of pretending the response is ready.
      const elapsed = now - startedAt;
      setProgress(Math.min(92, Math.round(6 + 88 * (1 - Math.exp(-elapsed / 7_500)))));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, loading]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <section
      className="fixed inset-0 z-[100] flex min-h-dvh flex-col bg-[#02040d]/80 px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.18),transparent_42%)]" />
      <div className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#080d1d]/95 shadow-[0_30px_120px_rgba(0,0,0,0.75)] sm:rounded-[2.25rem]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-[#0b1226]/85 px-5 py-4 backdrop-blur-xl sm:px-8 sm:py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em]">Swiss Ephemeris</span>
            </div>
            <h2 className="mt-1 text-lg font-black text-white sm:text-2xl">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:text-white disabled:cursor-wait disabled:opacity-45 sm:px-4"
            aria-label="ინტერპრეტაციის დახურვა და კალკულატორში დაბრუნება"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">დახურვა</span>
          </button>
        </header>

        {loading ? (
          <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-300/70 animate-spin" style={{ animationDuration: "4s" }} />
              <div className="absolute inset-3 rounded-full border border-violet-300/70 animate-pulse" />
              <Loader2 className="h-9 w-9 animate-spin text-cyan-200 sm:h-11 sm:w-11" />
            </div>
            <h3 className="mt-7 text-xl font-black text-white sm:text-2xl">ინტერპრეტაცია მზადდება</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">ვიანგარიშებთ რუკის პოზიციებს, სახლებსა და ასპექტებს. შედეგი გაიხსნება ამავე ფანჯარაში.</p>
            <div className="mt-7 w-full max-w-md" aria-label={`გამოთვლის პროგრესი: ${progress}%`}>
              <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/30 shadow-inner">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 transition-[width] duration-300" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
                <span>მიმდინარეობს</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        ) : (
          <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-8">
            <div className="mx-auto w-full max-w-4xl">
              {mapNumber && <p className="mb-5 inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-200">რუკის ნომერი: {mapNumber}</p>}
              {interpretation ? <InterpretationText text={interpretation} /> : children}
              <button
                type="button"
                onClick={onClose}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-4 py-2.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                <ArrowLeft className="h-4 w-4" />
                დაბრუნება კალკულატორში
              </button>
            </div>
          </main>
        )}
      </div>
    </section>
  );
}
