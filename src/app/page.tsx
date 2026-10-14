"use client";

import Image from "next/image";
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Bot, Check, Clock, Compass, Heart, Orbit, Sparkles, Sun, X } from "lucide-react";
import AdvancedCalculator from "@/components/AdvancedCalculator";
import NatalCalculator from "@/components/NatalCalculator";
import SynastryCalculator from "@/components/SynastryCalculator";
import TransitCalculator from "@/components/TransitCalculator";
import ElementTemperamentSummary from "@/components/ElementTemperamentSummary";
import { ELEMENT_TEMPERAMENTS, type ElementTemperamentId } from "@/lib/elementTemperaments";
import SocialProofTicker from "@/components/SocialProofTicker";
import BentoGrid from "@/components/BentoGrid";
import PricingTable from "@/components/PricingTable";
import AiAstrologyAssistant from "@/components/AiAstrologyAssistant";
import RectificationCalculator from "@/components/RectificationCandidateCalculator";
import KnowledgeHub from "@/components/KnowledgeHub";
import ExpertConsultationBooking from "@/components/ExpertConsultationBooking";
import CelestialFireOverlay, { preloadCelestialFireVideo } from "@/components/CelestialFireOverlay";
import { useMe } from "@/lib/useMe";

type Tab = "natal" | "synastry" | "transit" | "advanced" | "ai" | "rectification";

