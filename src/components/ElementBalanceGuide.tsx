import { Compass, ChevronDown, BookOpen } from "lucide-react";
import type { WheelPlanet } from "@/components/ChartWheel";
import ElementTemperamentDetails from "@/components/ElementTemperamentDetails";
import ElementSynthesisTable from "@/components/ElementSynthesisTable";
import ElementSources from "@/components/ElementSources";
import type { ElementTemperamentId } from "@/lib/elementTemperaments";
import { calculateElementBalance as calculateSharedElementBalance } from "@/lib/elementBalance";

import { scrollToAscendantSection } from "@/lib/scrollToAscendant";
import { ELEMENT_VISUALS } from "./elementVisuals";

const ZODIAC_NAMES = [
  "ვერძი", "კურო", "ტყუპები", "კირჩხიბი", "ლომი", "ქალწული",
  "სასწორი", "მორიელი", "მშვილდოსანი", "თხის რქა", "მერწყული", "თევზები"
];

const ALL_ELEMENTS: ElementTemperamentId[] = ["fire", "earth", "air", "water"];

function getSignName(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  return ZODIAC_NAMES[Math.floor(norm / 30)] || "ვერძი";
}

export default function ElementBalanceGuide({ planets, ascendant }: { planets: WheelPlanet[]; ascendant: number }) {
  const elements = calculateSharedElementBalance(planets);
  function focusElementInterpretation(element: string) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("focus-element-interpretation", { detail: { element } }));
  }

  const bars = ELEMENT_VISUALS.map((visual) => ({ ...visual, value: elements.percentages[visual.id] }));

  return (
    <div data-export-element-balance="true" className="prism-card rounded-3xl p-4 sm:p-6 space-y-4 text-center">
      
      {/* 1. Element Percentages & Synthesis Progress Bars */}
      <details className="interpretation-accordion border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden shadow-inner" open>
        <summary className="element-balance-summary interpretation-accordion-summary flex-nowrap gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer">
          <div className="element-balance-heading flex items-center gap-2 min-w-0 flex-1">
            <span className="interpretation-accordion-icon flex h-7 w-7 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-300">
              <Compass className="h-4 w-4 text-sky-300 shrink-0" />
            </span>
            <span className="element-balance-title interpretation-accordion-title text-sky-200 text-xs sm:text-base font-bold text-left">
              სტიქიების პროცენტული სინთეზი & ცის ღერძები
            </span>
          </div>
          <div className="element-balance-actions flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                scrollToAscendantSection();
              }}
              className="element-balance-ascendant rounded-full border border-sky-400/40 bg-sky-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[0.7rem] sm:text-xs font-bold text-sky-200 hover:bg-sky-500/40 hover:border-sky-300 hover:scale-105 shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all cursor-pointer shrink-0"
              title="გადადი ასცენდენტის ინტერპრეტაციაზე"
            >
              ASC: {getSignName(ascendant)} ({Math.floor(ascendant % 30)}°)
            </button>
            <ChevronDown className="element-balance-chevron interpretation-accordion-chevron h-4 w-4 text-sky-300 shrink-0" />
          </div>
        </summary>
        <div className="interpretation-accordion-body pt-1 pb-3 px-3 sm:px-4 border-t border-white/10">
          <div className="element-balance-indicators-grid grid gap-2 sm:gap-3 text-xs">
            {bars.map((bar) => {
              const Icon = bar.icon;
              return (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => focusElementInterpretation(bar.id)}
                  data-element={bar.id}
                  data-export-element={bar.id}
                  data-export-element-label={bar.label}
                  data-export-element-value={bar.value}
                  className="element-balance-indicator rounded-xl border border-white/10 bg-[#070914] p-2.5 text-left transition-all duration-200 hover:border-sky-400/40 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/20 sm:p-3 cursor-pointer"
                  aria-label={`გადადით ${bar.label} სტიქიის ინტერპრეტაციაზე`}
                >
                  <div className="element-balance-indicator-header flex items-center justify-between gap-2 font-semibold text-[0.7rem] sm:text-xs">
                    <span className="element-balance-indicator-name flex min-w-0 items-center gap-1.5"><Icon className={`element-balance-indicator-icon h-3 w-3 shrink-0 ${bar.iconClass}`} /> <span className="element-balance-indicator-label text-slate-200">{bar.label}</span></span>
                    <span className="element-balance-indicator-value shrink-0 tabular-nums text-sky-300 font-bold">{bar.value}%</span>
                  </div>
                  <div className="infographic-bar-bg h-2 mt-1.5 bg-[#0e1428] rounded-full overflow-hidden">
                    <div className={`infographic-bar-fill h-full rounded-full bg-gradient-to-r ${bar.gradient}`} style={{ width: `${bar.value}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* 2. Main Elements & Temperaments Explanation */}
      <details className="interpretation-accordion border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden shadow-inner">
        <summary className="interpretation-accordion-summary p-3 sm:p-4 cursor-pointer">
          <span className="interpretation-accordion-icon flex h-7 w-7 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/15 text-purple-300">
            <BookOpen className="h-4 w-4 text-purple-300" />
          </span>
          <span className="interpretation-accordion-title text-purple-200 text-xs sm:text-base font-bold text-left">
            სტიქიებისა და ტემპერამენტების განმარტება
          </span>
          <ChevronDown className="interpretation-accordion-chevron h-4 w-4 text-purple-300 shrink-0" />
        </summary>
        <div className="interpretation-accordion-body p-3 sm:p-4 border-t border-white/10 space-y-4 text-left">
          {ALL_ELEMENTS.map((el) => (
            <div key={el} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4">
              <ElementTemperamentDetails element={el} />
            </div>
          ))}
        </div>
      </details>

      {/* 3. Synthesis Table */}
      <ElementSynthesisTable />

      {/* 4. Sources */}
      <ElementSources />
    </div>
  );
}
