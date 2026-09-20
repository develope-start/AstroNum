import { Flame, Mountain, Wind, Droplets, Compass, ChevronDown, BookOpen } from "lucide-react";
import type { WheelPlanet } from "@/components/ChartWheel";
import ElementTemperamentDetails from "@/components/ElementTemperamentDetails";
import ElementSynthesisTable from "@/components/ElementSynthesisTable";
import ElementSources from "@/components/ElementSources";
import { ELEMENT_TEMPERAMENTS } from "@/lib/elementTemperaments";
import { calculateElementBalance as calculateSharedElementBalance } from "@/lib/elementBalance";

import { scrollToAscendantSection } from "@/lib/scrollToAscendant";

const ZODIAC_NAMES = [
  "ვერძი", "კურო", "ტყუპები", "კირჩხიბი", "ლომი", "ქალწული",
  "სასწორი", "მორიელი", "მშვილდოსანი", "თხის რქა", "მერწყული", "თევზები"
];

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

  const bars = [
    { id: "fire", label: "ცეცხლი", value: elements.percentages.fire, icon: Flame, iconClass: "text-rose-300", gradient: "from-rose-400/80 to-red-500/80" },
    { id: "earth", label: "მიწა", value: elements.percentages.earth, icon: Mountain, iconClass: "text-amber-300", gradient: "from-amber-400/80 to-yellow-600/80" },
    { id: "air", label: "ჰაერი", value: elements.percentages.air, icon: Wind, iconClass: "text-sky-200", gradient: "from-sky-300/80 to-cyan-400/80" },
    { id: "water", label: "წყალი", value: elements.percentages.water, icon: Droplets, iconClass: "text-blue-300", gradient: "from-blue-400/80 to-indigo-500/80" },
  ];

  return (
    <div className="glass-panel rounded-2xl sm:rounded-[28px] p-3 sm:p-5 border-amber-500/25 bg-gradient-to-b from-[#130938]/90 to-[#09041a]/95 backdrop-blur-2xl shadow-xl space-y-3.5 text-center">
      
      {/* 1. Element Percentages & Synthesis Progress Bars: VERY TOP, OPEN BY DEFAULT WITH TOGGLE */}
      <details className="interpretation-accordion border-amber-500/30 bg-purple-950/20" open>
        <summary className="element-balance-summary interpretation-accordion-summary flex-nowrap gap-2 sm:gap-3 p-3 sm:p-4">
          <div className="element-balance-heading flex items-center gap-2 min-w-0 flex-1">
            <span className="interpretation-accordion-icon">
              <Compass className="h-4 w-4 text-amber-300 shrink-0" />
            </span>
            <span className="element-balance-title interpretation-accordion-title text-amber-200 text-xs sm:text-base font-bold text-left">
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
              className="element-balance-ascendant rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[0.7rem] sm:text-xs font-bold text-purple-200 hover:bg-purple-500/40 hover:border-purple-300 hover:scale-105 transition-all cursor-pointer shrink-0"
              title="გადადი ასცენდენტის ინტერპრეტაციაზე"
            >
              ASC: {getSignName(ascendant)} ({Math.floor(ascendant % 30)}°)
            </button>
            <ChevronDown className="element-balance-chevron interpretation-accordion-chevron h-4 w-4 shrink-0" />
          </div>
        </summary>
        <div className="interpretation-accordion-body pt-1 pb-3 px-3 sm:px-4">
          <div className="element-balance-indicators-grid grid gap-2 sm:gap-3 text-xs">
            {bars.map((bar) => {
              const Icon = bar.icon;
              return (
                <button
                  key={bar.id}
                  type="button"
                  onClick={() => focusElementInterpretation(bar.id)}
                  data-element={bar.id}
                  className="element-balance-indicator rounded-xl border p-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/20 sm:p-3"
                  aria-label={`გადადით ${bar.label} სტიქიის ინტერპრეტაციაზე`}
                >
                  <div className="element-balance-indicator-header flex items-center justify-between gap-2 font-semibold text-[0.7rem] sm:text-xs">
                    <span className="element-balance-indicator-name flex min-w-0 items-center gap-1.5"><Icon className={`element-balance-indicator-icon h-3 w-3 shrink-0 ${bar.iconClass}`} /> <span className="element-balance-indicator-label">{bar.label}</span></span>
                    <span className="element-balance-indicator-value shrink-0 tabular-nums">{bar.value}%</span>
                  </div>
                  <div className="infographic-bar-bg h-1.5">
                    <div className={`infographic-bar-fill bg-gradient-to-r ${bar.gradient}`} style={{ width: `${bar.value}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </details>

      {/* 2. Main Elements & Temperaments Explanation: COLLAPSED BY DEFAULT */}
      <details className="interpretation-accordion border-amber-500/20">
        <summary className="interpretation-accordion-summary p-3 sm:p-4">
          <span className="interpretation-accordion-icon">
            <BookOpen className="h-4 w-4 text-amber-300" />
          </span>
          <span className="interpretation-accordion-title text-amber-200 text-xs sm:text-base font-bold text-left">
            სტიქიებისა და ტემპერამენტების განმარტება
          </span>
          <ChevronDown className="interpretation-accordion-chevron h-4 w-4 shrink-0" />
        </summary>
        <div className="interpretation-accordion-body pt-2 pb-4 px-3 sm:px-4 text-left">
          <div className="grid gap-3 lg:grid-cols-2">
            {(Object.keys(ELEMENT_TEMPERAMENTS) as Array<keyof typeof ELEMENT_TEMPERAMENTS>).map((element) => (
              <details key={element} className="rounded-xl border border-slate-700/60 bg-slate-950/35 p-3 text-xs leading-relaxed text-slate-200">
                <summary className="cursor-pointer font-bold text-amber-300 outline-none flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span>{ELEMENT_TEMPERAMENTS[element].icon}</span>
                    <span>{ELEMENT_TEMPERAMENTS[element].title} ({ELEMENT_TEMPERAMENTS[element].temperament})</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-amber-400/70" />
                </summary>
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <ElementTemperamentDetails element={element} showTitle={false} />
                </div>
              </details>
            ))}
          </div>
        </div>
      </details>

      {/* 3. Element Interaction / Synthesis Analysis: COLLAPSED BY DEFAULT */}
      <ElementSynthesisTable defaultOpen={false} />

      {/* 4. Element Information & Sources: COLLAPSED BY DEFAULT */}
      <ElementSources defaultOpen={false} />

    </div>
  );
}