const TABS = [
  { id: "natal", label: "ნატალური", hint: "დაბადების რუკა — პირადი სტრუქტურისა და პოტენციალის ანალიზი", icon: Sun },
  { id: "synastry", label: "სინასტრია", hint: "ორი რუკის შედარება — ურთიერთქმედების ძლიერი და რთული წერტილები", icon: Heart },
  { id: "transit", label: "ტრანზიტები", hint: "მიმდინარე ციური მოძრაობა ნატალურ რუკასთან მიმართებით", icon: Activity },
  { id: "advanced", label: "გაფართოებული", hint: "პროგრესიები, დაბრუნებები, სოლარული არკი, დაბნელებები და ჰარმონიკები", icon: Orbit },
  { id: "ai", label: "Gemini AI ანალიზი", hint: "Gemini API-ით შექმნილი ასტროლოგიური ინტერპრეტაცია", icon: Bot },
  { id: "rectification", label: "რექტიფიკაცია", hint: "Solar Arc-ის დროითი კანდიდატების შედარება ცხოვრებისეულ მოვლენებთან", icon: Clock },
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

const CELESTIAL_IMAGE: Record<keyof typeof CELESTIAL_PLANET_META | "earth", string> = {
  sun: "/celestial/sun.webp",
  moon: "/celestial/moon.webp",
  mercury: "/celestial/mercury.webp",
  venus: "/celestial/venus.webp",
  earth: "/celestial/earth.webp",
  mars: "/celestial/mars.webp",
  jupiter: "/celestial/jupiter.webp",
  saturn: "/celestial/saturn.webp",
  uranus: "/celestial/uranus.webp",
  neptune: "/celestial/neptune.webp",
  pluto: "/celestial/pluto.webp",
};

const ZODIAC_IMAGE = [
  "/zodiac/1-ვერძი.png",
  "/zodiac/2-კურო.png",
  "/zodiac/3-ტყუპი.png",
  "/zodiac/4-კირჩხიბი.png",
  "/zodiac/5-ლომი.png",
  "/zodiac/6-ქალწული.png",
  "/zodiac/7-სასწორი.png",
  "/zodiac/8-მორიელი.png",
  "/zodiac/9-მშვილდოსანი.png",
  "/zodiac/10-თხის რქა.png",
  "/zodiac/11-მერწყული.png",
  "/zodiac/12-თვზები.png",
].map((path) => encodeURI(path.replace(/\.png$/i, ".webp")));

const ELEMENT_GROUPS = [
  { id: "fire", name: "ცეცხლი", symbol: ELEMENT_TEMPERAMENTS.fire.symbol, signs: [{ name: "ვერძი", symbol: "♈" }, { name: "ლომი", symbol: "♌" }, { name: "მშვილდოსანი", symbol: "♐" }], planets: [{ name: "მარსი", symbol: "♂" }, { name: "მზე", symbol: "☉" }, { name: "იუპიტერი", symbol: "♃" }] },
  { id: "earth", name: "მიწა", symbol: ELEMENT_TEMPERAMENTS.earth.symbol, signs: [{ name: "კურო", symbol: "♉" }, { name: "ქალწული", symbol: "♍" }, { name: "თხის რქა", symbol: "♑" }], planets: [{ name: "ვენერა", symbol: "♀" }, { name: "მერკური", symbol: "☿" }, { name: "სატურნი", symbol: "♄" }] },
  { id: "air", name: "ჰაერი", symbol: ELEMENT_TEMPERAMENTS.air.symbol, signs: [{ name: "ტყუპები", symbol: "♊" }, { name: "სასწორი", symbol: "♎" }, { name: "მერწყული", symbol: "♒" }], planets: [{ name: "მერკური", symbol: "☿" }, { name: "ვენერა", symbol: "♀" }, { name: "ურანი", symbol: "♅" }] },
  { id: "water", name: "წყალი", symbol: ELEMENT_TEMPERAMENTS.water.symbol, signs: [{ name: "კირჩხიბი", symbol: "♋" }, { name: "მორიელი", symbol: "♏" }, { name: "თევზები", symbol: "♓" }], planets: [{ name: "მთვარე", symbol: "☽" }, { name: "პლუტონი", symbol: "♇" }, { name: "ნეპტუნი", symbol: "♆" }] },
] as const;

type CelestialTarget = number | "earth" | null;

const preloadedCelestialImages = new Map<string, HTMLImageElement>();

function preloadCelestialImages(sources: string[]) {
  if (typeof window === "undefined") return;
  sources.forEach((src) => {
    if (preloadedCelestialImages.has(src)) return;
    const image = new window.Image();
    image.decoding = "async";
    image.fetchPriority = "high";
    image.src = src;
    preloadedCelestialImages.set(src, image);
    void image.decode().catch(() => undefined);
  });
}

export default function HomePage() {
  const me = useMe();
  const [tab, setTab] = useState<Tab>("natal");
  const [hoveredCelestial, setHoveredCelestial] = useState<CelestialTarget>(null);
  const [selectedCelestial, setSelectedCelestial] = useState<CelestialTarget>(null);
  const [celestialAnimationRun, setCelestialAnimationRun] = useState(0);
  const [selectedElementInfo, setSelectedElementInfo] = useState<ElementTemperamentId | null>(null);
  const elementTriggerRef = useRef<HTMLButtonElement | null>(null);
  const celestialSystemRef = useRef<HTMLDivElement | null>(null);
  const celestialStageRef = useRef<HTMLDivElement | null>(null);
  const zodiacStageRef = useRef<HTMLDivElement | null>(null);
  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];
  const activeCelestial = selectedCelestial ?? hoveredCelestial;
  const activePlanetIndex = typeof activeCelestial === "number" ? activeCelestial : null;
  const activePlanet = activePlanetIndex === null
    ? null
    : CELESTIAL_PLANET_META[CELESTIAL_CONSTELLATIONS[activePlanetIndex].planet as keyof typeof CELESTIAL_PLANET_META];
  const activeSign = activePlanetIndex === null ? null : ZODIAC_SIGNS[activePlanetIndex];
  const activeCelestialImage = activeCelestial === null
    ? null
    : CELESTIAL_IMAGE[activeCelestial === "earth" ? "earth" : CELESTIAL_CONSTELLATIONS[activePlanetIndex!].planet];
  const activeZodiacImage = activePlanetIndex === null ? null : ZODIAC_IMAGE[activePlanetIndex];

  useEffect(() => {
    preloadCelestialFireVideo();
    preloadCelestialImages([...ZODIAC_IMAGE, ...Object.values(CELESTIAL_IMAGE)]);
  }, []);

  useEffect(() => {
    const clearCelestialSelection = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".celestial-ruler, .celestial-earth")) return;
      setSelectedCelestial(null);
      setHoveredCelestial(null);
    };

    document.addEventListener("pointerdown", clearCelestialSelection, true);
    return () => document.removeEventListener("pointerdown", clearCelestialSelection, true);
  }, []);

  useLayoutEffect(() => {
    if (selectedCelestial === null) return;

    const system = celestialSystemRef.current;
    const stage = celestialStageRef.current;
    if (!system || !stage) return;

    const updateSize = () => {
      const bounds = system.getBoundingClientRect();
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;

      // 1. Calculate the exact outer boundary of the central planetary ring & constellation halo
      const rulers = system.querySelectorAll<HTMLButtonElement>(".celestial-ruler");
      const ruler = (activePlanetIndex !== null ? rulers[activePlanetIndex] : rulers[0]) ?? rulers[0];

      let orbitRadius = Math.min(bounds.width, bounds.height) * 0.28;
      let rulerRadius = orbitRadius;
      let systemOuterRadius = orbitRadius * 1.35;

      if (ruler) {
        const rulerBounds = ruler.getBoundingClientRect();
        const rulerCenterX = rulerBounds.left - bounds.left + rulerBounds.width / 2;
        const rulerCenterY = rulerBounds.top - bounds.top + rulerBounds.height / 2;
        orbitRadius = Math.hypot(rulerCenterX - centerX, rulerCenterY - centerY);
        rulerRadius = orbitRadius + rulerBounds.width * 0.5;
        systemOuterRadius = rulerRadius + 14;
      }

      // Green Line: Horizontal upper boundary across the entire celestial module
      // Passes below the top 12 o'clock planet across the upper chord of the planetary circle (~28-32% from top).
      // Neither the right-side planet person NOR the left-side zodiac creature may extend above this line.
      const greenLineY = Math.max(bounds.height * 0.26, centerY - orbitRadius * 0.52);


      // 2. Right-side Celestial Human stage calculation (Native aspect ratio 768 / 1024 = 0.75)
      // Enlarged scale (+20%), shifted leftward away from extreme frame edge, flush to bottom edge (0px).
      // Scales dynamically and proportionally with window resize.
      const imageAspect = 768 / 1024; // 0.75
      const isMobile = bounds.width <= 640;

      // Moderate shift to the left away from the right frame border without leaving an empty void
      const frameRight = isMobile
        ? Math.max(6, Math.min(12, bounds.width * 0.018))
        : Math.max(38, Math.min(54, bounds.width * 0.032 + 12));
      const humanFrameBottom = 0; // Pinned flush to the bottom edge

      // Upper ceiling: allows enlarged human artwork to scale dynamically and proportionally with viewport
      const humanGreenLineY = Math.max(bounds.height * 0.10, centerY - orbitRadius * 0.75);
      const maxHumanHeightAllowed = Math.max(0, bounds.height - humanGreenLineY - 4);
      const maxWidthFromHeight = maxHumanHeightAllowed * imageAspect;

      // Horizontal space to the right of the central planetary ring
      const ringRightX = centerX + systemOuterRadius;
      const safeCircleGapRight = isMobile ? 6 : 10;
      const availableSpaceRight = Math.max(0, bounds.width - ringRightX - frameRight - safeCircleGapRight);
      const maxHumanWidthCap = Math.min(680, bounds.width * (isMobile ? 0.40 : 0.52));

      let stageWidth: number;
      if (isMobile) {
        // On mobile: compact size, proportioned with the left-side zodiac creature (110px - 145px)
        const mobileTargetWidth = Math.min(bounds.width * 0.36, (bounds.height - greenLineY) * imageAspect * 0.72, 145);
        stageWidth = Math.max(110, Math.min(mobileTargetWidth, bounds.width - frameRight - 10));
      } else {
        // Desktop / tablet: 20% larger, dynamically and proportionally scaling with viewport width
        const responsiveDesktopWidth = Math.min(bounds.width * 0.42 + 10, maxWidthFromHeight, maxHumanWidthCap);
        stageWidth = Math.max(165, responsiveDesktopWidth);
        if (stageWidth > availableSpaceRight && availableSpaceRight > 110) {
          stageWidth = availableSpaceRight;
        }
      }

      if (stageWidth > bounds.width - frameRight - 8) {
        stageWidth = bounds.width - frameRight - 8;
      }
      let stageHeight = stageWidth / imageAspect;
      if (stageHeight > maxHumanHeightAllowed) {
        stageHeight = maxHumanHeightAllowed;
        stageWidth = stageHeight * imageAspect;
      }

      stage.style.width = `${Math.round(stageWidth)}px`;
      stage.style.height = `${Math.round(stageHeight)}px`;
      stage.style.right = `${Math.round(frameRight)}px`;
      stage.style.bottom = `${Math.round(humanFrameBottom)}px`;
      stage.style.left = "auto";
      stage.style.top = "auto";

      const humanImage = stage.querySelector("img");
      if (humanImage) {
        humanImage.style.width = "100%";
        humanImage.style.height = "100%";
        humanImage.style.left = "0px";
        humanImage.style.bottom = "0px";
        humanImage.style.top = "auto";
        humanImage.style.right = "auto";
        humanImage.style.position = "absolute";
        humanImage.style.objectFit = "contain";
        humanImage.style.objectPosition = "center bottom";
      }

      // 3. Left-side Zodiac creature calculation (Native aspect ratio 1:1)
      // Generous frameLeft margin shifts it comfortably to the right on desktop,
      // ensuring horns, tails, claws, and drop-shadows are NEVER cut off by the main frame borders.
      // Must not touch or cross into the central circle: right edge stops cleanly before ringLeftX.
      // Upper boundary MUST NOT exceed the green line.
      // Scales down smoothly, dynamically, and synchronously on all screen sizes.
      const zodiacStage = zodiacStageRef.current;
      if (!zodiacStage || activePlanetIndex === null) return;

      // Generous margins from card edges so artwork and glow are 100% uncut
      const frameLeft = isMobile
        ? Math.max(14, Math.min(24, bounds.width * 0.04))
        : Math.max(48, Math.min(92, bounds.width * 0.06));
      const frameBottom = isMobile ? 12 : Math.max(18, Math.min(28, bounds.height * 0.04));

      // Available space between the safe left margin and the central circle
      const ringLeftX = centerX - systemOuterRadius;
      const safeCircleGap = isMobile ? 10 : 22;
      const availableSpaceDesktop = Math.max(0, ringLeftX - frameLeft - safeCircleGap);

      // Safe upper ceiling so top horns/stars never clip at or above green line
      const maxZodiacHeightAllowed = Math.max(0, bounds.height - greenLineY - frameBottom - 8);
      const maxZodiacCap = Math.min(460, bounds.width * 0.40);

      let zodiacSize: number;
      if (isMobile) {
        // On mobile, keep it clearly visible and proportional (110px - 145px)
        const mobileTarget = Math.min(bounds.width * 0.36, bounds.height * 0.34, 145);
        zodiacSize = Math.max(110, Math.min(mobileTarget, bounds.width - frameLeft - 14));
      } else {
        // On desktop/tablet, scale dynamically to fit available space without touching central circle
        zodiacSize = Math.min(availableSpaceDesktop, maxZodiacHeightAllowed, maxZodiacCap);
        zodiacSize = Math.max(100, zodiacSize);
        if (zodiacSize > availableSpaceDesktop && availableSpaceDesktop > 70) {
          zodiacSize = availableSpaceDesktop;
        }
      }

      if (zodiacSize > maxZodiacHeightAllowed) {
        zodiacSize = maxZodiacHeightAllowed;
      }
      if (zodiacSize > bounds.width - frameLeft - 10) {
        zodiacSize = bounds.width - frameLeft - 10;
      }

      // Lower Virgo's artwork slightly, with an offset that scales with its responsive size.
      const zodiacBottomOffset = activePlanetIndex === 5 ? zodiacSize * 0.07 : 0;

      zodiacStage.style.width = `${Math.round(zodiacSize)}px`;
      zodiacStage.style.height = `${Math.round(zodiacSize)}px`;
      zodiacStage.style.left = `${Math.round(frameLeft)}px`;
      zodiacStage.style.bottom = `${Math.round(Math.max(0, frameBottom - zodiacBottomOffset))}px`;
      zodiacStage.style.right = "auto";
      zodiacStage.style.top = "auto";

      const image = zodiacStage.querySelector("img");
      if (image) {
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.left = "0px";
        image.style.bottom = "0px";
        image.style.top = "auto";
        image.style.right = "auto";
        image.style.position = "absolute";
        image.style.objectFit = "contain";
        image.style.objectPosition = "center bottom";
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(system);

    return () => {
      window.removeEventListener("resize", updateSize);
      resizeObserver.disconnect();
    };
  }, [activePlanetIndex, selectedCelestial]);

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedElementInfo(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedElementInfo]);

  return (
    <div className="app-home">
      <section className="hero-grid">
        <div>
          <div className="hero-kicker inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-[0_0_20px_-3px_rgba(56,189,248,0.25)] backdrop-blur-md">
            <span className="live-beacon" /> SWISS EPHEMERIS · PRECISION AURORA ENGINE v2.1
          </div>
          <h1 className="hero-title mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            თქვენი ცის რუკა. <br />
            <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              უფრო ღრმად და ზუსტად.
            </span>
          </h1>
          <p className="hero-lead mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            შვეიცარული ეფემერიდის მათემატიკური ალგორითმები, 4 სტიქიის ტემპერამენტის სინთეზი და პროფესიონალური სივრცე ნატალური, სინასტრიული და ტრანზიტული რუკებისთვის.
          </p>
          <div className="hero-actions mt-8 flex flex-wrap items-center gap-4">
            <a href="#calculator" className="primary-action btn-shimmer shadow-lg shadow-cyan-500/30">
              <Compass className="h-4 w-4" /> რუკის შექმნა <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#features" className="secondary-action hover:border-cyan-400/40 transition-colors">
              <Sparkles className="h-4 w-4 text-cyan-300" /> შესაძლებლობები
            </a>
            <a href="#pricing" className="secondary-action hidden sm:inline-flex hover:border-violet-400/40 transition-colors">
              ტარიფები
            </a>
          </div>
        </div>
        <div className="hero-orbit-card" aria-label="ციური გამოთვლის ვიზუალური მოდული">
          <div
            className="celestial-system"
            ref={celestialSystemRef}
            role="group"
            aria-label="12 ზოდიაქოს ასტროლოგიური სარტყელი, მმართველი მნათობები და ცენტრში დედამიწა"
            onClick={(event) => {
              const target = event.target as Element;
              if (!target.closest("button, .celestial-info-card")) {
                setSelectedCelestial(null);
                setHoveredCelestial(null);
              }
            }}
          >
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
                  className={`celestial-ruler celestial-ruler-${item.planet} celestial-element-${item.element}${selectedCelestial === index ? " is-active" : ""}`}
                  style={{ "--celestial-angle": `${index * 30}deg` } as CSSProperties}
                  aria-label={`${ZODIAC_SIGNS[index].name} — ${CELESTIAL_PLANET_META[item.planet as keyof typeof CELESTIAL_PLANET_META].name}`}
                  aria-pressed={selectedCelestial === index}
                  onMouseEnter={() => setHoveredCelestial(index)}
                  onMouseLeave={() => setHoveredCelestial(null)}
                  onFocus={() => setHoveredCelestial(index)}
                  onBlur={() => setHoveredCelestial(null)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setHoveredCelestial(null);
                    if (selectedCelestial === index) {
                      setSelectedCelestial(null);
                      return;
                    }
                    setSelectedCelestial(index);
                    setCelestialAnimationRun((run) => run + 1);
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
                setHoveredCelestial(null);
                if (selectedCelestial === "earth") {
                  setSelectedCelestial(null);
                  return;
                }
                setSelectedCelestial("earth");
                setCelestialAnimationRun((run) => run + 1);
              }}
            >
              <span className="celestial-earth-clouds" />
            </button>
            <div className="celestial-earth-halo" aria-hidden="true" />
            {activeCelestial !== null && (
              <>
                {activeZodiacImage !== null && selectedCelestial !== null && (
                  <div
                    className={`celestial-zodiac-stage celestial-stage-${CELESTIAL_CONSTELLATIONS[activePlanetIndex!].planet}`}
                    key={activeZodiacImage}
                    ref={zodiacStageRef}
                    aria-hidden="true"
                  >
                    <img className="celestial-zodiac-image" src={activeZodiacImage} alt="" loading="eager" decoding="async" fetchPriority="high" />
                  </div>
                )}
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
              </>
            )}
            {selectedCelestial !== null && activeCelestial !== null && (
              <div
                className={`celestial-stage ${activeCelestial === "earth" ? "celestial-stage-earth" : `celestial-stage-${CELESTIAL_CONSTELLATIONS[activePlanetIndex!].planet}`}`}
                key={`${activeCelestial === "earth" ? "earth" : activePlanet?.name}-${celestialAnimationRun}`}
                ref={celestialStageRef}
                aria-hidden="true"
              >
                <img
                  className="celestial-stage-image"
                  src={activeCelestialImage!}
                  alt=""
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
                <CelestialFireOverlay />
              </div>
            )}
          </div>
          <div className="zodiac-aura" aria-hidden="true" />
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
          <div className="hero-orbit-meta"><span>შვეიც. / ალტერნ. ძრავა</span><span>0°—360°</span></div>
        </div>
      </section>

      {/* 4 სტიქიის ინტერაქციული მოდული (ტემპერამენტების სინთეზი) - ზოდიაქოს წრის ფანჯრის გარეთ */}
      <section className="hero-elements-section my-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="4 სტიქიის ტემპერამენტები">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span className="live-beacon mr-1.5" /> 4 სტიქია და ჰიპოკრატული ტემპერამენტები
            </div>
            <h3 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
              სტიქიების ბალანსი და ფსიქოტიპები
            </h3>
          </div>
          <p className="max-w-md text-xs text-slate-400">
            დააწკაპუნეთ ნებისმიერ სტიქიაზე, რათა გაეცნოთ მის მმართველებს, ზოდიაქოებს და ტემპერამენტის სიღრმისეულ ანალიზს.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ELEMENT_GROUPS.map((element) => {
            const isSelected = selectedElementInfo === element.id;

            return (
              <div key={element.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={(event) => {
                    elementTriggerRef.current = event.currentTarget;
                    toggleElementInfo(element.id);
                  }}
                  aria-expanded={isSelected}
                  aria-controls={isSelected ? `element-temperament-details-${element.id}` : undefined}
                  className={`celestial-element-card celestial-element-card-${element.id}${isSelected ? " is-active" : ""}`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="elem-symbol-box">
                          {element.symbol}
                        </span>
                        <div>
                          <span className="block font-mono text-[10px] uppercase tracking-wider opacity-70">
                            სტიქია
                          </span>
                          <h4 className="font-display text-base elem-title">
                            {element.name}
                          </h4>
                        </div>
                      </div>
                      <span className="elem-badge">
                        {isSelected ? "დახურვა ✕" : "ტემპერამენტი ✦"}
                      </span>
                    </div>

                    {/* Zodiacs Row */}
                    <div className="mt-4 border-t border-white/[0.08] pt-3">
                      <div className="mb-2 flex flex-col items-start gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-[11px] opacity-75">ზოდიაქოები:</span>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 font-bold">
                          {element.signs.map((s) => (
                            <span key={s.name} title={s.name} className="hover:opacity-100">
                              {s.symbol} {s.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Rulers Row */}
                      <div className="flex flex-col items-start gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-[11px] opacity-75">მმართველები:</span>
                        <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 font-bold">
                          {element.planets.map((p) => (
                            <span key={p.name} title={p.name} className="hover:opacity-100">
                              {p.symbol} {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Mobile / Tablet Inline Temperament Drawer: expands directly under this card */}
                {isSelected && (
                  <div
                    id={`element-temperament-details-${element.id}`}
                    role="region"
                    aria-label={`${element.name} სტიქიის ტემპერამენტის დეტალები`}
                    className="relative mt-3 rounded-2xl border border-white/15 bg-[#080d1a]/85 p-4 shadow-xl backdrop-blur-2xl duration-200 animate-in fade-in slide-in-from-top-2 lg:hidden sm:p-6"
                  >
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                      <span className="text-xs font-bold text-violet-200">
                        {element.name} — ტემპერამენტის ანალიზი
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElementInfo(null);
                        }}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-400 transition-all hover:bg-white/20 hover:text-white"
                        aria-label="დახურვა"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <ElementTemperamentSummary element={element.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Selected Temperament Detail Drawer (full width below the 4-card grid) */}
        {selectedElementInfo && (
          <div
            id="element-temperament-details-desktop"
            role="region"
            aria-label={`${ELEMENT_GROUPS.find((element) => element.id === selectedElementInfo)?.name} სტიქიის ტემპერამენტის დეტალები`}
            className="hidden lg:block relative mt-6 rounded-3xl border border-white/15 bg-[#080d1a]/60 p-6 shadow-2xl backdrop-blur-2xl duration-200 animate-in fade-in sm:p-8"
          >
            <button
              type="button"
              onClick={() => setSelectedElementInfo(null)}
              className="absolute right-5 top-5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-400 transition-all hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1d]"
              aria-label="დახურვა"
            >
              <X className="h-4 w-4" />
            </button>
            <ElementTemperamentSummary element={selectedElementInfo} />
          </div>
        )}
      </section>

      {/* Social Proof Infinite Ticker Strip */}
      <div className="ticker-full-bleed">
        <SocialProofTicker />
      </div>

      {/* Main Interactive Astrological Calculation Workspace */}
      <section id="calculator" className="app-section relative my-16 rounded-3xl border border-white/[0.08] bg-[#080d1a]/35 p-6 shadow-2xl backdrop-blur-2xl sm:p-10 scroll-mt-24">

        <div className="section-heading mb-8">
          <div>
            <div className="hero-kicker inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span className="live-beacon mr-1.5" /> სამუშაო სივრცე
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
          {tab !== "natal" && me === null ? (
            <div className="mx-auto max-w-xl rounded-3xl border border-cyan-400/20 bg-[#0b1020]/90 p-6 text-center sm:p-9">
              <h3 className="font-display text-xl font-bold text-white">დამატებითი გამოთვლები ანგარიშით არის ხელმისაწვდომი</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                სტუმრისთვის ხელმისაწვდომია მოკლე ნატალური მიმოხილვა. სინასტრიის, ტრანზიტების, AI-ისა და სხვა სრული სერვისების გასახსნელად შექმენით ანგარიში და აირჩიეთ შესაბამისი პაკეტი.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/cabinet" className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950">
                  შესვლა ან რეგისტრაცია
                </Link>
                <Link href="/#pricing" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white">
                  პაკეტების ნახვა
                </Link>
              </div>
            </div>
          ) : (
            <>
              {tab === "natal" && <NatalCalculator />}
              {tab === "synastry" && <SynastryCalculator />}
              {tab === "transit" && <TransitCalculator />}
              {tab === "advanced" && <AdvancedCalculator />}
              {tab === "ai" && <AiAstrologyAssistant />}
              {tab === "rectification" && <RectificationCalculator />}
            </>
          )}
        </div>
      </section>

      {/* 6-Card Bento Box Feature Showcase */}
      <BentoGrid />

      {/* Astrological Knowledge Hub & Insights Academy */}
      <KnowledgeHub />

      {/* 3-Tier Pricing Table */}
      <PricingTable />

      {/* 1-on-1 Certified Astrologer Consultation Booking */}
      <ExpertConsultationBooking />

    </div>
  );
}
