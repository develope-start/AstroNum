"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, Copy, Check, Sparkles, BookOpen } from "lucide-react";
import { PLANET_NAMES_KA } from "@/lib/astro/signs";
import { ALL_ASPECTS } from "@/lib/astro/aspects";

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

export type InterpretationViewMetadata =
  | { mode: "USER"; viewedAt: string | null }
  | {
      mode: "ADMIN";
      userLastViewedAt: string | null;
      adminLastViewedAt: string | null;
      admin: { id: string; adminId: string | null; name: string | null; username: string | null } | null;
    };

function formatViewDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "ჯერ არ უნახავს";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", includeTime
    ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "long", day: "numeric" });
}

type ElementId = "fire" | "earth" | "air" | "water";

const ELEMENT_NAMES: Record<ElementId, string> = {
  fire: "ცეცხლი",
  earth: "მიწა",
  air: "ჰაერი",
  water: "წყალი",
};

function elementIdForBlock(block: string): ElementId | null {
  const match = block.match(/^\*\*[^*]*?(ცეცხლი|მიწა|ჰაერი|წყალი)\s+—/);
  if (!match) return null;
  return (Object.entries(ELEMENT_NAMES).find(([, name]) => name === match[1])?.[0] as ElementId | undefined) ?? null;
}

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

function isFoundationSection(heading: string) {
  return heading.toLowerCase().includes("გამოთვლისა და ინტერპრეტაციის საფუძველი");
}

function interpretationSectionOrder(heading: string): number | null {
  const normalized = heading.toLowerCase();
  if (normalized.includes("დამატებითი ბიბლიოთეკური")) return 0;
  if (normalized.includes("კუთხური პლანეტები")) return 1;
  if (normalized.includes("ტრადიციული ღირსებები") || normalized.includes("დისპოზიტორები")) return 2;
  if (normalized.includes("ტექნიკური სინთეზი")) return 4;
  if (normalized.includes("დეკლინაციები")) return 3;
  if (normalized.includes("ფიქსირებული ვარსკვლავები")) return 3;
  return null;
}

function moveTechnicalSectionsToRequestedOrder(sections: InterpretationSection[]) {
  const technicalSections = sections.filter((section) => interpretationSectionOrder(section.heading) !== null);
  if (!technicalSections.length) return sections;

  const remainingSections = sections.filter((section) => interpretationSectionOrder(section.heading) === null);
  const orderedTechnicalSections: InterpretationSection[] = [];
  for (let order = 0; order <= 4; order += 1) {
    orderedTechnicalSections.push(...technicalSections.filter((section) => interpretationSectionOrder(section.heading) === order));
  }

  return [...remainingSections, ...orderedTechnicalSections];
}

