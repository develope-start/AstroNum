"use client";

import { Compass, Droplets, Flame, Mountain, Wind } from "lucide-react";
import type { WheelPlanet } from "./ChartWheel";

const ZODIAC_SIGNS = [
  "ვერძი ♈", "კურო ♉", "ტყუპები ♊", "კირჩხიბი ♋",
  "ლომი ♌", "ქალწული ♍", "სასწორი ♎", "მორიელი ♏",
  "მშვილდოსანი ♐", "თხის რქა ♑", "მერწყული ♒", "თევზები ♓",
];

const ELEMENT_GUIDES = [
  {
    id: "fire",
    icon: "🔥",
    title: "ქოლერიკი — ცეცხლის სტიქია",
    signs: "ვერძი, ლომი, მშვილდოსანი",
    qualities: "ცხელი და მშრალი",
    description: "ეს არის მოქმედების, ლიდერობისა და ენერგიის ტემპერამენტი. ცეცხლის ნიშნები, ისევე როგორც ტიპური ქოლერიკები, არიან ამბიციურები, პირდაპირები, იმპულსურები და მუდამ წინ მიისწრაფვიან. ახასიათებთ სწრაფი აალება და მგზნებარე ნება, თუმცა სუსტი მხარე მოუთმენლობა და ფეთქებადობაა.",
    sources: [
      ["1", "https://saptarishisastrology.com/greek-medicine-and-astrology-1-2-by-david-osborn/"],
      ["2", "https://saptarishisastrology.com/temperaments-of-the-zodiac-signs-by-david-osborn/"],
      ["3", "https://en.wikipedia.org/wiki/Astrology_and_the_classical_elements"],
      ["4", "https://www.wattpad.com/713334294-zodiac-scenarios-which-of-the-4-basic-temperaments"],
      ["5", "https://thealignedlover.com/traditional-astrology-the-four-elements-and-their-core-qualities/"],
      ["6", "https://en.wikipedia.org/wiki/Four_temperaments"],
      ["7", "https://www.scribd.com/document/325090063/Four-Temperament"],
    ],
  },
  {
    id: "air",
    icon: "💨",
    title: "სანგვინიკი — ჰაერის სტიქია",
    signs: "ტყუპები, სასწორი, მერწყული",
    qualities: "ცხელი და ნოტიო",
    description: "ეს არის კომუნიკაციის, აზროვნებისა და სოციალიზაციის ტემპერამენტი. ჰაერის ნიშნები, სანგვინიკების მსგავსად, არიან ძალიან ცოცხალები, ცნობისმოყვარეები, ოპტიმისტები და ადვილად ეგუებიან სიახლეებს. მათ უყვართ ხალხთან კონტაქტი და ინფორმაციის გაცვლა. სუსტი მხარეა ყურადღების გაფანტვა და არამდგრადობა.",
    sources: [
      ["1", "https://en.wikipedia.org/wiki/Four_temperaments"],
      ["2", "https://en.wikipedia.org/wiki/Astrology_and_the_classical_elements"],
      ["3", "https://saptarishisastrology.com/greek-medicine-and-astrology-1-2-by-david-osborn/"],
      ["4", "https://mysticalanalytics.com/the-big-3-of-temperament/"],
      ["5", "https://psychology.com/types/four-temperaments"],
      ["6", "https://medaybe.com/the-four-temperaments-in-anthroposophy/"],
      ["7", "https://fourtemperaments.com/4-primary-temperaments/"],
    ],
  },
  {
    id: "earth",
    icon: "🪵",
    title: "მელანქოლიკი — მიწის სტიქია",
    signs: "კურო, ქალწული, თხის რქა",
    qualities: "ცივი და მშრალი",
    description: "ეს არის სტრუქტურის, ანალიზისა და მატერიალური რეალიზაციის ტემპერამენტი. მიწის ნიშნები, ტრადიციული მელანქოლიკებივით, არიან შრომისმოყვარეები, დისციპლინირებულები, პრაქტიკულები და დეტალებზე ორიენტირებულები. მათ უყვართ წესრიგი და საქმის საფუძვლიანად კეთება. სუსტი მხარეა გადამეტებული სიფრთხილე, ჩაკეტილობა და პესიმიზმისკენ მიდრეკილება.",
    sources: [
      ["1", "https://lifeencounter.com/personality-temperament-zodiac-signs-and-what-kind-of-poptart-you-are/"],
      ["2", "https://en.wikipedia.org/wiki/Astrology_and_the_classical_elements"],
      ["3", "https://saptarishisastrology.com/greek-medicine-and-astrology-1-2-by-david-osborn/"],
      ["4", "https://medaybe.com/the-four-temperaments-in-anthroposophy/"],
      ["5", "https://judithfrizlen.com/2021/10/24/do-you-know-your-temperament/"],
      ["6", "https://fourtemperaments.com/4-primary-temperaments/"],
      ["7", "https://www.wattpad.com/713334294-zodiac-scenarios-which-of-the-4-basic-temperaments"],
      ["8", "https://www.scribd.com/document/325090063/Four-Temperament"],
      ["9", "https://en.wikipedia.org/wiki/Four_temperaments"],
    ],
  },
  {
    id: "water",
    icon: "🌊",
    title: "ფლეგმატიკი — წყლის სტიქია",
    signs: "კირჩხიბი, მორიელი, თევზები",
    qualities: "ცივი და ნოტიო",
    description: "ეს არის შინაგანი სამყაროს, გრძნობებისა და მდგრადობის ტემპერამენტი. წყლის ნიშნები, კლასიკური ფლეგმატიკების მსგავსად, გარეგნულად არიან აუღელვებლები, მშვიდები, თავშეკავებულები და ინტროვერტულები. მათ აქვთ მდიდარი შინაგანი ცხოვრება და საოცარი მოთმინების უნარი. სუსტი მხარეა პასიურობა და ცვლილებებისადმი შინაგანი წინააღმდეგობა.",
    sources: [],
  },
] as const;

function getSignName(deg: number): string {
  const idx = Math.floor(((deg % 360) + 360) % 360 / 30);
  return ZODIAC_SIGNS[idx] || "";
}

function calculateElementBalance(planets: WheelPlanet[]) {
  let fire = 0, earth = 0, air = 0, water = 0;
  planets.forEach((planet) => {
    const signIdx = Math.floor(((planet.longitude % 360) + 360) % 360 / 30);
    const element = signIdx % 4;
    if (element === 0) fire++;
    else if (element === 1) earth++;
    else if (element === 2) air++;
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
          {ELEMENT_GUIDES.map((guide) => (
            <article key={guide.id} className="rounded-2xl border border-slate-700/60 bg-slate-950/35 p-3.5 text-xs leading-relaxed text-slate-200 sm:p-4 sm:text-sm">
              <h5 className="mb-2 font-display text-sm font-bold text-amber-200 sm:text-base">{guide.icon} {guide.title}</h5>
              <p><strong className="text-slate-100">ზოდიაქოს ნიშნები:</strong> {guide.signs}.</p>
              <p><strong className="text-slate-100">თვისებები ასტროლოგიაში:</strong> {guide.qualities}.</p>
              <p className="mt-1.5">
                <strong className="text-slate-100">ზოგადი განმარტება:</strong> {guide.description}{" "}
                {guide.sources.length > 0 && (
                  <span className="whitespace-normal">
                    [{guide.sources.map(([label, href], index) => (
                      <span key={label}>
                        {index > 0 && ", "}
                        <a href={href} target="_blank" rel="noreferrer" className="text-amber-300 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-200">{label}</a>
                      </span>
                    ))}]
                  </span>
                )}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
