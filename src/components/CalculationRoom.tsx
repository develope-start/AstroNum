"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Sparkles,
  ArrowLeft,
  Search,
  Printer,
  Snowflake,
  X,
  Share2,
  Copy,
  Check,
  Compass,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  Eye,
  Layers,
  Activity,
  Sliders,
  Maximize2
} from "lucide-react";
import type { WheelPlanet } from "./ChartWheel";
import ChartMapSection from "./ChartMapSection";
import ElementBalanceGuide from "./ElementBalanceGuide";
import type { AspectHit } from "@/lib/astro/aspects";
import type { HouseSystem } from "@/lib/astro/positions";

export interface CalculationRoomProps {
  isOpen: boolean;
  onClose: () => void;
  birth: {
    name: string;
    date: string;
    time: string;
    place: string;
    lat: number | null;
    lon: number | null;
    timezone: string | null;
  };
  wheel: {
    ascendant: number;
    mc: number;
    houseCusps: number[];
    planets: WheelPlanet[];
    aspects: AspectHit[];
    fixedStars?: Array<{ star: string; planet: string; longitude: number; orb: number }>;
    planetHouses?: Record<string, number>;
  } | null;
  interpretation: string | null;
  mapNumber?: string | null;
  houseSystem?: HouseSystem;
  isLoading?: boolean;
  onOpenShareModal?: () => void;
}

/* ================= Astrological & Symbology Constants ================= */
const SIGNS = [
  { n: "ვერძი", g: "♈︎", e: "F", m: "C" },
  { n: "კურო", g: "♉︎", e: "E", m: "X" },
  { n: "ტყუპები", g: "♊︎", e: "A", m: "M" },
  { n: "კირჩხიბი", g: "♋︎", e: "W", m: "C" },
  { n: "ლომი", g: "♌︎", e: "F", m: "X" },
  { n: "ქალწული", g: "♍︎", e: "E", m: "M" },
  { n: "სასწორი", g: "♎︎", e: "A", m: "C" },
  { n: "მორიელი", g: "♏︎", e: "W", m: "X" },
  { n: "მშვილდოსანი", g: "♐︎", e: "F", m: "M" },
  { n: "თხის რქა", g: "♑︎", e: "E", m: "C" },
  { n: "მერწყული", g: "♒︎", e: "A", m: "X" },
  { n: "თევზები", g: "♓︎", e: "W", m: "M" }
];

const ELEM: Record<string, { n: string; c: string }> = {
  F: { n: "ცეცხლი", c: "#fb7185" },
  E: { n: "მიწა", c: "#4ade80" },
  A: { n: "ჰაერი", c: "#38bdf8" },
  W: { n: "წყალი", c: "#a78bfa" }
};

const MODES: Record<string, { n: string; c: string }> = {
  C: { n: "კარდინალური", c: "#fbbf24" },
  X: { n: "ფიქსირებული", c: "#f472b6" },
  M: { n: "მუტაბელური", c: "#22d3ee" }
};

const RULERS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

const BODY_META: Record<string, { n: string; g: string; c: string; kw: string }> = {
  Sun: { n: "მზე", g: "☉", c: "#fbbf24", kw: "ნება, იდენტობა, სასიცოცხლო ძალა" },
  Moon: { n: "მთვარე", g: "☽", c: "#c7d2fe", kw: "ემოცია, ინსტინქტი, არაცნობიერი" },
  Mercury: { n: "მერკური", g: "☿", c: "#5eead4", kw: "აზროვნება, სიტყვა, კომუნიკაცია" },
  Venus: { n: "ვენერა", g: "♀︎", c: "#f9a8d4", kw: "სიყვარული, ღირებულებები, ესთეტიკა" },
  Mars: { n: "მარსი", g: "♂︎", c: "#fb7185", kw: "მოქმედება, ამბიცია, სიმამაცე" },
  Jupiter: { n: "იუპიტერი", g: "♃", c: "#fdba74", kw: "რწმენა, ზრდა, გაფართოება" },
  Saturn: { n: "სატურნი", g: "♄", c: "#cbd5e1", kw: "სტრუქტურა, სიმწიფე, პასუხისმგებლობა" },
  Uranus: { n: "ურანი", g: "♅", c: "#67e8f9", kw: "ცვლილება, თავისუფლება, ინოვაცია" },
  Neptune: { n: "ნეპტუნი", g: "♆", c: "#a5b4fc", kw: "წარმოსახვა, სულიერება, ინტუიცია" },
  Pluto: { n: "პლუტონი", g: "♇", c: "#e879f9", kw: "ტრანსფორმაცია, ძალაუფლება, განახლება" },
  Chiron: { n: "ქირონი", g: "⚷", c: "#86efac", kw: "ჭრილობა და განკურნება" },
  NNode: { n: "ჩრდ. კვანძი", g: "☊", c: "#fde68a", kw: "ევოლუციური მიმართულება" },
  TrueNode: { n: "ჩრდ. კვანძი", g: "☊", c: "#fde68a", kw: "ევოლუციური მიმართულება" },
  MeanNode: { n: "ჩრდ. კვანძი", g: "☊", c: "#fde68a", kw: "ევოლუციური მიმართულება" },
  SNode: { n: "სამხრ. კვანძი", g: "☋", c: "#d6d3d1", kw: "ნაცნობი ნიმუშები, წარსული გამოცდილება" },
  SouthNode: { n: "სამხრ. კვანძი", g: "☋", c: "#d6d3d1", kw: "ნაცნობი ნიმუშები, წარსული გამოცდილება" },
  Lilith: { n: "ლილითი", g: "⚸", c: "#f0abfc", kw: "ფარული ბუნება, დაფარული ვნებები" },
  Selena: { n: "სელენა", g: "⚪", c: "#ffffff", kw: "თეთრი მთვარე, სინათლის მცველი" },
  ASC: { n: "ასცენდენტი", g: "AC", c: "#ffffff", kw: "პერსონა, გარეგანი გამოხატვა" },
  MC: { n: "MC", g: "MC", c: "#ffffff", kw: "საჯარო მისია, კარიერული მიზანი" }
};

const ORDER_BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "NNode", "SNode", "Lilith", "ASC", "MC"];
const MAIN10 = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
const ROM = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const ASPECTS_DEF: Record<string, { n: string; g: string; a: number; orb: number; k: string }> = {
  Conjunction: { n: "კავშირი", g: "☌", a: 0, orb: 8, k: "c" },
  Sextile: { n: "სექსტილი", g: "⚹", a: 60, orb: 6, k: "h" },
  Square: { n: "კვადრატი", g: "□", a: 90, orb: 7, k: "t" },
  Trine: { n: "ტრინი", g: "△", a: 120, orb: 7, k: "h" },
  Opposition: { n: "ოპოზიცია", g: "☍", a: 180, orb: 8, k: "t" },
  Quincunx: { n: "კვინკუნქსი", g: "⚻", a: 150, orb: 3, k: "q" }
};

const ASP_MEANINGS: Record<string, string> = {
  Conjunction: "ერწყმის და ერთ ხმად ჟღერს — ენერგიების კონცენტრაცია და გაძლიერება",
  Sextile: "ბუნებრივად თანამშრომლობს — შესაძლებლობა, რომელიც გააქტიურებას ითხოვს",
  Square: "აწყდება — შინაგანი დაძაბულობა, რომელიც მოქმედებისა და განვითარებისკენ უბიძგებს",
  Trine: "მარტივად მიედინება — თანდაყოლილი ნიჭი, რომელიც ბუნებრივად ეხმარება ადამიანს",
  Opposition: "პოლარობაშია — საჭიროა წონასწორობა ორ ურთიერთსაპირისპირო მხარეს შორის",
  Quincunx: "მუდმივი მცირე კორექტირება — მოითხოვს შეგუებას და მოქნილ მიდგომას"
};

const SECTIONS = [
  { id: "home", title: "მიმოხილვა", glyph: "✦" },
  { id: "chart", title: "ნატალური რუკა", glyph: "☉" },
  { id: "core", title: "ბირთვი · ASC · MC", glyph: "↑" },
  { id: "planets", title: "პლანეტები", glyph: "♃" },
  { id: "aspects", title: "ასპექტები", glyph: "☍" },
  { id: "points", title: "კვანძები · ლილითი · ქირონი", glyph: "⚷" },
  { id: "numerology", title: "ნუმეროლოგია", glyph: "7" },
  { id: "matrix", title: "ბედის მატრიცა", glyph: "✧" },
  { id: "psych", title: "ფსიქოლოგიური პორტრეტი", glyph: "☾" },
  { id: "cycles", title: "ციკლები და ტრანზიტები", glyph: "⟳" },
  { id: "synthesis", title: "სრული ინტერპრეტაცია", glyph: "❖" }
];