function InterpretationSectionView({
  section,
  openByDefault,
  focusedElement,
  onClearElementFocus,
}: {
  section: InterpretationSection;
  openByDefault: boolean;
  focusedElement: ElementId | null;
  onClearElementFocus: () => void;
}) {
  const [open, setOpen] = useState(openByDefault);
  const isAscendant = section.heading.toLowerCase().includes("ასცენდენტი");
  const isElementSynthesis = section.heading.toLowerCase().includes("სტიქიების პროცენტული სინთეზი");
  const isAngularHouse = /^(1|4|7|10)\s+სახლი/.test(section.heading);
  const focusedBlockInSection = isElementSynthesis && section.blocks.some((block) => elementIdForBlock(block) === focusedElement);

  useEffect(() => {
    if (focusedBlockInSection) setOpen(true);
  }, [focusedBlockInSection]);

  useEffect(() => {
    if (!isAscendant) return;
    const handleScrollEvent = () => {
      setOpen(true);
      setTimeout(() => {
        const el = document.getElementById("ascendant-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    };
    window.addEventListener("scroll-to-ascendant", handleScrollEvent);
    return () => window.removeEventListener("scroll-to-ascendant", handleScrollEvent);
  }, [isAscendant]);

  return (
    <details
      id={isAscendant ? "ascendant-section" : undefined}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={`interpretation-accordion ${isAngularHouse ? "interpretation-angular-house" : ""}`}
    >
      <summary className="interpretation-accordion-summary">
        <span className="interpretation-accordion-icon"><Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" /></span>
        <span className="interpretation-accordion-title">{section.heading}</span>
        <span className="interpretation-accordion-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="interpretation-accordion-body">
        {section.blocks.map((block, index) => {
          const blockElement = isElementSynthesis ? elementIdForBlock(block) : null;
          const isFocused = blockElement !== null && blockElement === focusedElement;
          return (
          <p
            key={index}
            id={isFocused ? `element-interpretation-${blockElement}` : undefined}
            className={`interpretation-paragraph text-sm sm:text-base leading-relaxed text-slate-200 ${isFocused ? "interpretation-element-highlight" : ""}`}
            onClick={isFocused ? onClearElementFocus : undefined}
            onKeyDown={isFocused ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClearElementFocus();
              }
            } : undefined}
            role={isFocused ? "button" : undefined}
            tabIndex={isFocused ? 0 : undefined}
            title={isFocused ? "დააჭირე მონიშვნის გასაუქმებლად" : undefined}
          >
            {renderInline(block)}
          </p>
          );
        })}
      </div>
    </details>
  );
}

export default function InterpretationText({ text, viewMetadata }: { text: string; viewMetadata?: InterpretationViewMetadata }) {
  const [copied, setCopied] = useState(false);
  const [focusedElement, setFocusedElement] = useState<ElementId | null>(null);

  useEffect(() => {
    const handleInterpretationFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; key?: string }>).detail;
      if (!detail?.type || !detail.key) return;
      const key = detail.key;
      const parts = key.split("|");
      const angleHouse: Record<string, string> = { ASC: "1 სახლი", DSC: "7 სახლი", MC: "10 სახლი", IC: "4 სახლი" };
      const terms = detail.type === "aspect"
        ? [
          PLANET_NAMES_KA[parts[0]!] ?? parts[0]!,
          ALL_ASPECTS.find((aspect) => aspect.name === parts[1])?.nameKa ?? parts[1]!,
          PLANET_NAMES_KA[parts[2]!] ?? parts[2]!,
        ].map((term) => term.toLowerCase())
        : detail.type === "house"
          ? [`${key} სახლი`]
          : detail.type === "angle"
            ? [angleHouse[key] ?? key]
          : [(PLANET_NAMES_KA[key] ?? key).toLowerCase()];
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(".interpretation-content .interpretation-paragraph, .interpretation-content .interpretation-accordion"));
      const target = nodes.find((node) => {
        const content = (node.textContent ?? "").toLowerCase();
        return terms.every((term) => content.includes(term));
      });
      if (!target) return;
      const parentDetails = target.closest("details") as HTMLDetailsElement | null;
      if (parentDetails) parentDetails.open = true;
      window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "center" }), 40);
    };
    window.addEventListener("focus-interpretation", handleInterpretationFocus);
    return () => window.removeEventListener("focus-interpretation", handleInterpretationFocus);
  }, []);

  const wordCount = text.trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const fallbackViewedAt = new Date().toISOString();

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const { preface, sections } = splitInterpretation(text);
  const orderedSections = [...sections];

  // Keep the percentage synthesis directly below the separate balance/axes
  // guide that is rendered above this interpretation block.
  const synthesisIndex = orderedSections.findIndex((section) => section.heading.toLowerCase().includes("სტიქიების პროცენტული სინთეზი"));
  if (synthesisIndex > 0) {
    const [synthesisSection] = orderedSections.splice(synthesisIndex, 1);
    orderedSections.unshift(synthesisSection!);
  }

  const ascendantIndex = orderedSections.findIndex((section) => section.heading.toLowerCase().includes("ასცენდენტი"));
  const characterIndex = orderedSections.findIndex((section) => section.heading.toLowerCase().includes("რუკის ხასიათი"));

  // Keep the map signature immediately above the Ascendant section even for
  // older cached/database interpretations that were generated in another order.
  if (ascendantIndex >= 0 && characterIndex >= 0 && characterIndex > ascendantIndex) {
    const [characterSection] = orderedSections.splice(characterIndex, 1);
    orderedSections.splice(ascendantIndex, 0, characterSection!);
  }

  const foundationSections = orderedSections.filter((section) => isFoundationSection(section.heading));

  // Keep advanced interpretation accordions in one stable order for new
  // results as well as older cached/database interpretations.
  const reorderedTechnicalSections = moveTechnicalSectionsToRequestedOrder(
    orderedSections.filter((section) => !isFoundationSection(section.heading)),
  );
  orderedSections.splice(0, orderedSections.length, ...reorderedTechnicalSections);

  // The methodology/foundation is always the final section. This also keeps
  // newly added interpretation sections above it without depending on the
  // order in which the server or an older cached record generated them.
  if (foundationSections.length) {
    for (let index = orderedSections.length - 1; index >= 0; index -= 1) {
      if (isFoundationSection(orderedSections[index]!.heading)) orderedSections.splice(index, 1);
    }
    orderedSections.push(...foundationSections);
  }

  const defaultOpenIndex = orderedSections.findIndex((section) => !isFoundationSection(section.heading));

  useEffect(() => {
    const handleElementFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ element?: string }>).detail;
      const element = detail?.element;
      if (!element || !(element in ELEMENT_NAMES)) return;
      const elementId = element as ElementId;
      setFocusedElement(elementId);
      window.setTimeout(() => {
        document.getElementById(`element-interpretation-${elementId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    };

    window.addEventListener("focus-element-interpretation", handleElementFocus);
    return () => window.removeEventListener("focus-element-interpretation", handleElementFocus);
  }, []);

  return (
    <div className="interpretation-content space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header bar with reading metadata & quick actions */}
      <div className="interpretation-toolbar flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-amber-500/20 pb-3 sm:pb-4 text-xs font-semibold text-slate-300 w-full">
        <div className="interpretation-meta flex flex-wrap items-center gap-2 sm:gap-4 max-w-full">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-purple-500/20 to-amber-500/15 px-3 py-1 sm:px-4 sm:py-1.5 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] max-w-full">
            <BookOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-[0.7rem] sm:text-xs">ასტროლოგიური ინტერპრეტაცია</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[0.7rem] sm:text-xs">
            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>კითხვის სავარაუდო დრო: დაახლოებით {readingMinutes} წუთი</span>
          </div>
          {viewMetadata?.mode === "ADMIN" ? (
            <div className="flex flex-col gap-1 text-slate-300 text-[0.7rem] sm:text-xs">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                მომხმარებლის ბოლო ნახვა: {formatViewDate(viewMetadata.userLastViewedAt, true)}
              </span>
              <span className="pl-5">
                ადმინის ბოლო ნახვა: {formatViewDate(viewMetadata.adminLastViewedAt, true)}
                {viewMetadata.admin
                  ? ` — ${viewMetadata.admin.name || viewMetadata.admin.username || "სახელი უცნობია"} (ID: ${viewMetadata.admin.adminId || viewMetadata.admin.id})`
                  : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-300 text-[0.7rem] sm:text-xs">
              <Calendar className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>ნახვის თარიღი: {formatViewDate(viewMetadata?.viewedAt ?? fallbackViewedAt)}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="interpretation-copy flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-[#080418] px-3.5 py-1 sm:px-4 sm:py-1.5 text-[0.7rem] sm:text-xs font-bold text-amber-300 transition-all hover:scale-105 hover:border-amber-400 shrink-0"
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
      <div className="interpretation-body space-y-4 sm:space-y-6 leading-relaxed text-slate-100 w-full max-w-full overflow-x-hidden">
        {preface.map((block, index) => (
          <p key={`preface-${index}`} className="interpretation-paragraph text-sm sm:text-base leading-relaxed text-slate-200 pl-0.5 sm:pl-1">
            {renderInline(block)}
          </p>
        ))}
        {orderedSections.map((section, index) => (
          <InterpretationSectionView
            key={`${section.heading}-${index}`}
            section={section}
            openByDefault={index === defaultOpenIndex && !isFoundationSection(section.heading)}
            focusedElement={focusedElement}
            onClearElementFocus={() => setFocusedElement(null)}
          />
        ))}
      </div>
    </div>
  );
}
