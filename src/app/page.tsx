"use client";

import { type CSSProperties, useState } from "react";
import { Activity, ArrowRight, Check, Compass, Heart, Orbit, Sparkles, Sun } from "lucide-react";
import AdvancedCalculator from "@/components/AdvancedCalculator";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";

type Tab = "natal" | "synastry" | "transit" | "advanced";

const TABS = [
  { id: "natal", label: "ნატალური", hint: "დაბადების რუკა — პირადი სტრუქტურისა და პოტენციალის ანალიზი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი რუკის შედარება — ურთიერთქმედების ძლიერი და რთული წერტილები", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "მიმდინარე ციური მოძრაობა ნატალურ რუკასთან მიმართებით", icon: Activity },
  { id: "advanced", label: "გაფართოებული", hint: "პროგრესიები, Return-ები, Solar Arc, დაბნელებები და ჰარმონიკები", icon: Orbit },
] as const;

const ZODIAC_SIGNS = [
  { sign: "♈", ruler: "♂", element: "fire", name: "ვერძი" },
  { sign: "♉", ruler: "♀", element: "earth", name: "კურო" },
  { sign: "♊", ruler: "☿", element: "air", name: "ტყუპები" },
  { sign: "♋", ruler: "☽", element: "water", name: "კირჩხიბი" },
  { sign: "♌", ruler: "☉", element: "fire", name: "ლომი" },
  { sign: "♍", ruler: "☿", element: "earth", name: "ქალწული" },
  { sign: "♎", ruler: "♀", element: "air", name: "სასწორი" },
  { sign: "♏", ruler: "♇", element: "water", name: "მორიელი" },
  { sign: "♐", ruler: "♃", element: "fire", name: "მშვილდოსანი" },
  { sign: "♑", ruler: "♄", element: "earth", name: "თხის რქა" },
  { sign: "♒", ruler: "♅", element: "air", name: "მერწყული" },
  { sign: "♓", ruler: "♆", element: "water", name: "თევზები" },
] as const;

