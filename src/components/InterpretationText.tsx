"use client";

import { useState } from "react";
import { Clock, Calendar, Copy, Check, Sparkles, BookOpen } from "lucide-react";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-extrabold text-amber-300 drop-shadow-[0_0_12px_rgba(255,210,106,0.5)]">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-amber-500/25 pb-3 sm:pb-4 text-xs font-semibold text-slate-300 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 max-w-full">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 px-3.5 py-1.5 text-amber-300 shadow-[0_0_18px_rgba(255,210,106,0.25)] max-w-full">
            <BookOpen className="h-3.5 w-3.5 text-amber-300 shrink-0" />
            <span className="text-[0.7rem] sm:text-xs font-black uppercase tracking-wider">ასტროლოგიური ინტერპრეტაცია</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[0.7rem] sm:text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>~{readingMinutes} წთ წაკითხვა</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[0.7rem] sm:text-xs font-bold">
            <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>{todayStr}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-[#0a061b] px-4 py-1.5 text-[0.7rem] sm:text-xs font-black text-amber-300 shadow-[0_0_15px_rgba(229,169,59,0.3)] transition-all hover:scale-105 hover:border-amber-300 shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-black">დაკოპირებულია!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>ტექსტის კოპირება</span>
            </>
          )}
        </button>
      </div>

      {/* Main interpretation blocks rendered as distinct elevated Glassmorphic cards */}
      <div className="space-y-4 sm:space-y-5 leading-relaxed text-slate-100 w-full max-w-full overflow-hidden">
        {blocks.map((block, i) => {
          if (block.startsWith("## ")) {
            return (
              <div key={i} className="pt-3 w-full">
                <div className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-purple-950/80 via-amber-950/50 to-purple-950/80 px-4 py-3.5 sm:px-6 sm:py-4 shadow-[0_8px_30px_rgba(0,0,0,0.6)] w-full max-w-full">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-amber-400/50 bg-amber-500/20 text-amber-300 shrink-0 shadow-[0_0_20px_rgba(255,210,106,0.4)]">
                    <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  </div>
                  <h3 className="font-display text-base sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-purple-300 drop-shadow-[0_0_18px_rgba(255,210,106,0.4)] break-words">
                    {block.replace(/^##\s*/, "")}
                  </h3>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-400/20 bg-gradient-to-b from-[#120a2e]/70 to-[#070417]/80 shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-amber-400/40 transition-all duration-300">
              <p className="text-xs sm:text-base leading-relaxed sm:leading-loose text-slate-200 break-words">
                {renderInline(block)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