/* ================= Numerology & Matrix Math Helpers ================= */
const red = (n: number, master = true): number => {
  let cur = n;
  while (cur > 9 && !(master && [11, 22, 33].includes(cur))) {
    cur = String(cur).split("").reduce((a, b) => a + Number(b), 0);
  }
  return cur;
};
const red1 = (n: number): number => red(n, false);

function numCalc(y: number, mo: number, d: number, year = new Date().getFullYear()) {
  const m1 = red1(mo), d1 = red1(d), y1 = red1(y);
  const lp = red(m1 + d1 + y1);
  const p1 = red(m1 + d1), p2 = red(d1 + y1), p3 = red(p1 + p2), p4 = red(m1 + y1);
  const l7 = red1(lp);
  const e1 = Math.max(25, Math.min(36, 36 - l7));
  const ages = [e1, e1 + 9, e1 + 18];
  const c1 = Math.abs(m1 - d1);
  const c2 = Math.abs(d1 - y1);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m1 - y1);
  const py = red(m1 + d1 + red1(year));
  const bd = d > 9 && [11, 22, 33].includes(d) ? d : red(d);
  return { m1, d1, y1, lp, p: [p1, p2, p3, p4], ages, c: [c1, c2, c3, c4], py, bd, year };
}

function mxCalc(y: number, mo: number, d: number, method: "sub22" | "digit") {
  const rd = (n: number) => {
    let cur = n;
    if (method === "sub22") {
      while (cur > 22) cur -= 22;
    } else {
      while (cur > 22) cur = String(cur).split("").reduce((a, b) => a + Number(b), 0);
    }
    return Math.max(1, cur);
  };
  const ds = (n: number) => String(n).split("").reduce((a, b) => a + Number(b), 0);
  const A = rd(d);
  const B = rd(mo);
  const C = rd(ds(y));
  const D = rd(A + B + C);
  const X = rd(A + B + C + D);
  return {
    A, B, C, D, X,
    AB: rd(A + B),
    BC: rd(B + C),
    CD: rd(C + D),
    DA: rd(D + A),
  };
}

const TAROT_ARCANA: Record<number, [string, string]> = {
  1: ["მაგი", "ნება, ინიციატივა, ახალი შესაძლებლობების შექმნა"],
  2: ["მღვდელთმთავარი ქალი", "ინტუიცია, საიდუმლო ცოდნა, მდუმარე დაკვირვება"],
  3: ["იმპერატრიცა", "სიუხვე, ზრუნვა, ესთეტიკა, ნაყოფიერება"],
  4: ["იმპერატორი", "წესრიგი, სტრუქტურა, ავტორიტეტი, სტაბილურობა"],
  5: ["მღვდელმთავარი", "ტრადიცია, მენტორობა, ღირებულებათა გადაცემა"],
  6: ["შეყვარებულნი", "არჩევანი, სიყვარული, ღირებულებათა თანხვედრა"],
  7: ["ეტლი", "ნება, მოძრაობა, გამარჯვება დისციპლინით"],
  8: ["სამართლიანობა", "ბალანსი, მიზეზ-შედეგი, ეთიკა, კარმა"],
  9: ["განდეგილი", "სიბრძნე, განმარტოება, შინაგანი სინათლე"],
  10: ["ბედის ბორბალი", "ციკლები, შანსი, ცვლილების დინება"],
  11: ["ძალა", "შინაგანი სიმტკიცე, მოთვინიერება, გამბედაობა"],
  12: ["ჩამოკიდებული", "პერსპექტივის შეცვლა, შეჩერება, ნებაყოფლობითი უარი"],
  13: ["სიკვდილი", "ტრანსფორმაცია, დასრულება და ახლის დაწყება"],
  14: ["ზომიერება", "ჰარმონია, განკურნება, ბალანსი"],
  15: ["ეშმაკი", "მიჯაჭვულობა, ვნება, ჩრდილი, ბოჭვა"],
  16: ["კოშკი", "უეცარი ნგრევა ცრუ სტრუქტურების, გამოღვიძება და განთავისუფლება"],
  17: ["ვარსკვლავი", "იმედი, შთაგონება, განახლება"],
  18: ["მთვარე", "ილუზია, ინტუიცია, არაცნობიერი, შიშები"],
  19: ["მზე", "სიხარული, წარმატება, სიცოცხლისუნარიანობა"],
  20: ["სასამართლო", "გამოღვიძება, პასუხისმგებლობა, ახალ დონეზე გადასვლა"],
  21: ["სამყარო", "სისრულე, დასრულება, ინტეგრაცია"],
  22: ["სულელი", "თავისუფლება, ახალი გზა, რისკი, ნდობა სამყაროს მიმართ"]
};