const CELESTIAL_CONSTELLATIONS = [
  { planet: "mars", element: "fire", stars: [[22, 60, 2], [38, 35, 2.4], [56, 45, 1.8], [76, 30, 2.2]], lines: [[0, 1], [1, 2], [2, 3]] },
  { planet: "venus", element: "earth", stars: [[20, 68, 2], [32, 45, 2.4], [47, 30, 2.8], [57, 47, 2], [73, 58, 2.5], [86, 40, 1.8]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { planet: "mercury", element: "air", stars: [[28, 75, 2], [35, 52, 2.6], [30, 30, 1.9], [48, 43, 2.4], [68, 28, 2.1], [76, 50, 2.5]], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5]] },
  { planet: "moon", element: "water", stars: [[26, 45, 2.2], [45, 28, 2.6], [58, 46, 1.9], [80, 35, 2.4], [66, 68, 2.1]], lines: [[0, 1], [1, 2], [2, 3], [2, 4]] },
  { planet: "sun", element: "fire", stars: [[20, 58, 2], [32, 37, 2.7], [48, 28, 2.2], [62, 44, 2.8], [80, 32, 2], [72, 65, 2.5], [47, 64, 1.8]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 1]] },
  { planet: "mercury", element: "earth", stars: [[18, 65, 2], [34, 48, 2.6], [47, 28, 2.1], [55, 52, 2.4], [74, 42, 2], [87, 60, 2.5]], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5]] },
  { planet: "venus", element: "air", stars: [[23, 40, 2], [43, 30, 2.3], [60, 55, 2.8], [80, 42, 2.2]], lines: [[0, 1], [1, 2], [2, 3]] },
  { planet: "pluto", element: "water", stars: [[18, 30, 2], [35, 43, 2.4], [46, 60, 2.8], [63, 54, 2], [74, 73, 2.5], [88, 66, 1.9]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]] },
  { planet: "jupiter", element: "fire", stars: [[20, 70, 2], [28, 50, 2.5], [48, 48, 2], [60, 30, 2.8], [72, 44, 2], [89, 28, 2.2]], lines: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5]] },
  { planet: "saturn", element: "earth", stars: [[24, 42, 2], [42, 27, 2.5], [56, 48, 2.2], [76, 38, 2.6], [84, 64, 2], [62, 73, 2.4]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 2]] },
  { planet: "uranus", element: "air", stars: [[18, 28, 2], [35, 45, 2.4], [54, 33, 2], [63, 58, 2.7], [83, 44, 2.2], [88, 70, 1.8]], lines: [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5]] },
  { planet: "neptune", element: "water", stars: [[22, 35, 2], [42, 55, 2.6], [59, 30, 2.2], [76, 44, 2.4], [86, 68, 1.9]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
] as const;

const CELESTIAL_PLANET_META = {
  mars: { name: "მარსი", glyph: "♂", description: "ენერგიისა და მოქმედების მმართველი" },
  venus: { name: "ვენერა", glyph: "♀", description: "მიზიდულობისა და ღირებულებების მმართველი" },
  mercury: { name: "მერკური", glyph: "☿", description: "აზროვნებისა და კომუნიკაციის მმართველი" },
  moon: { name: "მთვარე", glyph: "☽", description: "ემოციური რიტმისა და შინაგანი სამყაროს მმართველი მნათობი" },
  sun: { name: "მზე", glyph: "☉", description: "სიცოცხლისა და თვითგამოხატვის მმართველი მნათობი" },
  pluto: { name: "პლუტონი", glyph: "♇", description: "ტრანსფორმაციისა და ღრმა ცვლილებების მმართველი" },
  jupiter: { name: "იუპიტერი", glyph: "♃", description: "ზრდისა და გაფართოების მმართველი" },
  saturn: { name: "სატურნი", glyph: "♄", description: "სტრუქტურისა და პასუხისმგებლობის მმართველი" },
  uranus: { name: "ურანი", glyph: "♅", description: "გარდაქმნისა და თავისუფლების მმართველი" },
  neptune: { name: "ნეპტუნი", glyph: "♆", description: "ინტუიციისა და წარმოსახვის მმართველი" },
} as const;

type CelestialTarget = number | "earth" | null;

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("natal");
  const [hoveredCelestial, setHoveredCelestial] = useState<CelestialTarget>(null);
  const [selectedCelestial, setSelectedCelestial] = useState<CelestialTarget>(null);
  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];
  const activeCelestial = selectedCelestial ?? hoveredCelestial;
  const activePlanetIndex = typeof activeCelestial === "number" ? activeCelestial : null;
  const activePlanet = activePlanetIndex === null
    ? null
    : CELESTIAL_PLANET_META[CELESTIAL_CONSTELLATIONS[activePlanetIndex].planet as keyof typeof CELESTIAL_PLANET_META];
  const activeSign = activePlanetIndex === null ? null : ZODIAC_SIGNS[activePlanetIndex];

  return (
    <div className="app-home">
      <section className="hero-grid">
        <div>
          <div className="hero-kicker"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> SWISS EPHEMERIS · PRECISION ENGINE</div>
          <h1 className="hero-title">თქვენი რუკა.<br /><em>უფრო ღრმად.</em></h1>
          <p className="hero-lead">მკაფიო, მუქი და პროფესიონალური სამუშაო სივრცე ნატალური, სინასტრიული და ტრანზიტული რუკებისთვის — გამოთვლები იწყება ზუსტი ციური მონაცემებით.</p>
          <div className="hero-actions">
            <a href="#calculator" className="primary-action"><Compass className="h-4 w-4" /> რუკის შექმნა <ArrowRight className="h-4 w-4" /></a>
            <a href="#method" className="secondary-action"><Sparkles className="h-4 w-4" /> როგორ მუშაობს</a>
          </div>
        </div>
        <div className="hero-orbit-card" aria-label="ციური გამოთვლის ვიზუალური მოდული">
          <div className="celestial-system" role="group" aria-label="12 ზოდიაქოს ასტროლოგიური სარტყელი, მმართველი მნათობები და ცენტრში დედამიწა">
            <div className="celestial-star-noise" aria-hidden="true" />
            <div className="celestial-orbit celestial-orbit-wide" aria-hidden="true" />
            <div className="celestial-orbit celestial-orbit-inner" aria-hidden="true" />
            <div className="celestial-constellation-ring" aria-hidden="true">
              {CELESTIAL_CONSTELLATIONS.map((item, index) => (
                <div
                  key={`constellation-${index}`}
                  className={`celestial-constellation celestial-element-${item.element}`}
                  style={{ "--celestial-angle": `${index * 30}deg` } as CSSProperties}
                >
                  <svg viewBox="0 0 100 100" className="constellation-art">
                    {item.lines.map(([from, to]) => (
                      <line
                        key={`${from}-${to}`}
                        x1={item.stars[from]![0]}
                        y1={item.stars[from]![1]}
                        x2={item.stars[to]![0]}
                        y2={item.stars[to]![1]}
                      />
                    ))}
                    {item.stars.map(([cx, cy, radius], starIndex) => (
                      <circle key={starIndex} cx={cx} cy={cy} r={radius} />
                    ))}
                  </svg>
                </div>
              ))}
            </div>
            <div className="celestial-ruler-ring">
              {CELESTIAL_CONSTELLATIONS.map((item, index) => (
                <button
                  type="button"
                  key={`ruler-${item.planet}-${index}`}
                  className={`celestial-ruler celestial-ruler-${item.planet}${selectedCelestial === index ? " is-active" : ""}`}
                  style={{ "--celestial-angle": `${index * 30}deg` } as CSSProperties}
                  aria-label={`${ZODIAC_SIGNS[index].name} — ${CELESTIAL_PLANET_META[item.planet as keyof typeof CELESTIAL_PLANET_META].name}`}
                  aria-pressed={selectedCelestial === index}
                  onMouseEnter={() => setHoveredCelestial(index)}
                  onMouseLeave={() => setHoveredCelestial(null)}
                  onFocus={() => setHoveredCelestial(index)}
                  onBlur={() => setHoveredCelestial(null)}
                  onClick={() => setSelectedCelestial((current) => current === index ? null : index)}
                >
                  <span className="celestial-ruler-zodiac" aria-hidden="true">{ZODIAC_SIGNS[index].sign}</span>
                  <span className="celestial-ruler-planet-symbol" aria-hidden="true">{ZODIAC_SIGNS[index].ruler}</span>
                  <span className="celestial-ruler-glow" />
                  <span className="celestial-ruler-body" />
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`celestial-earth${selectedCelestial === "earth" ? " is-active" : ""}`}
              aria-label="დედამიწა — ციური დაკვირვების ცენტრი"
              aria-pressed={selectedCelestial === "earth"}
              onMouseEnter={() => setHoveredCelestial("earth")}
              onMouseLeave={() => setHoveredCelestial(null)}
              onFocus={() => setHoveredCelestial("earth")}
              onBlur={() => setHoveredCelestial(null)}
              onClick={() => setSelectedCelestial((current) => current === "earth" ? null : "earth")}
            >
              <span className="celestial-earth-clouds" />
            </button>
            <div className="celestial-earth-halo" aria-hidden="true" />
            {activeCelestial !== null && (
              <div
                className={`celestial-info-card ${activeCelestial === "earth" ? "celestial-info-earth" : `celestial-info-${CELESTIAL_CONSTELLATIONS[activePlanetIndex!].planet}`}`}
                aria-live="polite"
              >
                {activeCelestial === "earth" ? (
                  <>
                    <span className="celestial-info-eyebrow">ციური დაკვირვების ცენტრი</span>
                    <strong>დედამიწა</strong>
                    <p>ციური სფეროსა და ეკლიპტიკური სარტყლის დამკვირვებლის ცენტრალური წერტილი.</p>
                    <span className="celestial-info-tags">12 ნიშანი · ეკლიპტიკური სარტყელი · Swiss Ephemeris</span>
                  </>
                ) : (
                  <>
                    <span className="celestial-info-eyebrow">თანავარსკვლავედი {activeSign?.name}</span>
                    <strong>{activeSign?.sign} · მმართველი მნათობი {activePlanet?.name}</strong>
                    <p>{activePlanet?.description}</p>
                    <span className="celestial-info-tags">{activePlanet?.glyph} {activePlanet?.name} · {activeSign?.element}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="zodiac-aura" aria-hidden="true" />
          <div className="element-frame element-frame-fire" aria-hidden="true"><span>△</span></div>
          <div className="element-frame element-frame-earth" aria-hidden="true"><span>◇</span></div>
          <div className="element-frame element-frame-air" aria-hidden="true"><span>⌁</span></div>
          <div className="element-frame element-frame-water" aria-hidden="true"><span>▽</span></div>
          <div className="zodiac-wheel" aria-hidden="true">
            <div className="zodiac-wheel-shadow" />
            <div className="zodiac-disc">
              {ZODIAC_SIGNS.map((item, index) => (
                <div
                  key={item.sign}
                  className={`zodiac-sign zodiac-sign-${item.element}`}
                  style={{ "--zodiac-angle": `${index * 30}deg` } as CSSProperties}
                  title={`${item.name} — ${item.ruler}`}
                >
                  <span className="zodiac-glyph">{item.sign}</span>
                  <span className="zodiac-ruler">{item.ruler}</span>
                </div>
              ))}
              <div className="zodiac-inner-orbit" />
              <div className="zodiac-crosshair zodiac-crosshair-horizontal" />
              <div className="zodiac-crosshair zodiac-crosshair-vertical" />
              <div className="zodiac-core">
                <span className="zodiac-core-symbol">✦</span>
                <span className="zodiac-core-orbit" />
              </div>
            </div>
          </div>
          <div className="orbit-ring orbit-ring-two" />
          <div className="orbit-core" />
          <span className="orbit-dot orbit-dot-one" /><span className="orbit-dot orbit-dot-two" /><span className="orbit-dot orbit-dot-three" />
          <div className="hero-orbit-meta"><span>Swiss / fallback ready</span><span>0°—360°</span></div>
        </div>
      </section>

      <section id="calculator" className="app-section">
        <div className="section-heading">
          <div><div className="hero-kicker">WORKSPACE</div><h2>აირჩიეთ ანალიზის ტიპი</h2></div>
          <p>ერთი მშვიდი სამუშაო სივრცე ყველა რუკისთვის. ფორმა იცვლება არჩეული მეთოდის მიხედვით.</p>
        </div>
        <div className="mode-switcher" role="tablist" aria-label="რუკის ტიპი">
          {TABS.map((item) => {
            const Icon = item.icon;
            const selected = tab === item.id;
            return (
              <button key={item.id} type="button" data-active={selected} onClick={() => setTab(item.id)} role="tab" aria-selected={selected}>
                <Icon className="mx-auto mb-1 h-4 w-4" />
                <span className="block truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="h-1.5 w-1.5 rounded-full bg-violet-300" />{activeTab.hint}</div>
        <div className="mt-6">
          {tab === "natal" && <NatalCalculator />}
          {tab === "synastry" && <SynastryCalculator />}
          {tab === "transit" && <TransitCalculator />}
          {tab === "advanced" && <AdvancedCalculator />}
        </div>
      </section>

      <section id="method" className="home-features">
        <div className="home-feature"><h3><Check className="mr-1 inline h-4 w-4 text-violet-300" /> ზუსტი ეფემერიდი</h3><p>Swiss Ephemeris თანამედროვე თარიღებზე, უსაფრთხო fallback ისტორიულ დიაპაზონზე.</p></div>
        <div className="home-feature"><h3><Check className="mr-1 inline h-4 w-4 text-violet-300" /> გამჭვირვალე ანალიზი</h3><p>ორბები, კუთხეები, ღირსებები, დეკლინაციები და მეთოდის წყაროები ცალკე ფენებად.</p></div>
        <div className="home-feature"><h3><Check className="mr-1 inline h-4 w-4 text-violet-300" /> პირადი სამუშაო სივრცე</h3><p>შეინახეთ რუკები კაბინეტში და მართეთ წვდომა ერთი მშვიდი ინტერფეისიდან.</p></div>
      </section>
    </div>
  );
}
