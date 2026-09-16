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
    <div className="space-y-6">
      {/* Header bar with reading metadata & quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4 text-xs font-semibold text-slate-300">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-500/20 to-amber-500/15 px-4 py-1.5 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>ასტროლოგიური ინტერპრეტაცია</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>~{readingMinutes} წუთი წაკითხვის დრო</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>გამოთვლილია: {todayStr}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-[#080418] px-4 py-1.5 text-xs font-bold text-amber-300 transition-all hover:scale-105 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">დაკოპირებულია!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-amber-400" />
              <span>ტექსტის კოპირება</span>
            </>
          )}
        </button>
      </div>

      {/* Main interpretation blocks */}
      <div className="space-y-6 leading-relaxed text-slate-100">
        {blocks.map((block, i) => {
          if (block.startsWith("## ")) {
            return (
              <div key={i} className="pt-3">
                <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-gradient-to-r from-purple-950/60 via-amber-950/40 to-purple-950/60 px-5 py-3.5 shadow-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    {block.replace(/^##\s*/, "")}
                  </h3>
                </div>
              </div>
            );
          }
          return (
            <p key={i} className="text-[1.02rem] leading-relaxed text-slate-200 pl-1">
              {renderInline(block)}
            </p>
          );
        })}
      </div>
    </div>
  );
}