/* ================= Calculation Room Main Component ================= */
export default function CalculationRoom({
  isOpen,
  onClose,
  birth,
  wheel,
  interpretation,
  mapNumber,
  houseSystem = "placidus",
  isLoading = false,
  onOpenShareModal,
}: CalculationRoomProps) {
  const [activeSec, setActiveSec] = useState("home");
  const [selectedPlanet, setSelectedPlanet] = useState<string>("Sun");
  const [auroraInt, setAuroraInt] = useState(55);
  const [isCalm, setIsCalm] = useState(false);
  const [matrixMethod, setMatrixMethod] = useState<"sub22" | "digit">("sub22");
  const [selectedMatrixPoint, setSelectedMatrixPoint] = useState<string>("X");
  const [psychTab, setPsychTab] = useState<string>("triad");
  const [planetFilter, setPlanetFilter] = useState<string>("all");
  const [planetSearch, setPlanetSearch] = useState<string>("");
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const [aspectSearch, setAspectSearch] = useState<string>("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [copiedInterp, setCopiedInterp] = useState(false);
  const [transitDate, setTransitDate] = useState(() => new Date().toISOString().slice(0, 10));

  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Parse birth date numbers
  const birthDateParts = useMemo(() => {
    if (!birth.date) return { y: 1995, m: 6, d: 22 };
    const parts = birth.date.split("-").map(Number);
    return { y: parts[0] || 1995, m: parts[1] || 6, d: parts[2] || 22 };
  }, [birth.date]);

  // Numerology computed from user's birth date
  const numerology = useMemo(() => {
    return numCalc(birthDateParts.y, birthDateParts.m, birthDateParts.d);
  }, [birthDateParts]);

  // Destiny Matrix computed from user's birth date
  const matrix = useMemo(() => {
    return mxCalc(birthDateParts.y, birthDateParts.m, birthDateParts.d, matrixMethod);
  }, [birthDateParts, matrixMethod]);

  // Age calculation
  const currentAge = useMemo(() => {
    const b = new Date(birthDateParts.y, birthDateParts.m - 1, birthDateParts.d);
    return Math.max(0, (Date.now() - b.getTime()) / (365.2425 * 864e5));
  }, [birthDateParts]);

  // Moon phase calculation
  const moonPhaseData = useMemo(() => {
    const sun = wheel?.planets.find(p => p.name === "Sun")?.longitude ?? 0;
    const moon = wheel?.planets.find(p => p.name === "Moon")?.longitude ?? 0;
    const elongation = ((moon - sun) % 360 + 360) % 360;
    const illumination = Math.round(((1 - Math.cos(elongation * (Math.PI / 180))) / 2) * 100);
    let phaseName = "ახალი მთვარე";
    if (elongation >= 22.5 && elongation < 67.5) phaseName = "მზარდი ნამგალი";
    else if (elongation >= 67.5 && elongation < 112.5) phaseName = "პირველი მეოთხედი";
    else if (elongation >= 112.5 && elongation < 157.5) phaseName = "მზარდი მთვარე";
    else if (elongation >= 157.5 && elongation < 202.5) phaseName = "სავსემთვარეობა";
    else if (elongation >= 202.5 && elongation < 247.5) phaseName = "კლებადი მთვარე";
    else if (elongation >= 247.5 && elongation < 292.5) phaseName = "მესამე მეოთხედი";
    else if (elongation >= 292.5 && elongation < 337.5) phaseName = "კლებადი ნამგალი";
    return { elongation, illumination, phaseName };
  }, [wheel]);

  // Element & Modality Balance
  const balance = useMemo(() => {
    const elCount: Record<string, number> = { F: 0, E: 0, A: 0, W: 0 };
    const modeCount: Record<string, number> = { C: 0, X: 0, M: 0 };
    const houseCount = Array(13).fill(0);

    if (wheel) {
      wheel.planets.forEach(p => {
        const signIdx = Math.floor(((p.longitude % 360 + 360) % 360) / 30);
        const sign = SIGNS[signIdx];
        if (sign) {
          elCount[sign.e] = (elCount[sign.e] || 0) + 1;
          modeCount[sign.m] = (modeCount[sign.m] || 0) + 1;
        }
        const h = wheel.planetHouses?.[p.name];
        if (h && h >= 1 && h <= 12) {
          houseCount[h]++;
        }
      });
    }
    return { elCount, modeCount, houseCount };
  }, [wheel]);

  // Helper formatting degrees
  const formatPos = (deg: number) => {
    const norm = (deg % 360 + 360) % 360;
    const signIdx = Math.floor(norm / 30);
    const signDeg = Math.floor(norm % 30);
    const signMin = Math.round((norm % 1) * 60);
    const sign = SIGNS[signIdx] || SIGNS[0];
    return {
      text: `${signDeg}°${String(signMin).padStart(2, "0")}′`,
      sign,
      full: `${signDeg}°${String(signMin).padStart(2, "0")}′ ${sign.n} (${sign.g})`,
    };
  };

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        if (isSearchModalOpen) setIsSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchModalOpen]);

  // Starfield Canvas Animation
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const count = 120;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      delta: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(s => {
        if (!isCalm) {
          s.alpha += s.delta;
          if (s.alpha > 0.95 || s.alpha < 0.15) s.delta = -s.delta;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, s.alpha))})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [isCalm]);

  if (!isOpen) return null;

  if (isLoading && !wheel) {
    return (
      <div className="calc-room-root fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#04060f] p-4 text-center">
        <div className="cr-aurora">
          <div className="cr-blob cr-b1" />
          <div className="cr-blob cr-b2" />
          <div className="cr-ribbon" />
        </div>
        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="relative flex items-center justify-center">
            <div className="h-44 w-44 rounded-full border-2 border-dashed border-cyan-400/70 animate-spin" style={{ animationDuration: "2.4s" }} />
            <div className="absolute h-32 w-32 rounded-full border-2 border-dotted border-amber-400/80 animate-spin" style={{ animationDuration: "1.6s", animationDirection: "reverse" }} />
            <div className="absolute h-20 w-20 rounded-full border border-violet-400/90 animate-ping" />
            <div className="absolute h-7 w-7 rounded-full bg-gradient-to-r from-amber-300 to-cyan-300 shadow-[0_0_30px_#38bdf8] animate-pulse" />
          </div>
          <h2 className="mt-8 font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-cyan-300 to-violet-300 tracking-wide">
            ✦ ცის რუკა იკვრება · SWISS EPHEMERIS ✦
          </h2>
          <p className="mt-2 text-xs font-mono text-slate-300">
            ალგორითმული სინთეზი, ასპექტების ბადე და სიღრმისეული ანალიზი…
          </p>
          <button
            onClick={onClose}
            className="mt-6 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            გაუქმება / უკან
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`calc-room-root fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden ${isCalm ? "cr-calm" : ""}`}
      style={{ "--cr-aur-int": auroraInt / 100 } as React.CSSProperties}
    >
      {/* ===== 1. Aurora Dynamic Backdrop ===== */}
      <div className="cr-aurora" aria-hidden="true">
        <div className="cr-blob cr-b1" />
        <div className="cr-blob cr-b2" />
        <div className="cr-blob cr-b3" />
        <div className="cr-blob cr-b4" />
        <div className="cr-ribbon" />
        <canvas ref={starsCanvasRef} id="stars" />
        <div className="cr-grain" />
      </div>

      {/* ===== 2. Top Header Utility Bar ===== */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/15 bg-[#050816]/85 px-4 py-2.5 backdrop-blur-2xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 hover:text-white cursor-pointer"
            title="კალკულატორში დაბრუნება"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← ახალი გამოთვლა</span>
          </button>

          <div className="hidden h-5 w-[1px] bg-white/15 sm:block" />

          <div className="hidden items-center gap-2 text-xs sm:flex">
            <span className="font-bold text-white">{birth.name || "უცნობი"}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">{birth.date} {birth.time}</span>
            <span className="text-slate-400">·</span>
            <span className="text-cyan-300">{birth.place}</span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase font-mono text-slate-300">
              {houseSystem === "placidus" ? "Placidus" : "Whole Sign"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25 cursor-pointer"
              title="ჰოლოგრაფიული ბარათი"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Story ბარათი</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 cursor-pointer"
            title="ბეჭდვა / PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ბეჭდვა</span>
          </button>

          <button
            onClick={() => setIsSearchModalOpen(true)}
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 cursor-pointer"
            title="ძებნა (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5 text-cyan-300" />
            <span className="hidden sm:inline"><kbd className="font-mono text-[10px]">Ctrl+K</kbd></span>
          </button>
        </div>
      </header>

      {/* ===== 3. Mobile Horizontal Chips Bar ===== */}
      <nav className="cr-mnav lg:hidden sticky top-[51px] z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSec(s.id)}
              className={`cr-chip shrink-0 text-xs px-3 py-1.5 ${activeSec === s.id ? "cr-on font-bold" : ""}`}
            >
              <span className="text-sm">{s.glyph}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== 4. Workspace Layout (Desktop Sidebar + Main Content) ===== */}
      <div className="relative z-10 mx-auto flex max-w-[1520px] min-h-[calc(100vh-52px)]">
        {/* Desktop Sticky Sidebar */}
        <aside className="cr-side hidden lg:flex sticky top-[52px] h-[calc(100vh-52px)] w-[276px] shrink-0 flex-col gap-3 p-4">
          <div className="cr-glass flex h-full flex-col p-4">
            {/* Brand Card Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] border border-white/30">
                <Image
                  src="/brand-mark.png"
                  alt="AstroNum Emblem"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <b className="block text-sm font-black tracking-wide text-white truncate">
                  {birth.name || "AstroNum"} · ცის ატლასი
                </b>
                <small className="block text-[11px] text-slate-400 truncate">
                  {birth.date} · {birth.place}
                </small>
              </div>
            </div>

            {/* Navigation List */}
            <ul className="flex-1 space-y-1 overflow-y-auto pr-1 text-xs">
              {SECTIONS.map(s => (
                <li key={s.id}>
                  <button
                    onClick={() => setActiveSec(s.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium transition-all cursor-pointer ${
                      activeSec === s.id
                        ? "bg-gradient-to-r from-emerald-500/25 via-indigo-500/30 to-pink-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/20 font-bold"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-sm font-semibold">
                      {s.glyph}
                    </span>
                    <span className="truncate">{s.title}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Aurora Intensity Slider */}
            <div className="mt-auto border-t border-white/10 pt-3">
              <label className="flex flex-col gap-1.5 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>ავრორის სიკაშკაშე</span>
                  <span className="text-cyan-300 font-mono">{auroraInt}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={auroraInt}
                  onChange={e => setAuroraInt(Number(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content Sections */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-32">
          {/* ================= SECTION 1: HOME (მიმოხილვა) ================= */}
          {activeSec === "home" && (
            <div className="space-y-6">
              {/* Hero Banner Card */}
              <div className="cr-glass cr-accent p-6 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                      <span>ცის ატლასი · სრული საანგარიშო რუმი</span>
                      <span className="h-[1px] w-16 bg-cyan-400/40" />
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                      <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">
                        {birth.name || "მომხმარებელი"}
                      </span>
                      {" "}— ნატალური რუკა და პერსონალური სინთეზი
                    </h1>

                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                      შვეიცარული ეფემერიდის სიზუსტით გამოთვლილი ცის რუკა, პითაგორას ნუმეროლოგია, ბედის მატრიცის ოქტაგრამა და სიღრმისეული ფსიქოლოგიური პორტრეტი გაერთიანებულია ერთ მთლიან, უკვე დაუჭრელ და სრულ სამუშაო სივრცეში.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
                      <span className="font-semibold text-amber-300">☉ {birth.date} · {birth.time}</span>
                      <span>·</span>
                      <span className="text-cyan-300">{birth.place}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-300">
                        {birth.lat !== null && birth.lon !== null ? `${birth.lat.toFixed(2)}°N, ${birth.lon.toFixed(2)}°E` : ""}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3">
                      <button
                        onClick={() => setActiveSec("chart")}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition hover:brightness-110 cursor-pointer"
                      >
                        <span>ინტერაქტიული რუკა →</span>
                      </button>
                      <button
                        onClick={() => setActiveSec("synthesis")}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-white/[0.14] cursor-pointer"
                      >
                        <span>სრული ინტერპრეტაცია ❖</span>
                      </button>
                    </div>
                  </div>

                  {/* 6 Key Statistics Snapshot Cards */}
                  <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="cr-stat">
                      <div className="cr-n">{wheel ? formatPos(wheel.ascendant).sign.g : "♌︎"}</div>
                      <div className="cr-l">ასცენდენტი</div>
                      <div className="text-[11px] font-bold text-white mt-1">
                        {wheel ? formatPos(wheel.ascendant).sign.n : "—"}
                      </div>
                    </div>

                    <div className="cr-stat">
                      <div className="cr-n">{wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).sign.g : "♋︎"}</div>
                      <div className="cr-l">მზე</div>
                      <div className="text-[11px] font-bold text-white mt-1">
                        {wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).sign.n : "—"}
                      </div>
                    </div>

                    <div className="cr-stat">
                      <div className="cr-n">{wheel?.planets.find(p => p.name === "Moon") ? formatPos(wheel.planets.find(p => p.name === "Moon")!.longitude).sign.g : "♈︎"}</div>
                      <div className="cr-l">მთვარე</div>
                      <div className="text-[11px] font-bold text-white mt-1">
                        {wheel?.planets.find(p => p.name === "Moon") ? formatPos(wheel.planets.find(p => p.name === "Moon")!.longitude).sign.n : "—"}
                      </div>
                    </div>

                    <div className="cr-stat">
                      <div className="cr-n font-mono">{numerology.lp}</div>
                      <div className="cr-l">ცხოვრების გზა</div>
                      <div className="text-[11px] font-bold text-slate-300 mt-1">რიცხვი {numerology.lp}</div>
                    </div>

                    <div className="cr-stat">
                      <div className="cr-n font-mono">{numerology.bd}</div>
                      <div className="cr-l">დაბადების დღე</div>
                      <div className="text-[11px] font-bold text-slate-300 mt-1">ოსტატის ენერგია</div>
                    </div>

                    <div className="cr-stat">
                      <div className="cr-n font-mono">{currentAge.toFixed(1)}</div>
                      <div className="cr-l">ასაკი (წელი)</div>
                      <div className="text-[11px] font-bold text-cyan-300 mt-1">
                        {currentAge < numerology.ages[0] ? "I პიკი" : currentAge < numerology.ages[1] ? "II პიკი" : "III პიკი"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informational Guidance Notice */}
              <div className="rounded-2xl border-l-4 border-cyan-400 bg-cyan-950/20 p-4 text-xs text-cyan-100 shadow-lg">
                <b>გამოთვლის მეთოდოლოგია:</b> პლანეტარული პოზიციები და სახლების კუსპიდები გამოთვლილია შვეიცარული ეფემერიდის (Swiss Ephemeris) ალგორითმით. ასტროლოგიური, ნუმეროლოგიური და ფსიქოანალიზური ინტერპრეტაციები წარმოადგენს თვითშემეცნების, შინაგანი პოტენციალისა და არქეტიპული რესურსების გაცნობიერების გზამკვლევს.
              </div>

              {/* Snapshot at a Glance */}
              <div className="cr-glass p-5 sm:p-6 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">ერთი ხედვით · ძირითადი ღერძები</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
                    <span className="text-[11px] text-slate-400">ასცენდენტი (ASC)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel ? formatPos(wheel.ascendant).full : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
                    <span className="text-[11px] text-slate-400">მზე (Sun)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).full : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
                    <span className="text-[11px] text-slate-400">მთვარე (Moon)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel?.planets.find(p => p.name === "Moon") ? formatPos(wheel.planets.find(p => p.name === "Moon")!.longitude).full : "—"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left">
                    <span className="text-[11px] text-slate-400">ზენიტი (MC)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel ? formatPos(wheel.mc).full : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 2: CHART (ნატალური რუკა) ================= */}
          {activeSec === "chart" && (
            <div className="space-y-6">
              <div className="cr-glass flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ნატალური რუკა</div>
                  <h2 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">ზოდიაქალური წრე და სტიქიების სინთეზი</h2>
                </div>
                <p className="max-w-md text-xs leading-5 text-slate-400">რუკა, დეტალური მნიშვნელობები და სტიქიების პროცენტული ბალანსი ერთ სამუშაო სივრცეში.</p>
              </div>

              {wheel ? (
                <div className="grid items-start gap-6 2xl:grid-cols-12">
                  <section className="2xl:col-span-8">
                    <ChartMapSection
                      title="ზოდიაქალური წრე v2"
                      subtitle="რუკა და ჩამოსაშლელი დეტალური მნიშვნელობები"
                      planets={wheel.planets}
                      ascendant={wheel.ascendant}
                      mc={wheel.mc}
                      houseCusps={wheel.houseCusps}
                      aspects={wheel.aspects ?? []}
                      fixedStars={wheel.fixedStars ?? []}
                      planetHouses={wheel.planetHouses ?? {}}
                    />
                  </section>
                  <aside className="2xl:col-span-4">
                    <ElementBalanceGuide planets={wheel.planets} ascendant={wheel.ascendant} />
                  </aside>
                </div>
              ) : (
                <div className="cr-glass p-8 text-center text-sm text-slate-300">რუკის მონაცემები ვერ მოიძებნა.</div>
              )}
            </div>
          )}

          {activeSec === "chart-legacy" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ნატალური რუკა</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">ინტერაქტიული ზოდიაქალური ბორბალი</h2>
                </div>
                <div className="text-xs text-slate-400">
                  დააჭირეთ პლანეტას ასპექტების გამოსაკვეთად და დეტალების სანახავად
                </div>
              </div>

              {/* Wheel & Inspector 2-Column Grid */}
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* SVG Chart Wheel */}
                <div className="cr-glass p-4 sm:p-6 lg:col-span-7 flex flex-col items-center justify-center">
                  <svg
                    viewBox="0 0 700 700"
                    className="w-full max-w-[620px] h-auto drop-shadow-[0_0_35px_rgba(99,102,241,0.25)] select-none"
                  >
                    <defs>
                      <radialGradient id="cr-wg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
                      </radialGradient>
                    </defs>

                    {/* Outer Rings */}
                    <circle cx="350" cy="350" r="324" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <circle cx="350" cy="350" r="150" fill="url(#cr-wg)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

                    {/* 12 Zodiac Sign Sectors */}
                    {SIGNS.map((sign, i) => {
                      const asc = wheel?.ascendant || 0;
                      const a = i * 30;
                      const b = a + 30;
                      const rad = (deg: number) => ((180 - (deg - asc)) * Math.PI) / 180;
                      const p = (r: number, deg: number) => [350 + r * Math.cos(rad(deg)), 350 - r * Math.sin(rad(deg))];
                      const A0 = p(272, a), A1 = p(318, a), B0 = p(318, b), B1 = p(272, b);
                      const mid = p(295, a + 15);
                      return (
                        <g key={sign.n}>
                          <path
                            d={`M ${A0[0]} ${A0[1]} L ${A1[0]} ${A1[1]} A 318 318 0 0 1 ${B0[0]} ${B0[1]} L ${B1[0]} ${B1[1]} A 272 272 0 0 0 ${A0[0]} ${A0[1]} Z`}
                            fill={ELEM[sign.e].c}
                            fillOpacity={0.12 + (i % 2) * 0.05}
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.8"
                          />
                          <text
                            x={mid[0]}
                            y={mid[1] + 6}
                            textAnchor="middle"
                            fontSize="20"
                            fill={ELEM[sign.e].c}
                            className="font-bold select-none"
                          >
                            {sign.g}
                          </text>
                        </g>
                      );
                    })}

                    {/* 12 House Cusps Lines */}
                    {wheel?.houseCusps && wheel.houseCusps.map((cusp, i) => {
                      const asc = wheel.ascendant;
                      const rad = ((180 - (cusp - asc)) * Math.PI) / 180;
                      const p0 = [350 + 272 * Math.cos(rad), 350 - 272 * Math.sin(rad)];
                      const p1 = [350 + 155 * Math.cos(rad), 350 - 155 * Math.sin(rad)];
                      const isMain = [0, 3, 6, 9].includes(i);

                      const nextCusp = wheel.houseCusps[(i + 1) % 12];
                      const midDeg = cusp + (((nextCusp - cusp) % 360 + 360) % 360) / 2;
                      const midRad = ((180 - (midDeg - asc)) * Math.PI) / 180;
                      const pq = [350 + 175 * Math.cos(midRad), 350 - 175 * Math.sin(midRad)];

                      return (
                        <g key={`cusp-${i}`}>
                          <line
                            x1={p0[0]}
                            y1={p0[1]}
                            x2={p1[0]}
                            y2={p1[1]}
                            stroke={isMain ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.22)"}
                            strokeWidth={isMain ? "1.6" : "0.8"}
                          />
                          <text
                            x={pq[0]}
                            y={pq[1] + 4}
                            textAnchor="middle"
                            fontSize="10"
                            fill="rgba(200,210,255,0.75)"
                            className="font-mono font-bold select-none"
                          >
                            {ROM[i + 1]}
                          </text>
                        </g>
                      );
                    })}

                    {/* Aspect Lines */}
                    {wheel?.aspects && wheel.aspects.map((asp, idx) => {
                      const p1 = wheel.planets.find(p => p.name === asp.a);
                      const p2 = wheel.planets.find(p => p.name === asp.b);
                      if (!p1 || !p2) return null;
                      const asc = wheel.ascendant;
                      const r1 = ((180 - (p1.longitude - asc)) * Math.PI) / 180;
                      const r2 = ((180 - (p2.longitude - asc)) * Math.PI) / 180;
                      const pt1 = [350 + 150 * Math.cos(r1), 350 - 150 * Math.sin(r1)];
                      const pt2 = [350 + 150 * Math.cos(r2), 350 - 150 * Math.sin(r2)];

                      const isSelected = selectedPlanet && (p1.name === selectedPlanet || p2.name === selectedPlanet);
                      const aspDef = ASPECTS_DEF[asp.aspect] || { k: "h" };
                      const col = aspDef.k === "h" ? "#34d399" : aspDef.k === "t" ? "#fb7185" : aspDef.k === "c" ? "#fbbf24" : "#c4b5fd";

                      return (
                        <line
                          key={`aspect-${idx}`}
                          x1={pt1[0]}
                          y1={pt1[1]}
                          x2={pt2[0]}
                          y2={pt2[1]}
                          stroke={col}
                          strokeWidth={isSelected ? "2.2" : "1.2"}
                          strokeOpacity={isSelected ? "0.95" : "0.35"}
                          strokeDasharray={asp.aspect === "Quincunx" ? "4 4" : undefined}
                        />
                      );
                    })}

                    {/* Planet Nodes & Glyphs */}
                    {wheel?.planets && wheel.planets.map((planet) => {
                      const asc = wheel.ascendant;
                      const rad = ((180 - (planet.longitude - asc)) * Math.PI) / 180;
                      const gp = [350 + 238 * Math.cos(rad), 350 - 238 * Math.sin(rad)];
                      const meta = BODY_META[planet.name] || { g: planet.name.slice(0, 2), c: "#ffffff" };
                      const isSelected = selectedPlanet === planet.name;

                      return (
                        <g
                          key={planet.name}
                          onClick={() => setSelectedPlanet(planet.name)}
                          className="cursor-pointer transition-transform hover:scale-110"
                        >
                          <circle
                            cx={gp[0]}
                            cy={gp[1]}
                            r={isSelected ? "17" : "14"}
                            fill="#080c22"
                            stroke={meta.c}
                            strokeWidth={isSelected ? "2.8" : "1.6"}
                            className="transition-all"
                            style={{ filter: isSelected ? `drop-shadow(0 0 10px ${meta.c})` : undefined }}
                          />
                          <text
                            x={gp[0]}
                            y={gp[1] + 5}
                            textAnchor="middle"
                            fontSize={meta.g.length > 1 ? "11" : "16"}
                            fill={meta.c}
                            className="font-bold select-none"
                          >
                            {meta.g}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Legend below the Wheel */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 mt-4 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> ჰარმონიული</span>
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" /> დაძაბული</span>
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> შეერთება</span>
                    <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-purple-400" /> კვინკუნქსი</span>
                  </div>
                </div>

                {/* Right Inspector & Positions Table */}
                <div className="space-y-6 lg:col-span-5">
                  {/* Selected Planet Inspector Panel */}
                  <div className="cr-glass cr-accent p-5">
                    {(() => {
                      const p = wheel?.planets.find(item => item.name === selectedPlanet);
                      const meta = BODY_META[selectedPlanet] || { n: selectedPlanet, g: "✦", c: "#fff", kw: "" };
                      const posInfo = p ? formatPos(p.longitude) : null;
                      const house = p && wheel?.planetHouses?.[p.name];
                      const relAspects = wheel?.aspects.filter(a => a.a === selectedPlanet || a.b === selectedPlanet) || [];

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span
                              className="cr-glyph"
                              style={{ "--gc": `${meta.c}aa`, "--gc2": `${meta.c}55` } as React.CSSProperties}
                            >
                              {meta.g}
                            </span>
                            <div>
                              <h3 className="text-lg font-black text-white">{meta.n}</h3>
                              <div className="text-xs font-semibold text-cyan-300">
                                {posInfo ? posInfo.full : "—"} {house ? `· ${ROM[house]} სახლი` : ""}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {meta.kw}
                          </p>

                          {/* Related Aspects Buttons */}
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <div className="text-xs font-bold text-white">ასპექტები ({relAspects.length})</div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                              {relAspects.length > 0 ? (
                                relAspects.map((asp, i) => {
                                  const other = asp.a === selectedPlanet ? asp.b : asp.a;
                                  const otherMeta = BODY_META[other] || { n: other, g: "" };
                                  const aspDef = ASPECTS_DEF[asp.aspect] || { g: "•" };
                                  return (
                                    <button
                                      key={i}
                                      onClick={() => setSelectedPlanet(other)}
                                      className="cr-chip text-xs py-1 px-2.5 hover:border-cyan-400"
                                    >
                                      <span>{aspDef.g}</span>
                                      <span>{otherMeta.n}</span>
                                      <span className="font-mono text-[10px] text-slate-400">{asp.orb.toFixed(1)}°</span>
                                    </button>
                                  );
                                })
                              ) : (
                                <span className="text-xs text-slate-400">მაჟორული ასპექტი არ არის</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Positions Table */}
                  <div className="cr-glass p-5">
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3">პლანეტების პოზიციები</div>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto pr-1">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400">
                            <th className="py-1.5 px-2">სხეული</th>
                            <th className="py-1.5 px-2">ნიშანი</th>
                            <th className="py-1.5 px-2">გრადუსი</th>
                            <th className="py-1.5 px-2">სახლი</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {wheel?.planets.map(p => {
                            const meta = BODY_META[p.name] || { n: p.name, g: "", c: "#fff" };
                            const pos = formatPos(p.longitude);
                            const h = wheel.planetHouses?.[p.name];
                            return (
                              <tr
                                key={p.name}
                                onClick={() => setSelectedPlanet(p.name)}
                                className={`cursor-pointer transition hover:bg-white/[0.06] ${selectedPlanet === p.name ? "bg-white/10" : ""}`}
                              >
                                <td className="py-2 px-2 font-semibold text-white flex items-center gap-1.5">
                                  <span style={{ color: meta.c }}>{meta.g}</span>
                                  <span>{meta.n}</span>
                                </td>
                                <td className="py-2 px-2 text-slate-300">{pos.sign.n}</td>
                                <td className="py-2 px-2 font-mono text-cyan-300">{pos.text}</td>
                                <td className="py-2 px-2 font-mono text-slate-300">{h ? ROM[h] : "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance of 4 Elements & Modalities */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="cr-glass p-5 space-y-3">
                  <div className="text-xs font-bold text-white">4 სტიქიის ბალანსი</div>
                  {Object.entries(ELEM).map(([k, el]) => {
                    const count = balance.elCount[k] || 0;
                    return (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="w-16 text-slate-300">{el.n}</span>
                        <div className="cr-dots">
                          {Array.from({ length: 8 }, (_, i) => (
                            <i
                              key={i}
                              className={i < count ? "cr-f" : ""}
                              style={i < count ? { background: el.c } : undefined}
                            />
                          ))}
                        </div>
                        <span className="font-mono font-bold text-white w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="cr-glass p-5 space-y-3">
                  <div className="text-xs font-bold text-white">მოდალობები (თვისებები)</div>
                  {Object.entries(MODES).map(([k, mode]) => {
                    const count = balance.modeCount[k] || 0;
                    return (
                      <div key={k} className="flex items-center justify-between text-xs">
                        <span className="w-24 text-slate-300">{mode.n}</span>
                        <div className="cr-dots">
                          {Array.from({ length: 8 }, (_, i) => (
                            <i
                              key={i}
                              className={i < count ? "cr-f" : ""}
                              style={i < count ? { background: mode.c } : undefined}
                            />
                          ))}
                        </div>
                        <span className="font-mono font-bold text-white w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="cr-glass p-5 space-y-2">
                  <div className="text-xs font-bold text-white">სახლების დატვირთულობა</div>
                  <div className="grid grid-cols-6 gap-2 text-center text-xs">
                    {Array.from({ length: 12 }, (_, i) => {
                      const h = i + 1;
                      const count = balance.houseCount[h] || 0;
                      return (
                        <div key={h} className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5">
                          <div className="font-mono text-[10px] text-slate-400">{ROM[h]}</div>
                          <div className={`font-bold font-mono ${count > 0 ? "text-cyan-300" : "text-slate-500"}`}>{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 3: CORE (ბირთვი) ================= */}
          {activeSec === "core" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ბირთვი</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">ასცენდენტი, მზე, MC და მთვარის ფაზა</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Ascendant */}
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#ffffffaa" } as React.CSSProperties}>AC</span>
                    <div>
                      <h3 className="text-lg font-black text-white">ასცენდენტი</h3>
                      <div className="text-xs text-cyan-300 font-semibold">
                        {wheel ? formatPos(wheel.ascendant).full : "—"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ასცენდენტი განსაზღვრავს პიროვნების გარეგან გამოხატვას, პირველ შთაბეჭდილებასა და სამყაროსთან კონტაქტის ფორმას. ის არის „ფასადი“ და ფილტრი, რომლითაც ადამიანი რეალობას აღიქვამს და საკუთარ თავს ავლენს.
                  </p>
                </div>

                {/* Sun */}
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#fbbf24aa" } as React.CSSProperties}>☉</span>
                    <div>
                      <h3 className="text-lg font-black text-white">მზე</h3>
                      <div className="text-xs text-amber-300 font-semibold">
                        {wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).full : "—"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    მზე არის ცნობიერი ეგო, სასიცოცხლო ძალა და შინაგანი ძრავა. ის აღწერს იმას, თუ რისი მეშვეობით გრძნობს ადამიანი თავს ჭეშმარიტად ცოცხლად, თვითრეალიზებულად და მიზანდასახულად.
                  </p>
                </div>

                {/* MC */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#60a5faaa" } as React.CSSProperties}>MC</span>
                    <div>
                      <h3 className="text-lg font-black text-white">ზენიტი (MC)</h3>
                      <div className="text-xs text-sky-300 font-semibold">
                        {wheel ? formatPos(wheel.mc).full : "—"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    MC (Medium Coeli) აღნიშნავს უმაღლეს საზოგადოებრივ წერტილს, კარიერულ მისწრაფებას, სოციალურ სტატუსსა და იმ მწვერვალს, რომლისკენაც ადამიანი ცხოვრების მანძილზე ვითარდება.
                  </p>
                </div>

                {/* Moon Phase Graphic & Meaning */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-4">
                    {/* Dynamic SVG Moon */}
                    <svg width="60" height="60" viewBox="-30 -30 60 60" className="shrink-0">
                      <circle r="28" fill="#090d22" stroke="rgba(255,255,255,0.25)" />
                      <circle r="27" fill="#fbbf24" fillOpacity={moonPhaseData.illumination / 100} />
                    </svg>
                    <div>
                      <h3 className="text-lg font-black text-white">მთვარის ფაზა დაბადებისას</h3>
                      <div className="text-xs text-cyan-300 font-semibold">
                        {moonPhaseData.phaseName} · განათება ≈{moonPhaseData.illumination}%
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    დაბადებისას მზესა და მთვარეს შორის კუთხე იყო {moonPhaseData.elongation.toFixed(1)}°. მთვარის ეს ფაზა ასახავს ემოციურ რიტმსა და სულიერ ამოცანას — როგორ ურთიერთქმედებს ინსტინქტი ცნობიერ ნებასთან.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 4: PLANETS (პლანეტები) ================= */}
          {activeSec === "planets" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">პლანეტები</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">პლანეტები ნიშნებსა და სახლებში</h2>
                </div>
                {/* Search in planets */}
                <input
                  type="text"
                  placeholder="ძებნა პლანეტებში…"
                  value={planetSearch}
                  onChange={e => setPlanetSearch(e.target.value)}
                  className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-400"
                />
              </div>

              {/* Grid of Planet Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                {wheel?.planets
                  .filter(p => {
                    const meta = BODY_META[p.name] || { n: p.name, kw: "" };
                    const text = `${meta.n} ${meta.kw} ${p.name}`.toLowerCase();
                    return text.includes(planetSearch.toLowerCase());
                  })
                  .map(p => {
                    const meta = BODY_META[p.name] || { n: p.name, g: "✦", c: "#fff", kw: "" };
                    const pos = formatPos(p.longitude);
                    const h = wheel.planetHouses?.[p.name];
                    return (
                      <div key={p.name} className="cr-glass p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="cr-glyph"
                            style={{ "--gc": `${meta.c}aa`, "--gc2": `${meta.c}55` } as React.CSSProperties}
                          >
                            {meta.g}
                          </span>
                          <div>
                            <h4 className="text-base font-extrabold text-white">{meta.n}</h4>
                            <div className="text-xs font-semibold text-cyan-300">
                              {pos.full} {h ? `· ${ROM[h]} სახლი` : ""}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{meta.kw}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ================= SECTION 5: ASPECTS (ასპექტები & ბადე) ================= */}
          {activeSec === "aspects" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ასპექტები</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">პლანეტარული ასპექტები და ასპექტთა ბადე</h2>
              </div>

              {/* Aspect Grid Matrix */}
              <div className="cr-glass p-6 text-center space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider">ასპექტთა მატრიცა (Aspect Grid)</div>
                <div className="overflow-x-auto pb-2">
                  <table className="cr-mx">
                    <thead>
                      <tr>
                        <th />
                        {MAIN10.slice(0, -1).map(k => (
                          <th key={k} style={{ color: BODY_META[k]?.c }}>
                            {BODY_META[k]?.g}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MAIN10.slice(1).map((b2, i) => (
                        <tr key={b2}>
                          <th style={{ color: BODY_META[b2]?.c }}>{BODY_META[b2]?.g}</th>
                          {MAIN10.slice(0, -1).map((b1, j) => {
                            if (j > i) return <td key={b1} className="cr-d" />;
                            const hit = wheel?.aspects.find(
                              a => (a.a === b1 && a.b === b2) || (a.a === b2 && a.b === b1)
                            );
                            if (!hit) return <td key={b1} />;
                            const def = ASPECTS_DEF[hit.aspect] || { k: "h", g: "•" };
                            return (
                              <td
                                key={b1}
                                className={`cr-a cr-${def.k}`}
                                title={`${BODY_META[b1]?.n} ${def.n} ${BODY_META[b2]?.n} (${hit.orb.toFixed(1)}°)`}
                              >
                                {def.g}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-300">■ ჰარმონიული</span>
                  <span className="flex items-center gap-1 text-rose-300">■ დაძაბული</span>
                  <span className="flex items-center gap-1 text-amber-300">■ შეერთება</span>
                  <span className="flex items-center gap-1 text-purple-300">■ კვინკუნქსი</span>
                </div>
              </div>

              {/* List of Aspects */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {wheel?.aspects.map((asp, idx) => {
                  const m1 = BODY_META[asp.a] || { n: asp.a };
                  const m2 = BODY_META[asp.b] || { n: asp.b };
                  const def = ASPECTS_DEF[asp.aspect] || { n: asp.aspect, g: "•", k: "h" };
                  const mean = ASP_MEANINGS[asp.aspect] || "";
                  return (
                    <div key={idx} className="cr-glass p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold" style={{ color: def.k === "h" ? "#34d399" : def.k === "t" ? "#fb7185" : "#fbbf24" }}>
                            {def.g}
                          </span>
                          <span className="text-xs font-bold text-white">{m1.n} — {m2.n}</span>
                        </div>
                        <span className="font-mono text-[11px] text-cyan-300">{asp.orb.toFixed(1)}°</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{def.n}</div>
                      <p className="text-xs text-slate-300">{mean}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= SECTION 6: POINTS (კვანძები, ლილითი, ქირონი) ================= */}
          {activeSec === "points" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">სიმბოლური წერტილები</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">კვანძები, ლილითი და ქირონი</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* North Node */}
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#fde68aaa" } as React.CSSProperties}>☊</span>
                    <div>
                      <h3 className="text-lg font-black text-white">ჩრდილოეთ კვანძი (North Node)</h3>
                      <div className="text-xs text-amber-300 font-semibold">ევოლუციური მიმართულება</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ჩრდილოეთ კვანძი მიუთითებს იმ თვისებებსა და სფეროზე, რომელთა განვითარებაც სულის ევოლუციურ ამოცანას წარმოადგენს. ეს არის ახალი ზონა, სადაც ადამიანი იზრდება და საკუთარ პოტენციალს სრულად აფართოებს.
                  </p>
                </div>

                {/* South Node */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#d6d3d1aa" } as React.CSSProperties}>☋</span>
                    <div>
                      <h3 className="text-lg font-black text-white">სამხრეთ კვანძი (South Node)</h3>
                      <div className="text-xs text-slate-300 font-semibold">ნაცნობი ნიმუშები და წარსული</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    სამხრეთი კვანძი ასახავს თანდაყოლილ ნიჭსა და იმ ნაცნობ ჩვევებს, სადაც ადამიანი ხშირად კომფორტის ზონას პოულობს. მთავარი ამოცანაა ამ ბაზის გამოყენება ჩრდილოეთ კვანძისკენ წინსვლისთვის.
                  </p>
                </div>

                {/* Lilith */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#f0abfcaa" } as React.CSSProperties}>⚸</span>
                    <div>
                      <h3 className="text-lg font-black text-white">შავი მთვარე (ლილითი)</h3>
                      <div className="text-xs text-pink-300 font-semibold">ფარული ვნებები და ავთენტურობა</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ლილითი სიმბოლურად აღწერს შინაგან დამოუკიდებლობას, ფარულ სურვილებსა და იმ სფეროს, სადაც ადამიანი კომპრომისზე უარს ამბობს. მისი გაცნობიერება იძლევა უდიდეს ავთენტურ ძალას.
                  </p>
                </div>

                {/* Chiron */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#86efacaa" } as React.CSSProperties}>⚷</span>
                    <div>
                      <h3 className="text-lg font-black text-white">ქირონი (განმკურნებელი)</h3>
                      <div className="text-xs text-emerald-300 font-semibold">მოწყვლადობა და შინაგანი სიბრძნე</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ქირონი სიმბოლურად მიუთითებს „დაჭრილ მკურნალზე“ — არეზე, სადაც ადამიანი განიცდის მოწყვლადობას, მაგრამ სწორედ საკუთარი გამოცდილების მეშვეობით ხდება სხვების ყველაზე ძლიერი მეგზური და დამხმარე.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 7: NUMEROLOGY (ნუმეროლოგია) ================= */}
          {activeSec === "numerology" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ნუმეროლოგია</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">პითაგორას ნუმეროლოგიური ანალიზი</h2>
              </div>

              {/* 2 Main Cards */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#a5b4fcaa" } as React.CSSProperties}>
                      {numerology.lp}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">ცხოვრების გზის რიცხვი</h3>
                      <div className="text-xs text-cyan-300 font-semibold">
                        {birthDateParts.d} + {birthDateParts.m} + {birthDateParts.y} → {numerology.lp}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ცხოვრების გზის რიცხვი განსაზღვრავს პიროვნების მთავარ მისიას, ძირითად მიმართულებასა და იმ გაკვეთილებს, რომლებსაც ის მთელი ცხოვრების მანძილზე გადის.
                  </p>
                </div>

                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#fbbf24aa" } as React.CSSProperties}>
                      {numerology.bd}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">დაბადების დღის რიცხვი</h3>
                      <div className="text-xs text-amber-300 font-semibold">
                        დაბადების დღე {birthDateParts.d}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    დაბადების დღის რიცხვი ავლენს თანდაყოლილ ტალანტებს, პრაქტიკულ უნარებსა და იმ კონკრეტულ ინსტრუმენტებს, რომლებითაც ადამიანი საკუთარ მისიას ახორციელებს.
                  </p>
                </div>
              </div>

              {/* Personal Year Banner */}
              <div className="cr-glass p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">პერსონალური წელი</div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {numerology.year} წელი — პერსონალური ვიბრაცია {numerology.py}
                  </div>
                </div>
                <div className="font-mono text-2xl font-black text-cyan-400 bg-white/[0.05] rounded-xl px-4 py-2 border border-white/10">
                  {numerology.py}
                </div>
              </div>

              {/* 4 Pinnacles Timeline */}
              <div className="cr-glass p-6 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-white">პიკური ციკლები (Pinnacles)</div>
                <div className="grid gap-3 sm:grid-cols-4">
                  {numerology.p.map((pin, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center space-y-1">
                      <div className="text-xs text-slate-400 font-semibold">{["I", "II", "III", "IV"][i]} პიკი</div>
                      <div className="font-mono text-2xl font-black text-cyan-300">{pin}</div>
                      <div className="text-[11px] text-slate-300">
                        {i === 0 ? `0 – ${numerology.ages[0]} წ.` : i === 1 ? `${numerology.ages[0]} – ${numerology.ages[1]} წ.` : i === 2 ? `${numerology.ages[1]} – ${numerology.ages[2]} წ.` : `${numerology.ages[2]}+ წ.`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 8: MATRIX (ბედის მატრიცა) ================= */}
          {activeSec === "matrix" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ბედის მატრიცა</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">არქეტიპული ოქტაგრამა (Destiny Matrix)</h2>
                </div>
                {/* Method switcher */}
                <div className="cr-seg">
                  <button
                    onClick={() => setMatrixMethod("sub22")}
                    className={matrixMethod === "sub22" ? "cr-on" : ""}
                  >
                    22-ის გამოკლება
                  </button>
                  <button
                    onClick={() => setMatrixMethod("digit")}
                    className={matrixMethod === "digit" ? "cr-on" : ""}
                  >
                    ციფრთა ჯამი
                  </button>
                </div>
              </div>

              {/* Octagram SVG and Inspector Panel */}
              <div className="grid gap-6 lg:grid-cols-12 items-center">
                {/* Octagram SVG Graphic */}
                <div className="cr-glass p-6 lg:col-span-6 flex items-center justify-center">
                  <svg viewBox="0 0 460 460" className="w-full max-w-[420px] h-auto drop-shadow-[0_0_30px_rgba(167,139,250,0.3)] select-none">
                    <circle cx="230" cy="230" r="215" fill="rgba(192,132,252,0.06)" />
                    <circle cx="230" cy="230" r="170" fill="none" stroke="rgba(255,255,255,0.14)" />

                    {/* Polygon squares */}
                    <polygon
                      points="60,230 230,60 400,230 230,400"
                      fill="rgba(129,140,248,0.08)"
                      stroke="rgba(167,139,250,0.55)"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="110,110 350,110 350,350 110,350"
                      fill="rgba(52,211,153,0.06)"
                      stroke="rgba(52,211,153,0.5)"
                      strokeWidth="1.5"
                    />

                    {/* Matrix Points */}
                    {[
                      { k: "A", x: 60, y: 230, label: "A (დღე)" },
                      { k: "B", x: 230, y: 60, label: "B (თვე)" },
                      { k: "C", x: 400, y: 230, label: "C (წელი)" },
                      { k: "D", x: 230, y: 400, label: "D (ჯამი)" },
                      { k: "AB", x: 110, y: 110, label: "A+B" },
                      { k: "BC", x: 350, y: 110, label: "B+C" },
                      { k: "CD", x: 350, y: 350, label: "C+D" },
                      { k: "DA", x: 110, y: 350, label: "D+A" },
                      { k: "X", x: 230, y: 230, label: "ცენტრი" },
                    ].map(pt => {
                      const val = (matrix as Record<string, number>)[pt.k] || 1;
                      const isSel = selectedMatrixPoint === pt.k;
                      return (
                        <g
                          key={pt.k}
                          onClick={() => setSelectedMatrixPoint(pt.k)}
                          className="cursor-pointer transition-transform hover:scale-110"
                        >
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={pt.k === "X" ? "34" : "28"}
                            fill="#080c22"
                            stroke={pt.k === "X" ? "#fbbf24" : isSel ? "#ffffff" : "#a78bfa"}
                            strokeWidth={isSel ? "3" : "1.6"}
                          />
                          <text
                            x={pt.x}
                            y={pt.y - 2}
                            textAnchor="middle"
                            fontSize={pt.k === "X" ? "20" : "17"}
                            fill="#ffffff"
                            className="font-bold select-none"
                          >
                            {val}
                          </text>
                          <text
                            x={pt.x}
                            y={pt.y + 13}
                            textAnchor="middle"
                            fontSize="9"
                            fill="#a78bfa"
                            className="font-bold select-none"
                          >
                            {pt.k}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Matrix Point Details Inspector */}
                <div className="cr-glass cr-accent p-6 lg:col-span-6 space-y-4">
                  {(() => {
                    const val = (matrix as Record<string, number>)[selectedMatrixPoint] || 1;
                    const arc = TAROT_ARCANA[val] || ["არკანა", "სიმბოლური მნიშვნელობა"];
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="cr-glyph" style={{ "--gc": "#fbbf24aa" } as React.CSSProperties}>
                            {val}
                          </span>
                          <div>
                            <div className="text-xs text-cyan-300 font-bold uppercase">წერტილი {selectedMatrixPoint}</div>
                            <h3 className="text-xl font-black text-white">{arc[0]} (არკანა {val})</h3>
                          </div>
                        </div>
                        <p className="text-xs text-amber-300 font-semibold">{arc[1]}</p>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          ეს ენერგია აღწერს პიროვნების შინაგან მოტივაციას, ცხოვრებისეულ გამოცდებსა და იმ არქეტიპულ ძალას, რომელსაც ადამიანი საკუთარ გამოცდილებაში ახორციელებს.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 9: PSYCH (ფსიქოლოგიური პორტრეტი) ================= */}
          {activeSec === "psych" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ფსიქოლოგია</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">სიღრმისეული ფსიქოლოგიური პორტრეტი</h2>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap gap-2 pb-2">
                {[
                  { id: "triad", label: "ფროიდი (იდი / ეგო / სუპერეგო)" },
                  { id: "defense", label: "თავდაცვის მექანიზმები" },
                  { id: "jung", label: "იუნგის არქეტიპები" },
                  { id: "attach", label: "მიჯაჭვულობის სტილი" },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setPsychTab(t.id)}
                    className={`cr-chip text-xs py-1.5 px-3.5 ${psychTab === t.id ? "cr-on font-bold" : ""}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Sub Tab: Triad */}
              {psychTab === "triad" && (
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="cr-glass p-5 space-y-2">
                    <span className="cr-tag cr-pos">იდი (ინსტინქტი)</span>
                    <h4 className="text-sm font-bold text-white">მთვარის ენერგია</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ინსტინქტური მოთხოვნილებები, ემოციური უსაფრთხოების წყარო და სპონტანური რეაქციები.
                    </p>
                  </div>

                  <div className="cr-glass cr-accent p-5 space-y-2">
                    <span className="cr-tag cr-new">ეგო (ცნობიერი მე)</span>
                    <h4 className="text-sm font-bold text-white">მზისა და ასცენდენტის სინთეზი</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ცნობიერი გადაწყვეტილებები, თვითიდენტობა და შუამავალი შინაგან სურვილებსა და რეალობას შორის.
                    </p>
                  </div>

                  <div className="cr-glass p-5 space-y-2">
                    <span className="cr-tag cr-neg">სუპერეგო (კანონი)</span>
                    <h4 className="text-sm font-bold text-white">სატურნისეული სტრუქტურა</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      შინაგანი კრიტიკოსი, პასუხისმგებლობის გრძნობა და ეთიკური ჩარჩოები.
                    </p>
                  </div>
                </div>
              )}

              {/* Sub Tab: Defense */}
              {psychTab === "defense" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="cr-glass p-5 space-y-2">
                    <h4 className="text-sm font-bold text-cyan-300">ინტელექტუალიზაცია</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ემოციური დაძაბულობისას გრძნობების ლოგიკურ ანალიზად თარგმნა თავდაცვის მიზნით.
                    </p>
                  </div>
                  <div className="cr-glass p-5 space-y-2">
                    <h4 className="text-sm font-bold text-amber-300">სუბლიმაცია</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ინტენსიური ენერგიის გადატანა შემოქმედებით, პროფესიულ და ხელშესახებ შრომაში.
                    </p>
                  </div>
                </div>
              )}

              {/* Sub Tab: Jung */}
              {psychTab === "jung" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="cr-glass p-5 space-y-2">
                    <h4 className="text-sm font-bold text-white">პერსონა (სოციალური ნიღაბი)</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ასცენდენტის მეშვეობით გამოხატული სოციალური როლი და გარეგანი იმიჯი.
                    </p>
                  </div>
                  <div className="cr-glass p-5 space-y-2">
                    <h4 className="text-sm font-bold text-purple-300">ჩრდილი (Shadow)</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      პლუტონისა და ლილითის არეალი — უარყოფილი ან დაფარული შინაგანი ძალები, რომელთა ინტეგრაცია უდიდეს ძალას ანიჭებს ადამიანს.
                    </p>
                  </div>
                </div>
              )}

              {/* Sub Tab: Attach */}
              {psychTab === "attach" && (
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <h4 className="text-base font-bold text-white">ურთიერთობისა და მიჯაჭვულობის დინამიკა</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    პარტნიორობაში იკვეთება ბალანსის ძიება დამოუკიდებლობასა და ემოციურ სიახლოვეს შორის. ჯანსაღი ურთიერთობა ეფუძნება ღია კომუნიკაციას, საჭიროებების პირდაპირ გაჟღერებას და ურთიერთპატივისცემას.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 10: CYCLES & TRANSITS (ციკლები) ================= */}
          {activeSec === "cycles" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">დრო და ციკლები</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">ცხოვრებისეული ციკლები და ტრანზიტები</h2>
              </div>

              {/* Major Lifetime Cycles */}
              <div className="cr-glass p-6 space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider">მთავარი ასტროლოგიური ციკლები</div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300">იუპიტერის დაბრუნება (≈12 წელიწადში ერთხელ)</div>
                    <p className="text-xs text-slate-300">ზრდის, შესაძლებლობების გაფართოებისა და ახალი ჰორიზონტების გახსნის ფანჯარა.</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-cyan-300">სატურნის დაბრუნება (≈29.5 წელი)</div>
                    <p className="text-xs text-slate-300">მომწიფების, პასუხისმგებლობის გადაფასებისა და რეალური სტრუქტურის დამყარების ეტაპი.</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-1.5">
                    <div className="text-xs font-bold text-purple-300">ურანის ოპოზიცია (≈42 წელი)</div>
                    <p className="text-xs text-slate-300">შუა ცხოვრების განახლება, ავთენტური თავისუფლებისა და რეფორმის მოთხოვნა.</p>
                  </div>
                </div>
              </div>

              {/* Daily Transit Explorer */}
              <div className="cr-glass p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">მიმდინარე ტრანზიტების მკვლევარი</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={transitDate}
                      onChange={e => setTransitDate(e.target.value)}
                      className="rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      onClick={() => setTransitDate(new Date().toISOString().slice(0, 10))}
                      className="cr-chip text-xs py-1 px-3"
                    >
                      დღეს
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300">
                  ტრანზიტები წარმოადგენს ციური სხეულების მიმდინარე მოძრაობას თქვენს ნატალურ რუკასთან მიმართებით {transitDate} თარიღისთვის.
                </p>
              </div>
            </div>
          )}

          {/* ================= SECTION 11: SYNTHESIS & FULL INTERPRETATION (სრული ინტერპრეტაცია) ================= */}
          {activeSec === "synthesis" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">სინთეზი და ინტერპრეტაცია</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">სრული დეტალური ანალიზი</h2>
                </div>

                {/* Copy & Print actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (interpretation) {
                        navigator.clipboard.writeText(interpretation);
                        setCopiedInterp(true);
                        setTimeout(() => setCopiedInterp(false), 2000);
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10 cursor-pointer"
                  >
                    {copiedInterp ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-cyan-300" />}
                    <span>{copiedInterp ? "დაკოპირდა!" : "ტექსტის კოპირება"}</span>
                  </button>
                </div>
              </div>

              {/* Full Interpretation Content Display */}
              <div className="cr-glass p-6 sm:p-10 space-y-6 leading-relaxed">
                {interpretation ? (
                  <div className="space-y-6 text-sm text-slate-200">
                    {interpretation.split(/\n\n+/).map((block, idx) => {
                      const headingMatch = block.match(/^#{1,4}\s+(.+)$/);
                      if (headingMatch) {
                        return (
                          <h3
                            key={idx}
                            className="pt-4 text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-indigo-200 to-amber-200 border-b border-white/10 pb-2"
                          >
                            {headingMatch[1]}
                          </h3>
                        );
                      }
                      return (
                        <p key={idx} className="text-sm sm:text-base leading-relaxed text-slate-300">
                          {block}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    ინტერპრეტაცია ჯერ არ დაგენერირებულა.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===== 5. Floating Action Buttons (FAB) ===== */}
      <div className="cr-fab fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#141a3c]/90 text-white shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-indigo-600 cursor-pointer"
          title="ძებნა (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          onClick={() => setIsCalm(prev => !prev)}
          type="button"
          className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 shadow-xl backdrop-blur-xl transition hover:scale-105 cursor-pointer ${
            isCalm ? "bg-gradient-to-br from-emerald-500 to-indigo-600 text-white" : "bg-[#141a3c]/90 text-slate-300"
          }`}
          title={isCalm ? "ანიმაციის გაშვება" : "ანიმაციის შეჩერება"}
        >
          <Snowflake className="h-4 w-4" />
        </button>

        <button
          onClick={onClose}
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-rose-500/40 bg-rose-950/80 text-rose-200 shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-rose-900 cursor-pointer"
          title="რუმის დახურვა"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ===== 6. Global Quick Search Modal ===== */}
      {isSearchModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[250] flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-md"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="cr-glass w-full max-w-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Search className="h-5 w-5 text-cyan-300" />
              <input
                type="text"
                autoFocus
                placeholder="მოძებნეთ პლანეტა, ასპექტი, თემა…"
                value={globalQuery}
                onChange={e => setGlobalQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
              />
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
              {SECTIONS.filter(s => s.title.toLowerCase().includes(globalQuery.toLowerCase())).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSec(s.id);
                    setIsSearchModalOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-white/10 text-white"
                >
                  <span className="font-bold flex items-center gap-2">
                    <span>{s.glyph}</span>
                    <span>{s.title}</span>
                  </span>
                  <span className="text-[11px] text-cyan-300">გადასვლა →</span>
                </button>
              ))}

              {MAIN10.filter(k => BODY_META[k]?.n.toLowerCase().includes(globalQuery.toLowerCase())).map(k => (
                <button
                  key={k}
                  onClick={() => {
                    setSelectedPlanet(k);
                    setActiveSec("chart");
                    setIsSearchModalOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition hover:bg-white/10 text-white"
                >
                  <span className="font-bold flex items-center gap-2">
                    <span style={{ color: BODY_META[k]?.c }}>{BODY_META[k]?.g}</span>
                    <span>{BODY_META[k]?.n}</span>
                  </span>
                  <span className="text-[11px] text-cyan-300">ბორბალზე ნახვა →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
