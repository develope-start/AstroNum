import { Flame, Mountain, Wind, Droplets, Compass } from "lucide-react";
import type { WheelPlanet } from "@/components/ChartWheel";
import ElementTemperamentDetails from "@/components/ElementTemperamentDetails";
import ElementSynthesisTable from "@/components/ElementSynthesisTable";
import { ELEMENT_TEMPERAMENTS } from "@/lib/elementTemperaments";

const ZODIAC_NAMES = [
  "ვერძი", "კურო", "ტყუპები", "კირჩხიბი", "ლომი", "ქალწული",
  "სასწორი", "მორიელი", "მშვილდოსანი", "თხის რქა", "მერწყული", "თევზები"
];

function getSignName(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  return ZODIAC_NAMES[Math.floor(norm / 30)] || "ვერძი";
}

function calculateElementBalance(planets: WheelPlanet[]) {
  let fire = 0, earth = 0, air = 0, water = 0;
  planets.forEach((p) => {
    const elem = Math.floor((Math.floor(((p.longitude % 360) + 360) % 360 / 30)) % 4);
    if (elem === 0) fire++;
    else if (elem === 1) earth++;
    else if (elem === 2) air++;
    else water++;
  });
  const total = planets.length || 1;
  return {
    fire: Math.round((fire / total) * 100),
    earth: Math.round((earth / total) * 100),
    air: Math.round((air / total) * 100),
    water: Math.round((water / total) * 100),
  };
}

export default function ElementBalanceGuide({ planets, ascendant }: { planets: WheelPlanet[]; ascendant: number }) {
  const elements = calculateElementBalance(planets);
  const bars = [
    { id: "fire", label: "ცეცხლი", value: elements.fire, icon: Flame, iconClass: "text-rose-400", textClass: "text-rose-300", borderClass: "border-rose-500/30", bgClass: "bg-rose-950/30", gradient: "from-rose-500 to-red-600" },
    { id: "earth", label: "მიწა", value: elements.earth, icon: Mountain, iconClass: "text-amber-500", textClass: "text-amber-300", borderClass: "border-amber-600/30", bgClass: "bg-amber-950/35", gradient: "from-amber-600 to-yellow-800" },
    { id: "air", label: "ჰაერი", value: elements.air, icon: Wind, iconClass: "text-sky-300", textClass: "text-sky-200", borderClass: "border-sky-400/30", bgClass: "bg-sky-950/30", gradient: "from-sky-400 to-cyan-300" },
    { id: "water", label: "წყალი", value: elements.water, icon: Droplets, iconClass: "text-blue-400", textClass: "text-blue-300", borderClass: "border-blue-600/30", bgClass: "bg-blue-950/40", gradient: "from-blue-600 to-indigo-900" },
  ];

  return (
    <div className="glass-panel rounded-2xl sm:rounded-[28px] p-4 sm:p-6 border-amber-500/25 bg-gradient-to-b from-[#130938]/90 to-[#09041a]/95 backdrop-blur-2xl shadow-xl space-y-3 sm:space-y-4 text-center">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-amber-500/20 pb-3">
        <span className="font-display text-xs sm:text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
          <Compass className="h-4 w-4 text-amber-400 shrink-0" />
          <span>სტიქიების ბალანსი & ცის ღერძები</span>
        </span>
        <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[0.7rem] sm:text-xs font-bold text-purple-300">
          ASC: {getSignName(ascendant)} ({Math.floor(ascendant % 30)}°)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 text-xs">
        {bars.map((bar) => {
          const Icon = bar.icon;
          return (
            <div key={bar.id} className={`rounded-xl border ${bar.borderClass} ${bar.bgClass} p-2.5 sm:p-3 space-y-1.5 text-center`}>
              <div className={`flex justify-between font-bold ${bar.textClass} text-[0.7rem] sm:text-xs`}>
                <span className="flex items-center gap-1"><Icon className={`h-3 w-3 ${bar.iconClass}`} /> {bar.label}</span>
                <span>{bar.value}%</span>
              </div>
              <div className="infographic-bar-bg h-1.5">
                <div className={`infographic-bar-fill bg-gradient-to-r ${bar.gradient}`} style={{ width: `${bar.value}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-amber-500/20 pt-4 text-left">
        <h4 className="mb-3 text-center font-display text-sm font-bold text-amber-200 sm:text-base">
          სტიქიებისა და ტემპერამენტების განმარტება
        </h4>
        <div className="grid gap-3 lg:grid-cols-2">
          {(Object.keys(ELEMENT_TEMPERAMENTS) as Array<keyof typeof ELEMENT_TEMPERAMENTS>).map((element) => (
            <article key={element} className="rounded-2xl border border-slate-700/60 bg-slate-950/35 p-3.5 text-xs leading-relaxed text-slate-200 sm:p-4 sm:text-sm">
              <ElementTemperamentDetails element={element} />
            </article>
          ))}
        </div>
      </div>

      <ElementSynthesisTable />
    </div>
  );
}
