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

type InterpretationSection = {
  heading: string;
  blocks: string[];
};

function splitInterpretation(text: string) {
  const sections: InterpretationSection[] = [];
  const preface: string[] = [];
  let current: InterpretationSection | null = null;

  for (const block of text.split(/\n\n+/).map((item) => item.trim()).filter(Boolean)) {
    const heading = block.match(/^#{2,3}\s+(.+)$/)?.[1];
    if (heading) {
      current = { heading, blocks: [] };
      sections.push(current);
    } else if (current) {
      current.blocks.push(block);
    } else {
      preface.push(block);
    }
  }

  return { preface, sections };
}

function InterpretationSectionView({ section, openByDefault }: { section: InterpretationSection; openByDefault: boolean }) {
  const [open, setOpen] = useState(openByDefault);

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="interpretation-accordion">
      <summary className="interpretation-accordion-summary">
        <span className="interpretation-accordion-icon"><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" /></span>
        <span className="interpretation-accordion-title">{section.heading}</span>
        <span className="interpretation-accordion-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="interpretation-accordion-body">
        {section.blocks.map((block, index) => (
          <p key={index} className="text-xs sm:text-base leading-relaxed text-slate-200 break-words">
            {renderInline(block)}
          </p>
        ))}
      </div>
    </details>
  );
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

  const { preface, sections } = splitInterpretation(text);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
      {/* Header bar with reading metadata & quick actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-amber-500/20 pb-3 sm:pb-4 text-xs font-semibold text-slate-300 w-full">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 max-w-full">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-500/20 to-amber-500/15 px-3 py-1 sm:px-4 sm:py-1.5 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] max-w-full">
            <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-[0.7rem] sm:text-xs">ასტროლოგიური ინტერპრეტაცია</span>
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
        {preface.map((block, index) => (
          <p key={`preface-${index}`} className="text-xs sm:text-base leading-relaxed text-slate-200 pl-0.5 sm:pl-1 break-words">
            {renderInline(block)}
          </p>
        ))}
        {sections.map((section, index) => (
          <InterpretationSectionView key={`${section.heading}-${index}`} section={section} openByDefault={index === 0} />
        ))}
      </div>
    </div>
  );
}


