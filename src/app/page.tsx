"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Bot, Check, Clock, Compass, Heart, Orbit, Sparkles, Sun } from "lucide-react";
import AdvancedCalculator from "@/components/AdvancedCalculator";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import ElementTemperamentSummary from "@/components/ElementTemperamentSummary";
import { ELEMENT_TEMPERAMENTS, type ElementTemperamentId } from "@/lib/elementTemperaments";
import SocialProofTicker from "@/components/SocialProofTicker";
import BentoGrid from "@/components/BentoGrid";
import PricingTable from "@/components/PricingTable";
import CtaSection from "@/components/CtaSection";
import AiAstrologyAssistant from "@/components/AiAstrologyAssistant";
import RectificationCalculator from "@/components/RectificationCalculator";
import KnowledgeHub from "@/components/KnowledgeHub";
import ExpertConsultationBooking from "@/components/ExpertConsultationBooking";

type Tab = "natal" | "synastry" | "transit" | "advanced" | "ai" | "rectification";

const TABS = [
  { id: "natal", label: "ნატალური", hint: "დაბადების რუკა — პირადი სტრუქტურისა და პოტენციალის ანალიზი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი რუკის შედარება — ურთიერთქმედების ძლიერი და რთული წერტილები", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "მიმდინარე ციური მოძრაობა ნატალურ რუკასთან მიმართებით", icon: Activity },
  { id: "advanced", label: "გაფართოებული", hint: "პროგრესიები, Return-ები, Solar Arc, დაბნელებები და ჰარმონიკები", icon: Orbit },
  { id: "ai", label: "Gemini AI ანალიზი", hint: "ხელოვნური ინტელექტის სიღრმისეული ასტროლოგიური ინტერპრეტაცია", icon: Bot },
  { id: "rectification", label: "რექტიფიკაცია", hint: "დაბადების ზუსტი წუთების დადგენა ცხოვრებისეული მოვლენების მიხედვით", icon: Clock },
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
  mars: { name: "მარსი", glyph: "♂", kind: "პლანეტა", description: "ენერგიისა და მოქმედების მმართველი" },
  venus: { name: "ვენერა", glyph: "♀", kind: "პლანეტა", description: "მიზიდულობისა და ღირებულებების მმართველი" },
  mercury: { name: "მერკური", glyph: "☿", kind: "პლანეტა", description: "აზროვნებისა და კომუნიკაციის მმართველი" },
  moon: { name: "მთვარე", glyph: "☽", kind: "მნათობი", description: "ემოციური რიტმისა და შინაგანი სამყაროს მმართველი მნათობი" },
  sun: { name: "მზე", glyph: "☉", kind: "მნათობი", description: "სიცოცხლისა და თვითგამოხატვის მმართველი მნათობი" },
  pluto: { name: "პლუტონი", glyph: "♇", kind: "პლანეტა", description: "ტრანსფორმაციისა და ღრმა ცვლილებების მმართველი" },
  jupiter: { name: "იუპიტერი", glyph: "♃", kind: "პლანეტა", description: "ზრდისა და გაფართოების მმართველი" },
  saturn: { name: "სატურნი", glyph: "♄", kind: "პლანეტა", description: "სტრუქტურისა და პასუხისმგებლობის მმართველი" },
  uranus: { name: "ურანი", glyph: "♅", kind: "პლანეტა", description: "გარდაქმნისა და თავისუფლების მმართველი" },
  neptune: { name: "ნეპტუნი", glyph: "♆", kind: "პლანეტა", description: "ინტუიციისა და წარმოსახვის მმართველი" },
} as const;

const ELEMENT_GROUPS = [
  { id: "fire", name: "ცეცხლი", symbol: ELEMENT_TEMPERAMENTS.fire.symbol, signs: [{ name: "ვერძი", symbol: "♈" }, { name: "ლომი", symbol: "♌" }, { name: "მშვილდოსანი", symbol: "♐" }], planets: [{ name: "მარსი", symbol: "♂" }, { name: "მზე", symbol: "☉" }, { name: "იუპიტერი", symbol: "♃" }] },
  { id: "earth", name: "მიწა", symbol: ELEMENT_TEMPERAMENTS.earth.symbol, signs: [{ name: "კურო", symbol: "♉" }, { name: "ქალწული", symbol: "♍" }, { name: "თხის რქა", symbol: "♑" }], planets: [{ name: "ვენერა", symbol: "♀" }, { name: "მერკური", symbol: "☿" }, { name: "სატურნი", symbol: "♄" }] },
  { id: "air", name: "ჰაერი", symbol: ELEMENT_TEMPERAMENTS.air.symbol, signs: [{ name: "ტყუპები", symbol: "♊" }, { name: "სასწორი", symbol: "♎" }, { name: "მერწყული", symbol: "♒" }], planets: [{ name: "მერკური", symbol: "☿" }, { name: "ვენერა", symbol: "♀" }, { name: "ურანი", symbol: "♅" }] },
  { id: "water", name: "წყალი", symbol: ELEMENT_TEMPERAMENTS.water.symbol, signs: [{ name: "კირჩხიბი", symbol: "♋" }, { name: "მორიელი", symbol: "♏" }, { name: "თევზები", symbol: "♓" }], planets: [{ name: "მთვარე", symbol: "☽" }, { name: "პლუტონი", symbol: "♇" }, { name: "ნეპტუნი", symbol: "♆" }] },
] as const;

