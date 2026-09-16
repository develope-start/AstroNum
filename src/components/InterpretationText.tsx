"use client";

import { useState } from "react";
import { Clock, Calendar, Copy, Check, Sparkles, BookOpen } from "lucide-react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function InterpretationText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const wordCount = text.trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const todayStr = new Date().toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header bar with reading metadata & quick actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-amber-500/20 pb-3 sm:pb-4 text-xs font-semibold text-slate-300 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 max-w-full">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-500/20 to-amber-500/15 px-3 py-1 sm:px-4 sm:py-1.5 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] max-w-full">
            <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-[0.7rem] sm:text-xs truncate">ასტროლოგიური ინტერპრეტაცია</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[0.7rem] sm:text-xs">
            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>~{readingMinutes} წთ</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[0.7rem] sm:text-xs">
            <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>{todayStr}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-[#080418] px-3.5 py-1 sm:px-4 sm:py-1.5 text-[0.7rem] sm:text-xs font-bold text-amber-300 transition-all hover:scale-105 hover:border-amber-400 shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400">დაკოპირებულია!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>კოპირება</span>
            </>
          )}
        </button>
      </div>

      {/* Main interpretation blocks */}
      <div className="space-y-4 sm:space-y-6 leading-relaxed text-slate-100 w-full max-w-full overflow-hidden">
        {blocks.map((block, i) => {
          if (block.startsWith("## ")) {
            return (
              <div key={i} className="pt-2 sm:pt-3 w-full">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-amber-400/30 bg-gradient-to-r from-purple-950/60 via-amber-950/40 to-purple-950/60 px-3.5 py-2.5 sm:px-5 sm:py-3.5 shadow-md w-full max-w-full">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 animate-pulse" />
                  </div>
                  <h3 className="font-display text-base sm:text-xl font-bold text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] break-words">
                    {block.replace(/^##\s*/, "")}
                  </h3>
                </div>
              </div>
            );
          }
          return (
            <p key={i} className="text-xs sm:text-base leading-relaxed text-slate-200 pl-0.5 sm:pl-1 break-words">
              {renderInline(block)}
            </p>
          );
        })}
      </div>
    </div>
  );
}