type CelestialTarget = number | "earth" | null;

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("natal");
  const [hoveredCelestial, setHoveredCelestial] = useState<CelestialTarget>(null);
  const [selectedCelestial, setSelectedCelestial] = useState<CelestialTarget>(null);
  const [selectedElementInfo, setSelectedElementInfo] = useState<ElementTemperamentId | null>(null);
  const elementTriggerRef = useRef<HTMLElement | null>(null);
  const elementCloseRef = useRef<HTMLButtonElement>(null);
  const layoutElementInfo = selectedElementInfo;
  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];
  const activeCelestial = selectedCelestial ?? hoveredCelestial;
  const activePlanetIndex = typeof activeCelestial === "number" ? activeCelestial : null;
  const activePlanet = activePlanetIndex === null
    ? null
    : CELESTIAL_PLANET_META[CELESTIAL_CONSTELLATIONS[activePlanetIndex].planet as keyof typeof CELESTIAL_PLANET_META];
  const activeSign = activePlanetIndex === null ? null : ZODIAC_SIGNS[activePlanetIndex];

  const toggleElementInfo = (elementId: ElementTemperamentId) => {
    setSelectedElementInfo((current) => {
      const isSameElement = current === elementId;
      return isSameElement ? null : elementId;
    });
  };

  useEffect(() => {
    if (!selectedElementInfo) {
      elementTriggerRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = "hidden";
    if (scrollbarGap) document.body.style.paddingRight = `${bodyPaddingRight + scrollbarGap}px`;
    elementCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedElementInfo(null);
      }
      if (event.key !== "Tab") return;
      const dialog = document.querySelector<HTMLElement>(".celestial-temperament-card.is-visible");
      const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElementInfo]);

  return (
    <div className="app-home">
      <section className="hero-grid">
        <div>
          <div className="hero-kicker inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-950/30 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <span className="live-beacon" /> SWISS EPHEMERIS · PRECISION AURORA ENGINE v2.1
          </div>
          <h1 className="hero-title mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            თქვენი ცის რუკა. <br />
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-300 to-rose-300 bg-clip-text text-transparent">
              უფრო ღრმად და ზუსტად.
            </span>
          </h1>
          <p className="hero-lead mt-5 max-w-xl text-base leading-relaxed text-slate-300">
            შვეიცარული ეფემერიდის მათემატიკური ალგორითმები, 4 სტიქიის ტემპერამენტის სინთეზი და პროფესიონალური სივრცე ნატალური, სინასტრიული და ტრანზიტული რუკებისთვის.
          </p>
          <div className="hero-actions mt-8 flex flex-wrap items-center gap-4">
            <a href="#calculator" className="primary-action shadow-lg shadow-cyan-500/20">
              <Compass className="h-4 w-4" /> რუკის შექმნა <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#features" className="secondary-action">
              <Sparkles className="h-4 w-4 text-cyan-300" /> შესაძლებლობები
            </a>
            <a href="#pricing" className="secondary-action hidden sm:inline-flex">
              ტარიფები
            </a>
          </div>
        </div>
        <div className="hero-orbit-card hover-glass-lift" aria-label="ციური გამოთვლის ვიზუალური მოდული">
          <div
            className={`celestial-system${layoutElementInfo ? ` has-element-info element-info-${layoutElementInfo}` : ""}`}
            role="group"
            aria-label="12 ზოდიაქოს ასტროლოგიური სარტყელი, მმართველი მნათობები და ცენტრში დედამიწა"
            onClick={(event) => {
              const target = event.target as Element;
              if (!target.closest("button, .celestial-element-panel, .celestial-info-card")) {
                setSelectedCelestial(null);
                setHoveredCelestial(null);
                setSelectedElementInfo(null);
              }
            }}
          >
            <div className="celestial-star-noise" aria-hidden="true" />
            {ELEMENT_GROUPS.map((element) => (
              <section
                key={element.id}
                className={`celestial-element-panel celestial-element-panel-${element.id}${selectedElementInfo === element.id ? " is-info-open" : ""}`}
                aria-label={`${element.name} სტიქია`}
                aria-expanded={selectedElementInfo === element.id}
                role="group"
                data-info-placement={element.id === "fire" || element.id === "earth" ? "below" : "above"}
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  elementTriggerRef.current = event.currentTarget;
                  toggleElementInfo(element.id);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  toggleElementInfo(element.id);
                }}
              >
                <div className="celestial-element-heading">
                  <span className="celestial-element-symbol" aria-hidden="true">{element.symbol}</span>
                  <div>
                    <span className="celestial-element-kicker">სტიქია</span>
                    <strong>{element.name}</strong>
                  </div>
                </div>
                <div className="celestial-element-row celestial-element-zodiacs">
                  <span className="celestial-element-label">ზოდიაქოები</span>
                  <div className="celestial-element-items">
                    {element.signs.map((sign) => <span key={sign.name} title={sign.name}><b>{sign.symbol}</b></span>)}
                  </div>
                </div>
                <div className="celestial-element-row celestial-element-rulers">
                  <span className="celestial-element-label">მმართველები</span>
                  <div className="celestial-element-items">
                    {element.planets.map((planet) => <span key={planet.name} title={planet.name}><b>{planet.symbol}</b></span>)}
                  </div>
                </div>
                <div
                  className={`celestial-temperament-card celestial-temperament-card-${element.id} celestial-temperament-card-${element.id === "fire" || element.id === "earth" ? "below" : "above"}${selectedElementInfo === element.id ? " is-visible is-pinned" : ""}`}
                  role={selectedElementInfo === element.id ? "dialog" : undefined}
                  aria-modal={selectedElementInfo === element.id ? true : undefined}
                  aria-label={selectedElementInfo === element.id ? `${element.name} სტიქიის განმარტება` : undefined}
                  onClick={(event) => event.stopPropagation()}
                  onWheel={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                    <button
                      type="button"
                      className="celestial-temperament-close"
                      ref={selectedElementInfo === element.id ? elementCloseRef : undefined}
                      aria-label="ინფორმაციის დახურვა"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedElementInfo(null);
                      }}
                    >
                      ×
                    </button>
                    <div className="celestial-temperament-content">
                      <ElementTemperamentSummary element={element.id} />
                    </div>
                </div>
              </section>
            ))}
            {layoutElementInfo && (
              <button
                type="button"
                className="celestial-element-overlay"
                aria-label="სტიქიის განმარტების დახურვა"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedElementInfo(null);
                }}
              />
            )}
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
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedCelestial((current) => {
                      const isSamePlanet = current === index;
                      if (isSamePlanet) setHoveredCelestial(null);
                      return isSamePlanet ? null : index;
                    });
                  }}
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
              onClick={(event) => {
                event.stopPropagation();
                setSelectedCelestial((current) => {
                  const isSameEarth = current === "earth";
                  if (isSameEarth) setHoveredCelestial(null);
                  return isSameEarth ? null : "earth";
                });
              }}
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
                    <strong>{activeSign?.sign} · მმართველი {activePlanet?.kind} {activePlanet?.name}</strong>
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

      {/* Social Proof Infinite Ticker Strip */}
      <div className="my-10 -mx-4 sm:-mx-8 lg:-mx-12 xl:-mx-16">
        <SocialProofTicker />
      </div>

      {/* Main Interactive Astrological Calculation Workspace */}
      <section id="calculator" className="app-section relative my-16 rounded-3xl border border-white/[0.08] bg-[#0c101a]/70 p-6 shadow-2xl backdrop-blur-2xl sm:p-10 scroll-mt-24">
        {/* Specular top glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[1px] w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />

        <div className="section-heading mb-8">
          <div>
            <div className="hero-kicker inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span className="live-beacon mr-1.5" /> WORKSPACE
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              აირჩიეთ ანალიზის ტიპი
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            ერთი მშვიდი, მაღალი სიზუსტის სამუშაო სივრცე ყველა რუკისთვის. ფორმა ავტომატურად ადაპტირდება არჩეულ მეთოდზე.
          </p>
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
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="live-beacon" />{activeTab.hint}
        </div>
        <div className="mt-8">
          {tab === "natal" && <NatalCalculator />}
          {tab === "synastry" && <SynastryCalculator />}
          {tab === "transit" && <TransitCalculator />}
          {tab === "advanced" && <AdvancedCalculator />}
          {tab === "ai" && <AiAstrologyAssistant />}
          {tab === "rectification" && <RectificationCalculator />}
        </div>
      </section>

      {/* 6-Card Bento Box Feature Showcase */}
      <BentoGrid />

      {/* Astrological Knowledge Hub & Insights Academy */}
      <KnowledgeHub />

      {/* 1-on-1 Certified Astrologer Consultation Booking */}
      <ExpertConsultationBooking />

      {/* 3-Tier Pricing Table */}
      <PricingTable />

      {/* High-Converting Glassmorphic Call To Action */}
      <CtaSection />
    </div>
  );
}
