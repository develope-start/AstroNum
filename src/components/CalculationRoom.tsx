"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Search,
  Printer,
  Sun,
  Moon,
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
  Maximize2,
  Bookmark,
  Loader2,
} from "lucide-react";
import type { WheelPlanet } from "./ChartWheel";
import ChartMapSection from "./ChartMapSection";
import ElementBalanceGuide from "./ElementBalanceGuide";
import InterpretationText from "./InterpretationText";
import RoomAiInsight from "./RoomAiInsight";
import FloatingContactHub from "./FloatingContactHub";
import type { AspectHit } from "@/lib/astro/aspects";
import type { HouseSystem } from "@/lib/astro/positions";
import type { EphemerisMetadata } from "@/lib/astro/ephemeris";
import { saveGuestChart } from "@/lib/guestSavedCharts";
import { loadGuestCache, saveGuestCache } from "@/lib/guestCache";
import {
  ATLAS_NATAL_DATA,
  ATLAS_CORE_TEXT,
  ATLAS_PLANET_TEXT,
  ATLAS_POINT_TEXT,
  ATLAS_ASP_TEXT,
  ATLAS_ARC_TEXT,
  ATLAS_PSY_DATA,
  ATLAS_SYN_DATA,
  ATLAS_NUM_MEAN,
  ATLAS_CHAL_MEAN,
  ATLAS_PY_MEAN,
  ATLAS_MX_DD,
  ATLAS_DD_NUM,
  ATLAS_CYCM,
} from "@/lib/atlasData";

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
    ephemeris?: EphemerisMetadata;
  } | null;
  interpretation: string | null;
  mapNumber?: string | null;
  houseSystem?: HouseSystem;
  calculationContext?: {
    type: string;
    secondaryProfile?: { name: string; date: string | null; time: string | null; place: string | null } | null;
    transitDate?: string | null;
    createdAt?: string | null;
  };
  isLoading?: boolean;
  onOpenShareModal?: () => void;
  savedChart?: boolean;
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
  Ceres: { n: "ცერერა", g: "⚳", c: "#fb923c", kw: "ზრუნვა, მიღება, დანაკარგის დამუშავება" },
  Pallas: { n: "პალასი", g: "⚴", c: "#67e8f9", kw: "სტრატეგია, ნიმუშის დანახვა" },
  Juno: { n: "იუნონა", g: "⚵", c: "#f9a8d4", kw: "პარტნიორობა, თანასწორობა, ერთგულება" },
  Vesta: { n: "ვესტა", g: "⚶", c: "#facc15", kw: "კონცენტრაცია, ერთგულება, პირადი სივრცე" },
  Vertex: { n: "ვერტექსი", g: "Vx", c: "#fef3c7", kw: "მნიშვნელოვანი ურთიერთქმედებების მათემატიკური წერტილი" },
  Fortune: { n: "ბედის წილი", g: "⊗", c: "#86efac", kw: "ტრადიციული შესაძლებლობის წერტილი" },
  Spirit: { n: "სულის წილი", g: "⊛", c: "#c4b5fd", kw: "ტრადიციული განზრახვის წერტილი" },
  ASC: { n: "ასცენდენტი", g: "AC", c: "#ffffff", kw: "პერსონა, გარეგანი გამოხატვა" },
  MC: { n: "MC", g: "MC", c: "#ffffff", kw: "საჯარო მისია, კარიერული მიზანი" }
};

const ORDER_BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron", "Ceres", "Pallas", "Juno", "Vesta", "TrueNode", "SouthNode", "Lilith", "Selena", "Vertex", "Fortune", "Spirit", "ASC", "MC"];
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
  { id: "chart", title: "რუკის ანალიზი", glyph: "☉" },
  { id: "core", title: "ბირთვი · ASC · MC", glyph: "↑" },
  { id: "planets", title: "პლანეტები", glyph: "♃" },
  { id: "aspects", title: "ასპექტები", glyph: "☍" },
  { id: "points", title: "კვანძები · ლილითი · ქირონი", glyph: "⚷" },
  { id: "numerology", title: "ნუმეროლოგია", glyph: "7" },
  { id: "matrix", title: "ბედის მატრიცა", glyph: "✧" },
  { id: "psych", title: "ფსიქოლოგიური პორტრეტი", glyph: "☾" },
  { id: "cycles", title: "ციკლები და ტრანზიტები", glyph: "⟳" },
  { id: "synthesis", title: "სრული ინტერპრეტაცია", glyph: "❖" },
  { id: "ai-interpretation", title: "AI სრული ინტერპრეტაცია", glyph: "✧" }
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

function mxCalc(y: number, mo: number, d: number) {
  const rd = (n: number) => {
    let cur = n;
    while (cur > 22) cur = String(cur).split("").reduce((a, b) => a + Number(b), 0);
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
  calculationContext,
  isLoading = false,
  onOpenShareModal,
  savedChart = false,
}: CalculationRoomProps) {
  const router = useRouter();
  const chartTypeLabel = calculationContext?.type === "SYNASTRY"
    ? "სინასტრია"
    : calculationContext?.type === "TRANSIT"
      ? "ტრანზიტი"
      : "ნატალური რუკა";
  const [activeSec, setActiveSec] = useState("home");
  const [pendingFocus, setPendingFocus] = useState<
    | { eventName: "focus-interpretation"; detail: { type: string; key: string } }
    | { eventName: "focus-element-interpretation"; detail: { element: string } }
    | null
  >(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string>("Sun");
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [auroraInt, setAuroraInt] = useState(55);
  const [isLightTheme, setIsLightTheme] = useState(false);
  const [selectedMatrixPoint, setSelectedMatrixPoint] = useState<string>("X");
  const [psychTab, setPsychTab] = useState<string>("triad");
  const [planetFilter, setPlanetFilter] = useState<string>("all");
  const [planetSearch, setPlanetSearch] = useState<string>("");
  const [aspectFilter, setAspectFilter] = useState<string>("all");
  const [aspectSearch, setAspectSearch] = useState<string>("");
  const [selectedAspectKey, setSelectedAspectKey] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [copiedInterp, setCopiedInterp] = useState(false);
  const [isSavingChart, setIsSavingChart] = useState(false);
  const [isChartSaved, setIsChartSaved] = useState(savedChart);
  const [saveChartMessage, setSaveChartMessage] = useState<string | null>(null);
  const [transitDate, setTransitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeOffset, setTimeOffset] = useState<number>(0);

  const sensEntry = useMemo(() => {
    return ATLAS_NATAL_DATA.sens.find(s => s.m === timeOffset) || ATLAS_NATAL_DATA.sens.find(s => s.m === 0) || null;
  }, [timeOffset]);

  const dailyTransitData = useMemo(() => {
    const tr = ATLAS_NATAL_DATA.tr;
    if (!tr || !tr.rows || !tr.rows.length) return null;
    const start = new Date(tr.start);
    const curr = new Date(transitDate);
    const diff = Math.floor((curr.getTime() - start.getTime()) / 864e5);
    const rowIdx = Math.max(0, Math.min(tr.rows.length - 1, diff));
    const row = tr.rows[rowIdx];
    if (!row) return null;

    const bodies = tr.bodies.map((name, i) => {
      const lon = row[i] / 1000;
      return { name, longitude: lon };
    });

    const natalPlanets = wheel?.planets || [];
    const hits: Array<{
      transitBody: string;
      natalBody: string;
      aspect: string;
      aspectKa: string;
      glyph: string;
      orb: number;
      kind: string;
    }> = [];

    const ASPECTS_CHECK = [
      { name: "Conjunction", ka: "შეერთება", g: "☌", angle: 0, orb: 3.5, k: "c" },
      { name: "Opposition", ka: "ოპოზიცია", g: "☍", angle: 180, orb: 3.5, k: "t" },
      { name: "Trine", ka: "ტრინი", g: "△", angle: 120, orb: 3.0, k: "h" },
      { name: "Square", ka: "კვადრატი", g: "□", angle: 90, orb: 3.0, k: "t" },
      { name: "Sextile", ka: "სექსტილი", g: "⚹", angle: 60, orb: 2.5, k: "h" },
    ];

    bodies.forEach(tb => {
      natalPlanets.forEach(np => {
        let d = Math.abs(tb.longitude - np.longitude) % 360;
        if (d > 180) d = 360 - d;
        for (const asp of ASPECTS_CHECK) {
          const orb = Math.abs(d - asp.angle);
          if (orb <= asp.orb) {
            hits.push({
              transitBody: tb.name,
              natalBody: np.name,
              aspect: asp.name,
              aspectKa: asp.ka,
              glyph: asp.g,
              orb,
              kind: asp.k,
            });
            break;
          }
        }
      });
    });

    return { rowIdx, bodies, hits };
  }, [transitDate, wheel]);

  const getAspectText = (a: string, b: string, aspType: string): string | null => {
    const aspNorm = aspType.toLowerCase() === "conjunction" ? "conj"
      : aspType.toLowerCase() === "sextile" ? "sext"
      : aspType.toLowerCase() === "square" ? "sq"
      : aspType.toLowerCase() === "trine" ? "tri"
      : aspType.toLowerCase() === "opposition" ? "opp"
      : aspType.toLowerCase() === "quincunx" ? "quinc"
      : aspType.toLowerCase();
    const k1 = `${a}|${b}|${aspNorm}`;
    const k2 = `${b}|${a}|${aspNorm}`;
    const k3 = `${a}|${b}|${aspType}`;
    const k4 = `${b}|${a}|${aspType}`;
    return ATLAS_ASP_TEXT[k1] || ATLAS_ASP_TEXT[k2] || ATLAS_ASP_TEXT[k3] || ATLAS_ASP_TEXT[k4] || null;
  };

  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);
  const aspectCardRefs = useRef(new Map<string, HTMLButtonElement>());

  const saveCurrentChart = async () => {
    if (isSavingChart || isChartSaved) return;
    if (!wheel || !interpretation || birth.lat === null || birth.lon === null || !birth.timezone) {
      setSaveChartMessage("რუკის შესანახად საჭიროა სრული გამოთვლილი შედეგი და დაბადების მონაცემები.");
      return;
    }

    setIsSavingChart(true);
    setSaveChartMessage(null);
    const result = {
      ascendant: wheel.ascendant,
      mc: wheel.mc,
      houseCusps: wheel.houseCusps,
      planets: wheel.planets,
      aspects: wheel.aspects,
      planetHouses: wheel.planetHouses ?? {},
      advanced: { fixedStarContacts: wheel.fixedStars ?? [] },
    };
    const chartType = calculationContext?.type === "SYNASTRY" || calculationContext?.type === "TRANSIT"
      ? calculationContext.type
      : "NATAL";

    let savedId: string | null = null;
    try {
      const response = await fetch("/api/charts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: chartType,
          mapNumber,
          name1: birth.name,
          date1: birth.date,
          time1: birth.time,
          place1: birth.place,
          lat1: birth.lat,
          lon1: birth.lon,
          tz1: birth.timezone,
          houseSystem,
          result,
          interpretation,
        }),
      });

      if (response.status === 401) {
        const localChart = saveGuestChart({
          type: chartType,
          label: `${chartTypeLabel} — ${birth.name}`,
          birth,
          houseSystem,
          result,
          interpretation,
        });
        savedId = localChart.id;
        setSaveChartMessage("რუკა ამ მოწყობილობაზე შეინახა.");
      } else {
        const data = await response.json() as { error?: string; saved?: boolean; savedId?: string };
        if (!response.ok || !data.saved) throw new Error(data.error ?? "რუკის შენახვა ვერ მოხერხდა.");
        savedId = data.savedId ?? null;
        setSaveChartMessage("რუკა თქვენს ანგარიშში შეინახა.");
      }

      const cachedChart = loadGuestCache<Record<string, unknown>>("natal");
      if (cachedChart && savedId) saveGuestCache("natal", { ...cachedChart, savedId });
      setIsChartSaved(true);
    } catch (error) {
      setSaveChartMessage(error instanceof Error ? error.message : "რუკის შენახვა ვერ მოხერხდა.");
    } finally {
      setIsSavingChart(false);
    }
  };

  const openSection = (sectionId: string) => {
    const targetSection = sectionId === "chart-legacy" ? "synthesis" : sectionId;
    if (!SECTIONS.some((section) => section.id === targetSection)) return;
    setActiveSec(targetSection);
    if (window.location.hash !== `#${targetSection}`) {
      window.history.pushState({ roomSection: targetSection }, "", `#${targetSection}`);
    }
    roomRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openFullInterpretation = (type: string, key: string) => {
    setPendingFocus({ eventName: "focus-interpretation", detail: { type, key } });
    openSection("synthesis");
  };

  const selectAspectCard = (key: string) => {
    setSelectedAspectKey(key);
    window.requestAnimationFrame(() => {
      aspectCardRefs.current.get(key)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  useEffect(() => {
    const syncSectionFromHash = () => {
      const sectionId = window.location.hash.slice(1);
      const targetSection = sectionId === "chart-legacy" ? "synthesis" : sectionId;
      setActiveSec(SECTIONS.some((section) => section.id === targetSection) ? targetSection : "home");
    };
    syncSectionFromHash();
    window.addEventListener("popstate", syncSectionFromHash);
    return () => window.removeEventListener("popstate", syncSectionFromHash);
  }, []);

  useEffect(() => {
    if (activeSec !== "synthesis" || !pendingFocus) return;
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent(pendingFocus.eventName, { detail: pendingFocus.detail }));
      setPendingFocus(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSec, pendingFocus]);

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

  // One transparent convention only: digit reduction. The disputed
  // "subtract 22" variant is intentionally not offered as a second result.
  const matrix = useMemo(() => {
    return mxCalc(birthDateParts.y, birthDateParts.m, birthDateParts.d);
  }, [birthDateParts]);

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

  const selectedChartAspect = wheel?.aspects.find(
    (aspect) => `${aspect.a}|${aspect.aspect}|${aspect.b}` === selectedAspectKey,
  ) ?? null;

  const chartSynthesisPanel = (
    <section className="mt-6 space-y-4" aria-labelledby="synthesis-chart-heading">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">დამატებითი ანალიზი</div>
        <h3 id="synthesis-chart-heading" className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
          ზოდიაქალური რუკა და სტიქიების სინთეზი
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          რუკის ვიზუალური განლაგება, პლანეტების დეტალები და სტიქიების ბალანსი.
        </p>
      </div>
      {wheel ? (
        <div className="grid grid-cols-1 items-start gap-6">
          <section className="min-w-0">
            <ChartMapSection
              title="ზოდიაქალური წრე"
              subtitle="აირჩიეთ პლანეტა, სახლი ან ასპექტი დეტალების სანახავად"
              planets={wheel.planets}
              ascendant={wheel.ascendant}
              mc={wheel.mc}
              houseCusps={wheel.houseCusps}
              aspects={wheel.aspects ?? []}
              fixedStars={wheel.fixedStars ?? []}
              planetHouses={wheel.planetHouses ?? {}}
            />
          </section>
          <aside className="cr-element-panel min-w-0">
            <ElementBalanceGuide planets={wheel.planets} ascendant={wheel.ascendant} />
          </aside>
        </div>
      ) : (
        <div className="cr-glass p-8 text-center text-sm text-slate-300">რუკის მონაცემები ვერ მოიძებნა.</div>
      )}
    </section>
  );

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
        s.alpha += s.delta;
        if (s.alpha > 0.95 || s.alpha < 0.15) s.delta = -s.delta;
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
  }, []);

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
        <FloatingContactHub className="z-[210]" />
      </div>
    );
  }

  return (
    <div
      ref={roomRef}
      className={`calc-room-root fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden ${isLightTheme ? "cr-light" : ""}`}
      style={{
        "--cr-aur-int": (auroraInt / 100) * 0.7,
        "--cr-aur-veil": 0.14 + (auroraInt / 100) * 0.28,
      } as React.CSSProperties}
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
      <header className="cr-topbar sticky top-0 z-50 border-b border-white/15 bg-[#050816]/85 py-2.5 backdrop-blur-2xl">
        <div className="mx-auto flex w-[96%] items-center justify-between lg:mx-0 lg:ml-[5%] lg:mr-[3%] lg:w-[92%]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push("/")}
            type="button"
            className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-bold text-cyan-200 transition-all hover:bg-cyan-500/20 hover:text-white cursor-pointer"
            title="ახალი რუკის შესადგენად კალკულატორზე გადასვლა"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="cr-back-label">← ახალი გამოთვლა</span>
          </button>

          <div className="hidden h-5 w-[1px] bg-white/15 sm:block" />

          <div className="hidden items-center gap-2 text-xs xl:flex">
            <span className="font-bold text-white">{birth.name || "უცნობი"}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">{birth.date} {birth.time}</span>
            <span className="text-slate-400">·</span>
            <span className="text-cyan-300">{birth.place}</span>
            {calculationContext && (
              <span className="rounded-md border border-violet-400/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-200">
                {chartTypeLabel}
              </span>
            )}
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase font-mono text-slate-300">
              {houseSystem === "placidus" ? "Placidus" : houseSystem === "whole_sign" ? "Whole Sign" : houseSystem}
            </span>
          </div>
        </div>

        <div className="mr-0 flex items-center gap-2 sm:mr-[13rem]">
          {saveChartMessage && (
            <span role="status" className="hidden max-w-48 text-[10px] leading-4 text-slate-300 lg:inline">
              {saveChartMessage}
            </span>
          )}
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              type="button"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-500/25 cursor-pointer"
              title="ჰოლოგრაფიული ბარათი"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Story ბარათი</span>
            </button>
          )}

          <button
            onClick={() => setIsSearchModalOpen(true)}
            type="button"
            className="hidden items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 cursor-pointer"
            title="ძებნა (Ctrl+K)"
          >
            <Search className="h-3.5 w-3.5 text-cyan-300" />
            <span className="hidden sm:inline"><kbd className="font-mono text-[10px]">Ctrl+K</kbd></span>
          </button>
        </div>
        </div>
      </header>

      {/* ===== 3. Mobile Horizontal Chips Bar ===== */}
      <nav aria-label="რუკის სექციები" className="cr-mnav lg:hidden sticky top-[51px] z-40 border-b border-white/10 bg-[#050816]/90 backdrop-blur-xl px-2 py-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => openSection(s.id)}
              aria-pressed={activeSec === s.id}
              className={`cr-chip max-w-[14rem] shrink-0 items-start whitespace-normal text-left text-xs px-3 py-1.5 ${activeSec === s.id ? "cr-on font-bold" : ""}`}
            >
              <span className="shrink-0 text-sm">{s.glyph}</span>
              <span className="min-w-0 leading-5">{s.title}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ===== 4. Workspace Layout (Desktop Sidebar + Main Content) ===== */}
      <div className="relative z-10 mx-auto flex w-[96%] min-h-[calc(100vh-52px)] lg:mx-0 lg:ml-[5%] lg:mr-[3%] lg:w-[92%]">
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
                    type="button"
                    onClick={() => openSection(s.id)}
                    aria-pressed={activeSec === s.id}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left font-medium transition-all cursor-pointer ${
                      activeSec === s.id
                        ? "bg-gradient-to-r from-emerald-500/25 via-indigo-500/30 to-pink-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-white/20 font-bold"
                        : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.07] text-sm font-semibold">
                      {s.glyph}
                    </span>
                    <span className="min-w-0 whitespace-normal break-words leading-4">{s.title}</span>
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
        <main className="cr-workspace-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-32">
          {/* ================= SECTION 1: HOME (მიმოხილვა) ================= */}
          {activeSec === "home" && (
            <div className="space-y-6">
              {/* Hero Banner Card */}
              <div className="cr-glass cr-hero cr-accent p-6 sm:p-8">
                <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                      <span>ცის ატლასი · პირადი ასტროლოგიური კაბინეტი</span>
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

                    {calculationContext && (calculationContext.secondaryProfile || calculationContext.transitDate || calculationContext.createdAt) && (
                      <div className="grid gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300 sm:grid-cols-2">
                        {calculationContext.secondaryProfile && (
                          <p><span className="text-slate-400">მეორე პროფილი: </span><strong className="text-white">{calculationContext.secondaryProfile.name}</strong>{calculationContext.secondaryProfile.date ? ` · ${calculationContext.secondaryProfile.date}` : ""}{calculationContext.secondaryProfile.time ? ` ${calculationContext.secondaryProfile.time}` : ""}{calculationContext.secondaryProfile.place ? ` · ${calculationContext.secondaryProfile.place}` : ""}</p>
                        )}
                        {calculationContext.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი: </span><strong className="text-violet-200">{calculationContext.transitDate}</strong></p>}
                        {calculationContext.createdAt && <p><span className="text-slate-400">შედგენის დრო: </span>{new Date(calculationContext.createdAt).toLocaleString("ka-GE")}</p>}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-3">
                      <button
                        onClick={() => openSection("chart")}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition hover:brightness-110 cursor-pointer"
                      >
                        <span>ინტერაქტიული რუკა →</span>
                      </button>
                      <button
                        onClick={() => openSection("synthesis")}
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
                <b>გამოთვლის მეთოდოლოგია:</b> პლანეტარული პოზიციები და სახლების კუსპიდები გამოთვლილია {wheel?.ephemeris?.source === "astronomy" ? "Astronomy Engine-ის (MIT) დამოუკიდებელი ალგორითმით" : "Swiss Ephemeris-ის ალგორითმით"}. ასტროლოგიური, ნუმეროლოგიური და ფსიქოანალიზური ინტერპრეტაციები წარმოადგენს თვითშემეცნების, შინაგანი პოტენციალისა და არქეტიპული რესურსების გაცნობიერების გზამკვლევს.
              </div>

              {/* Snapshot at a Glance */}
              <div className="cr-glass p-5 sm:p-6 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">ერთი ხედვით · ძირითადი ღერძები</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => openFullInterpretation("angle", "ASC")}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan-400/40 hover:bg-white/[0.07]"
                  >
                    <span className="text-[11px] text-slate-400">ასცენდენტი (ASC)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel ? formatPos(wheel.ascendant).full : "—"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFullInterpretation("planet", "Sun")}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-amber-400/40 hover:bg-white/[0.07]"
                  >
                    <span className="text-[11px] text-slate-400">მზე (Sun)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).full : "—"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFullInterpretation("planet", "Moon")}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-indigo-400/40 hover:bg-white/[0.07]"
                  >
                    <span className="text-[11px] text-slate-400">მთვარე (Moon)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel?.planets.find(p => p.name === "Moon") ? formatPos(wheel.planets.find(p => p.name === "Moon")!.longitude).full : "—"}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => openFullInterpretation("angle", "MC")}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-sky-400/40 hover:bg-white/[0.07]"
                  >
                    <span className="text-[11px] text-slate-400">ზენიტი (MC)</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {wheel ? formatPos(wheel.mc).full : "—"}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSec === "chart" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">რუკის ანალიზი</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">ინტერაქტიული რუკა და მონაცემები</h2>
                </div>
                <div className="text-xs text-slate-400">
                  დააჭირეთ პლანეტას ან ასპექტს შესაბამისი სრული ჩანაწერის სანახავად
                </div>
              </div>

              {/* Wheel & Inspector 2-Column Grid */}
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* SVG Chart Wheel */}
                <div className="cr-glass p-4 sm:p-6 lg:col-span-7 flex flex-col items-center justify-center">
                  <svg
                    viewBox="0 0 700 700"
                    className="cr-natal-wheel w-full max-w-[620px] h-auto drop-shadow-[0_0_35px_rgba(99,102,241,0.25)] select-none"
                  >
                    <defs>
                      <radialGradient id="cr-wg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
                      </radialGradient>
                    </defs>

                    {/* Outer Rings */}
                    <circle className="cr-wheel-outer-ring" cx="350" cy="350" r="324" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <circle className="cr-wheel-inner-ring" cx="350" cy="350" r="150" fill="url(#cr-wg)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

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
                            className="cr-wheel-zodiac-sector"
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
                            className="cr-wheel-zodiac-glyph font-bold select-none"
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

                      const focusHouse = () => {
                        setSelectedHouse(i + 1);
                        window.requestAnimationFrame(() => {
                          document.getElementById("selected-chart-house")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        });
                      };
                      return (
                        <g
                          key={`cusp-${i}`}
                          className={`chart-wheel-control cr-chart-house ${isMain ? "cr-chart-house-major" : ""} ${selectedHouse === i + 1 ? "cr-chart-house-selected" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${i + 1}-ე სახლი — რუკის დეტალების ნახვა`}
                          aria-pressed={selectedHouse === i + 1}
                          onClick={focusHouse}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              focusHouse();
                            }
                          }}
                        >
                          <line
                            className="cr-chart-house-divider"
                            x1={p0[0]}
                            y1={p0[1]}
                            x2={p1[0]}
                            y2={p1[1]}
                            stroke={isMain ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.22)"}
                            strokeWidth={isMain ? "1.6" : "0.8"}
                          />
                          <circle
                            className="cr-chart-house-label-bg"
                            cx={pq[0]}
                            cy={pq[1]}
                            r="13"
                            fill="#0b1220"
                            stroke="#64748b"
                            strokeWidth="1.5"
                          />
                          <text
                            className="cr-chart-house-label font-mono font-bold select-none"
                            x={pq[0]}
                            y={pq[1] + 4}
                            textAnchor="middle"
                            fontSize="14"
                            fill="rgba(200,210,255,0.75)"
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

                      const aspectKey = `${asp.a}|${asp.aspect}|${asp.b}`;
                      const isSelected = selectedAspectKey === aspectKey
                        || (selectedPlanet && (p1.name === selectedPlanet || p2.name === selectedPlanet));
                      const aspDef = ASPECTS_DEF[asp.aspect] || { k: "h" };
                      const col = aspDef.k === "h" ? "#34d399" : aspDef.k === "t" ? "#fb7185" : aspDef.k === "c" ? "#fbbf24" : "#c4b5fd";

                      const focusAspect = () => {
                        setSelectedAspectKey(aspectKey);
                        window.requestAnimationFrame(() => {
                          document.getElementById("selected-chart-aspect")?.scrollIntoView({ behavior: "smooth", block: "center" });
                        });
                      };
                      return (
                        <g
                          key={`aspect-${idx}`}
                          className="chart-wheel-control"
                          role="button"
                          tabIndex={0}
                          aria-label={`${BODY_META[asp.a]?.n ?? asp.a} ${asp.aspectKa} ${BODY_META[asp.b]?.n ?? asp.b} — განმარტების ნახვა`}
                          onClick={focusAspect}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              focusAspect();
                            }
                          }}
                        >
                          <line
                            x1={pt1[0]}
                            y1={pt1[1]}
                            x2={pt2[0]}
                            y2={pt2[1]}
                            stroke="transparent"
                            strokeWidth="12"
                            pointerEvents="stroke"
                          />
                          <line
                            x1={pt1[0]}
                            y1={pt1[1]}
                            x2={pt2[0]}
                            y2={pt2[1]}
                            stroke={col}
                            strokeWidth={isSelected ? "2.2" : "1.2"}
                            strokeOpacity={isSelected ? "0.95" : "0.35"}
                            strokeDasharray={asp.aspect === "Quincunx" ? "4 4" : undefined}
                            pointerEvents="none"
                          />
                        </g>
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
                          onClick={() => {
                            setSelectedPlanet(planet.name);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedPlanet(planet.name);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`${meta.n} — რუკის დეტალების ნახვა`}
                          className="chart-wheel-control cr-chart-planet cursor-pointer"
                        >
                          <circle
                            cx={gp[0]}
                            cy={gp[1]}
                            r={isSelected ? "17" : "14"}
                            fill="#080c22"
                            stroke={meta.c}
                            strokeWidth={isSelected ? "2.8" : "1.6"}
                            className="cr-chart-planet-node transition-all"
                            style={{ filter: isSelected ? `drop-shadow(0 0 10px ${meta.c})` : undefined }}
                          />
                          <text
                            className="cr-chart-planet-glyph font-bold select-none"
                            x={gp[0]}
                            y={gp[1] + 5}
                            textAnchor="middle"
                            fontSize={meta.g.length > 1 ? "11" : "16"}
                            fill={meta.c}
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

                          {selectedChartAspect && (
                            <div id="selected-chart-aspect" className="rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] p-3">
                              <div className="text-xs font-bold text-cyan-200">
                                {BODY_META[selectedChartAspect.a]?.n ?? selectedChartAspect.a}{" "}
                                {selectedChartAspect.aspectKa}{" "}
                                {BODY_META[selectedChartAspect.b]?.n ?? selectedChartAspect.b}
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                {ASP_MEANINGS[selectedChartAspect.aspect] ?? "ეს ასპექტი ორ ფუნქციას ერთმანეთთან აკავშირებს."}
                              </p>
                              <div className="mt-1 text-[11px] text-slate-400">
                                ორბი {selectedChartAspect.orb.toFixed(1)}° · {selectedChartAspect.applying ? "მოახლოებადი" : "დაშორებადი"}
                              </div>
                              <button
                                type="button"
                                onClick={() => openFullInterpretation("aspect", `${selectedChartAspect.a}|${selectedChartAspect.aspect}|${selectedChartAspect.b}`)}
                                className="mt-2 text-[11px] font-semibold text-cyan-300 hover:text-white"
                              >
                                სრული ჩანაწერი →
                              </button>
                            </div>
                          )}

                          {selectedHouse !== null && wheel?.houseCusps[selectedHouse - 1] !== undefined && (
                            <div id="selected-chart-house" className="rounded-xl border border-cyan-400/25 bg-cyan-500/[0.06] p-3">
                              <div className="text-xs font-bold text-cyan-200">{selectedHouse}-ე სახლი</div>
                              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                სახლის კუსპი მდებარეობს {formatPos(wheel.houseCusps[selectedHouse - 1]).full}-ზე.
                              </p>
                              <button
                                type="button"
                                onClick={() => openFullInterpretation("house", String(selectedHouse))}
                                className="mt-2 text-[11px] font-semibold text-cyan-300 hover:text-white"
                              >
                                სრული ჩანაწერი →
                              </button>
                            </div>
                          )}

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
                                      onClick={() => {
                                        setSelectedPlanet(other);
                                        setSelectedAspectKey(`${asp.a}|${asp.aspect}|${asp.b}`);
                                      }}
                                      type="button"
                                      aria-label={`${meta.n} ${asp.aspectKa} ${otherMeta.n} — განმარტების ნახვა`}
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
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ბირთვი · დაბადების ღერძი</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">ასცენდენტი, მზე, MC და დროითი მგრძნობელობა</h2>
              </div>

              {/* 4 Core Pillars Grid */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Ascendant */}
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#ffffffaa" } as React.CSSProperties}>AC</span>
                    <div>
                      <h3 className="text-lg font-black text-white">ასცენდენტი ({wheel ? formatPos(wheel.ascendant).sign.n : "—"})</h3>
                      <div className="text-xs text-cyan-300 font-semibold">
                        {wheel ? formatPos(wheel.ascendant).full : "—"} · აღმოსავლეთის ჰორიზონტი
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ATLAS_CORE_TEXT?.asc?.[0] || "ასცენდენტი განსაზღვრავს პიროვნების გარეგან გამოხატვას, პირველ შთაბეჭდილებასა და სამყაროსთან კონტაქტის ფორმას. ის არის ფასადი და ფილტრი, რომლითაც ადამიანი რეალობას აღიქვამს."}
                  </p>
                  {ATLAS_CORE_TEXT?.asc?.[1] && (
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                      {ATLAS_CORE_TEXT.asc[1]}
                    </p>
                  )}
                </div>

                {/* Sun */}
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#fbbf24aa" } as React.CSSProperties}>☉</span>
                    <div>
                      <h3 className="text-lg font-black text-white">მზე ({wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).sign.n : "—"})</h3>
                      <div className="text-xs text-amber-300 font-semibold">
                        {wheel?.planets.find(p => p.name === "Sun") ? formatPos(wheel.planets.find(p => p.name === "Sun")!.longitude).full : "—"} · ცნობიერი ცენტრი
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ATLAS_CORE_TEXT?.sun?.[0] || "მზე არის ცნობიერი ეგო, სასიცოცხლო ძალა და შინაგანი ძრავა. ის აღწერს იმას, თუ რისი მეშვეობით გრძნობს ადამიანი თავს ჭეშმარიტად ცოცხლად, თვითრეალიზებულად და მიზანდასახულად."}
                  </p>
                  {ATLAS_CORE_TEXT?.sun?.[1] && (
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                      {ATLAS_CORE_TEXT.sun[1]}
                    </p>
                  )}
                </div>

                {/* MC */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#60a5faaa" } as React.CSSProperties}>MC</span>
                    <div>
                      <h3 className="text-lg font-black text-white">ზენიტი · MC ({wheel ? formatPos(wheel.mc).sign.n : "—"})</h3>
                      <div className="text-xs text-sky-300 font-semibold">
                        {wheel ? formatPos(wheel.mc).full : "—"} · უმაღლესი მიზანი
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ATLAS_CORE_TEXT?.mcSign?.[0] || "MC (Medium Coeli) აღნიშნავს უმაღლეს საზოგადოებრივ წერტილს, კარიერულ მისწრაფებას, სოციალურ სტატუსსა და იმ მწვერვალს, რომლისკენაც ადამიანი ცხოვრების მანძილზე ვითარდება."}
                  </p>
                  {ATLAS_CORE_TEXT?.mcSign?.[1] && (
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                      {ATLAS_CORE_TEXT.mcSign[1]}
                    </p>
                  )}
                </div>

                {/* Moon Phase & Elongation */}
                <div className="cr-glass p-6 space-y-3">
                  <div className="flex items-center gap-4">
                    <svg width="60" height="60" viewBox="-30 -30 60 60" className="shrink-0 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                      <circle r="27" fill="#090d22" stroke="rgba(255,255,255,0.25)" />
                      <circle r="26" fill="#fbbf24" fillOpacity={moonPhaseData.illumination / 100} />
                    </svg>
                    <div>
                      <h3 className="text-lg font-black text-white">მთვარის ფაზა დაბადებისას</h3>
                      <div className="text-xs text-cyan-300 font-semibold">
                        {moonPhaseData.phaseName} · განათება ≈{moonPhaseData.illumination}%
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    დაბადებისას მზესა და მთვარეს შორის კუთხე იყო {moonPhaseData.elongation.toFixed(1)}°. {ATLAS_CORE_TEXT?.phase?.[0] || "მთვარის ეს ფაზა ასახავს ემოციურ რიტმსა და სულიერ ამოცანას — როგორ ურთიერთქმედებს ინსტინქტი ცნობიერ ნებასთან."}
                  </p>
                  {ATLAS_CORE_TEXT?.phase?.[1] && (
                    <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                      {ATLAS_CORE_TEXT.phase[1]}
                    </p>
                  )}
                </div>
              </div>

              {/* Rulers of ASC and MC */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="cr-glass p-5 space-y-2 border-l-4 border-l-amber-400">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">ასცენდენტის მმართველი</div>
                  <h4 className="text-base font-extrabold text-white">მზე (ლომის მმართველი)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{ATLAS_CORE_TEXT?.ruler?.[0] || "ასცენდენტის მმართველი პლანეტის მდებარეობა მიუთითებს ცხოვრების მთავარ არენაზე, სადაც ადამიანი საკუთარ პიროვნებას ავლენს."}</p>
                  {ATLAS_CORE_TEXT?.ruler?.[1] && (
                    <p className="text-xs text-slate-400 leading-relaxed">{ATLAS_CORE_TEXT.ruler[1]}</p>
                  )}
                </div>

                <div className="cr-glass p-5 space-y-2 border-l-4 border-l-sky-400">
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-300">ზენიტის (MC) მმართველი</div>
                  <h4 className="text-base font-extrabold text-white">ვენერა (კუროს მმართველი)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{ATLAS_CORE_TEXT?.mcRuler?.[0] || "MC-ის მმართველი პლანეტა აჩვენებს პროფესიულ სტრატეგიას, რეპუტაციასა და სოციალური წარმატების მიღწევის გზას."}</p>
                  {ATLAS_CORE_TEXT?.mcRuler?.[1] && (
                    <p className="text-xs text-slate-400 leading-relaxed">{ATLAS_CORE_TEXT.mcRuler[1]}</p>
                  )}
                </div>
              </div>

              {/* Birth Time Sensitivity Slider (-30m to +30m Rectification Explorer) */}
              <div className="cr-glass p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">დროითი მგრძნობელობის ანალიზი (Rectification Sensitivity)</div>
                    <h3 className="text-lg font-extrabold text-white mt-0.5">დაბადების დროის ცვლილება: {timeOffset > 0 ? `+${timeOffset}` : timeOffset} წუთი</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeOffset(0)}
                      className="cr-chip text-xs py-1 px-3"
                    >
                      ნორმა (0 წთ)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>-30 წთ</span>
                    <span className="text-cyan-300 font-bold">{timeOffset > 0 ? `+${timeOffset}` : timeOffset} წთ</span>
                    <span>+30 წთ</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={timeOffset}
                    onChange={e => setTimeOffset(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <p className="text-xs text-slate-300">
                  დედამიწის ბრუნვის გამო ასცენდენტი ყოველ 4 წუთში დაახლოებით 1 გრადუსით იცვლება. ეს ინტერაქტიული მოდული გაჩვენებთ, როგორ ინაცვლებს 12 სახლის კუსპიდი დროის მცირე კორექტირებისას.
                </p>

                {sensEntry && (
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="py-2 px-2.5">სახლი</th>
                          <th className="py-2 px-2.5">ნატალური კუსპიდი</th>
                          <th className="py-2 px-2.5">გადახრილი კუსპიდი ({timeOffset > 0 ? `+${timeOffset}` : timeOffset} წთ)</th>
                          <th className="py-2 px-2.5">დრიფტი</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.from({ length: 12 }, (_, i) => {
                          const orig = wheel ? wheel.houseCusps[i] : (sensEntry.c[i] || 0);
                          const shifted = sensEntry.c[i] !== undefined ? sensEntry.c[i] : orig;
                          const diff = ((shifted - orig + 540) % 360) - 180;
                          return (
                            <tr key={i} className="hover:bg-white/[0.04]">
                              <td className="py-2 px-2.5 font-bold font-mono text-white">{ROM[i + 1]} სახლი</td>
                              <td className="py-2 px-2.5 text-slate-300">{formatPos(orig).full}</td>
                              <td className="py-2 px-2.5 font-semibold text-cyan-300">{formatPos(shifted).full}</td>
                              <td className="py-2 px-2.5 font-mono text-slate-400">{diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}°</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
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
                  <p className="text-xs text-slate-400 mt-1">
                    თითოეული პლანეტის ბირთვი, ფსიქოლოგიური გამოვლინება ზოდიაქოს ნიშანში და რეალიზაციის სფერო (სახლი).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    {[
                      { id: "all", label: "ყველა" },
                      { id: "personal", label: "პირადი" },
                      { id: "social", label: "სოციალური" },
                      { id: "trans", label: "უმაღლესი" },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setPlanetFilter(f.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          planetFilter === f.id
                            ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="ძებნა პლანეტებში…"
                    value={planetSearch}
                    onChange={e => setPlanetSearch(e.target.value)}
                    className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-400 w-44"
                  />
                </div>
              </div>

              {/* Grid of Planet Cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {wheel?.planets
                  .filter(p => {
                    const meta = BODY_META[p.name] || { n: p.name, kw: "" };
                    const pData = (ATLAS_PLANET_TEXT as Record<string, { core: string; sign: string; house: string; kw: string[] }>)[p.name];
                    const isPersonal = ["Sun", "Moon", "Mercury", "Venus", "Mars"].includes(p.name);
                    const isSocial = ["Jupiter", "Saturn"].includes(p.name);
                    const isTrans = ["Uranus", "Neptune", "Pluto", "Chiron"].includes(p.name);
                    if (planetFilter === "personal" && !isPersonal) return false;
                    if (planetFilter === "social" && !isSocial) return false;
                    if (planetFilter === "trans" && !isTrans) return false;

                    const query = planetSearch.toLowerCase().trim();
                    if (!query) return true;
                    const haystack = `${meta.n} ${meta.kw} ${p.name} ${pData?.core || ""} ${pData?.sign || ""} ${pData?.house || ""}`.toLowerCase();
                    return haystack.includes(query);
                  })
                  .map(p => {
                    const meta = BODY_META[p.name] || { n: p.name, g: "✦", c: "#fff", kw: "" };
                    const pos = formatPos(p.longitude);
                    const h = wheel.planetHouses?.[p.name];
                    const pData = (ATLAS_PLANET_TEXT as Record<string, { core: string; sign: string; house: string; kw: string[] }>)[p.name];
                    const isRetro = Boolean((ATLAS_NATAL_DATA.retro as Record<string, boolean>)?.[p.name]);

                    return (
                      <div
                        key={p.name}
                        className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10 hover:border-cyan-400/40 transition hover:bg-white/[0.03] shadow-lg flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="cr-glyph text-2xl"
                                style={{ "--gc": `${meta.c}aa`, "--gc2": `${meta.c}55` } as React.CSSProperties}
                              >
                                {meta.g}
                              </span>
                              <div>
                                <h4 className="text-lg font-black text-white flex items-center gap-2">
                                  {meta.n}
                                  {isRetro && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                      ℞ რეტრო
                                    </span>
                                  )}
                                </h4>
                                <div className="text-xs font-semibold text-cyan-300">
                                  {pos.full} {h ? `· ${ROM[h]} სახლი` : ""}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openFullInterpretation("planet", p.name)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 font-semibold transition"
                              title="სრული ანალიტიკური მოდულის გახსნა"
                            >
                              ანალიზი →
                            </button>
                          </div>

                          {/* Core essence */}
                          {pData?.core && (
                            <div className="text-xs font-bold text-cyan-200/90 italic tracking-wide bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                              ✦ ბირთვი: {pData.core}
                            </div>
                          )}

                          {/* Sign text */}
                          {pData?.sign && (
                            <div className="text-xs text-slate-200 leading-relaxed space-y-1">
                              <span className="font-bold text-amber-300/90 block">ნიშანი: {pos.sign.n}</span>
                              <p className="text-slate-300">{pData.sign}</p>
                            </div>
                          )}

                          {/* House text */}
                          {pData?.house && (
                            <div className="text-xs text-slate-200 leading-relaxed space-y-1 pt-1">
                              <span className="font-bold text-indigo-300/90 block">სახლი: {h ? `${ROM[h]} სახლი` : ""}</span>
                              <p className="text-slate-300">{pData.house}</p>
                            </div>
                          )}

                          {/* Keywords tags */}
                          {pData?.kw && pData.kw.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {pData.kw.map((kTag: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium"
                                >
                                  #{kTag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ================= SECTION 5: ASPECTS (ასპექტები & ბადე) ================= */}
          {activeSec === "aspects" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ასპექტები</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">პლანეტარული ასპექტები და ასპექტთა ბადე</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    პლანეტებს შორის გეომეტრიული კავშირები: ენერგიების ჰარმონიული თანხვედრა ან შინაგანი დაძაბულობა.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                    {[
                      { id: "all", label: "ყველა" },
                      { id: "h", label: "ჰარმონიული" },
                      { id: "t", label: "დაძაბული" },
                      { id: "c", label: "შეერთება" },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAspectFilter(f.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          aspectFilter === f.id
                            ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/30"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="ძებნა ასპექტებში…"
                    value={aspectSearch}
                    onChange={e => setAspectSearch(e.target.value)}
                    className="rounded-xl border border-white/15 bg-black/30 px-3.5 py-1.5 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-400 w-44"
                  />
                </div>
              </div>

              {/* Selected Aspect Deep Inspector (if selected) */}
              {selectedChartAspect && (
                <div id="selected-chart-aspect" className="cr-glass cr-accent p-6 space-y-3 border-2 border-cyan-400/50 shadow-[0_0_35px_rgba(56,189,248,0.25)] animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="cr-glyph" style={{ "--gc": "#38bdf8aa" } as React.CSSProperties}>
                        {ASPECTS_DEF[selectedChartAspect.aspect]?.g || "•"}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-cyan-300 uppercase">არჩეული ასპექტის დეტალური ანალიზი</div>
                        <h3 className="text-xl font-extrabold text-white">
                          {BODY_META[selectedChartAspect.a]?.n || selectedChartAspect.a} {ASPECTS_DEF[selectedChartAspect.aspect]?.n || selectedChartAspect.aspect} {BODY_META[selectedChartAspect.b]?.n || selectedChartAspect.b}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-3 py-1 rounded-full bg-white/10 text-cyan-200">
                        ორბი: {selectedChartAspect.orb.toFixed(2)}°
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                        {selectedChartAspect.applying ? "მოახლოებადი (Applying)" : "დაშორებადი (Separating)"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed pt-1">
                    {getAspectText(selectedChartAspect.a, selectedChartAspect.b, selectedChartAspect.aspect) ||
                      `${BODY_META[selectedChartAspect.a]?.n || selectedChartAspect.a} და ${BODY_META[selectedChartAspect.b]?.n || selectedChartAspect.b} იმყოფებიან ${ASPECTS_DEF[selectedChartAspect.aspect]?.n || selectedChartAspect.aspect}-ის ასპექტში. ${ASP_MEANINGS[selectedChartAspect.aspect] || ""}`}
                  </p>
                </div>
              )}

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
                              <td key={b1} className={`cr-a cr-${def.k}`}>
                                <button
                                  type="button"
                                  className="cr-aspect-cell"
                                  title={`${BODY_META[b1]?.n} ${def.n} ${BODY_META[b2]?.n} (${hit.orb.toFixed(1)}°)`}
                                  aria-label={`${BODY_META[b1]?.n} ${def.n} ${BODY_META[b2]?.n} — ინტერპრეტაციის ნახვა`}
                                  onClick={() => selectAspectCard(`${hit.a}|${hit.aspect}|${hit.b}`)}
                                >
                                  {def.g}
                                </button>
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
              <div className="grid gap-4 md:grid-cols-2">
                {wheel?.aspects
                  .filter(asp => {
                    const def = ASPECTS_DEF[asp.aspect] || { k: "h", n: asp.aspect };
                    if (aspectFilter !== "all" && def.k !== aspectFilter) return false;
                    const q = aspectSearch.toLowerCase().trim();
                    if (!q) return true;
                    const m1 = BODY_META[asp.a] || { n: asp.a };
                    const m2 = BODY_META[asp.b] || { n: asp.b };
                    const customText = getAspectText(asp.a, asp.b, asp.aspect) || "";
                    const haystack = `${m1.n} ${m2.n} ${def.n} ${customText}`.toLowerCase();
                    return haystack.includes(q);
                  })
                  .map((asp, idx) => {
                    const m1 = BODY_META[asp.a] || { n: asp.a };
                    const m2 = BODY_META[asp.b] || { n: asp.b };
                    const def = ASPECTS_DEF[asp.aspect] || { n: asp.aspect, g: "•", k: "h" };
                    const aspectKey = `${asp.a}|${asp.aspect}|${asp.b}`;
                    const customText = getAspectText(asp.a, asp.b, asp.aspect) || ASP_MEANINGS[asp.aspect] || "პლანეტარული ენერგიების ურთიერთქმედება.";
                    const maxOrb = asp.aspect === "Conjunction" || asp.aspect === "Opposition" ? 8 : asp.aspect === "Trine" || asp.aspect === "Square" ? 7 : 5;
                    const strengthPercent = Math.max(10, Math.min(100, Math.round(100 - (asp.orb / maxOrb) * 100)));
                    const isExact = asp.orb < 0.3;

                    return (
                      <div
                        key={idx}
                        ref={(node) => {
                          if (node) aspectCardRefs.current.set(aspectKey, node as any);
                          else aspectCardRefs.current.delete(aspectKey);
                        }}
                        className={`cr-glass p-5 space-y-3 rounded-2xl border transition hover:border-cyan-400/40 hover:bg-white/[0.04] shadow-md ${
                          selectedAspectKey === aspectKey ? "border-cyan-300/80 ring-2 ring-cyan-400/30" : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="text-2xl font-bold"
                              style={{ color: def.k === "h" ? "#34d399" : def.k === "t" ? "#fb7185" : "#fbbf24" }}
                            >
                              {def.g}
                            </span>
                            <div>
                              <h4 className="text-base font-extrabold text-white">
                                {m1.n} — {m2.n}
                              </h4>
                              <div className="text-xs text-slate-400 font-medium">
                                {def.n} · ორბისი {asp.orb.toFixed(2)}° {isExact && <span className="text-cyan-300 font-bold">(ზუსტი ასპექტი)</span>}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              def.k === "h"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : def.k === "t"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {def.k === "h" ? "ჰარმონიული" : def.k === "t" ? "დაძაბული" : "შეერთება"}
                          </span>
                        </div>

                        {/* Exactness bar */}
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${strengthPercent}%`,
                              backgroundColor: def.k === "h" ? "#34d399" : def.k === "t" ? "#fb7185" : "#fbbf24",
                            }}
                          />
                        </div>

                        {/* Full Interpretation Text */}
                        <p className="text-xs text-slate-200 leading-relaxed pt-1">
                          {customText}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                          <span>{asp.applying ? "მოახლოებადი (Applying)" : "დაშორებადი (Separating)"}</span>
                          <button
                            type="button"
                            onClick={() => selectAspectCard(aspectKey)}
                            className="text-cyan-300 hover:text-white font-semibold transition"
                          >
                            ფოკუსირება ↑
                          </button>
                        </div>
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
                <p className="text-xs text-slate-400 mt-1">
                  სულის ევოლუციური ვექტორი, კარმული მეხსიერება, ფარული ჩრდილი და განმკურნებელი ჭრილობა.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* North Node Card */}
                {(() => {
                  const pt = ATLAS_POINT_TEXT.NNode;
                  const pObj = wheel?.planets.find(p => p.name === "TrueNode" || p.name === "MeanNode" || p.name === "NNode");
                  const pos = pObj ? formatPos(pObj.longitude) : { full: "2°39' მორიელი", sign: { n: "მორიელი" } };
                  const h = pObj && wheel?.planetHouses?.[pObj.name] ? wheel.planetHouses[pObj.name] : 4;
                  return (
                    <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10 border-t-2 border-t-amber-400 shadow-lg">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <span className="cr-glyph text-2xl" style={{ "--gc": "#fde68aaa" } as React.CSSProperties}>☊</span>
                        <div>
                          <h3 className="text-lg font-black text-white">ჩრდილოეთ კვანძი (North Node)</h3>
                          <div className="text-xs text-amber-300 font-semibold">{pos.full} · {ROM[h]} სახლი</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{pt.t}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pt.kw.map((k, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Lilith Card */}
                {(() => {
                  const pt = ATLAS_POINT_TEXT.Lilith;
                  const pObj = wheel?.planets.find(p => p.name === "Lilith");
                  const pos = pObj ? formatPos(pObj.longitude) : { full: "18°57' ტყუპები", sign: { n: "ტყუპები" } };
                  const h = pObj && wheel?.planetHouses?.[pObj.name] ? wheel.planetHouses[pObj.name] : 11;
                  return (
                    <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10 border-t-2 border-t-pink-400 shadow-lg">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <span className="cr-glyph text-2xl" style={{ "--gc": "#f0abfcaa" } as React.CSSProperties}>⚸</span>
                        <div>
                          <h3 className="text-lg font-black text-white">შავი მთვარე (ლილითი)</h3>
                          <div className="text-xs text-pink-300 font-semibold">{pos.full} · {ROM[h]} სახლი</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{pt.t}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pt.kw.map((k, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Chiron Card */}
                {(() => {
                  const pt = ATLAS_POINT_TEXT.Chiron;
                  const pObj = wheel?.planets.find(p => p.name === "Chiron");
                  const pos = pObj ? formatPos(pObj.longitude) : { full: "21°06' ქალწული", sign: { n: "ქალწული" } };
                  const h = pObj && wheel?.planetHouses?.[pObj.name] ? wheel.planetHouses[pObj.name] : 2;
                  return (
                    <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10 border-t-2 border-t-emerald-400 shadow-lg">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <span className="cr-glyph text-2xl" style={{ "--gc": "#86efacaa" } as React.CSSProperties}>⚷</span>
                        <div>
                          <h3 className="text-lg font-black text-white">ქირონი (დაჭრილი მკურნალი)</h3>
                          <div className="text-xs text-emerald-300 font-semibold">{pos.full} · {ROM[h]} სახლი</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{pt.t}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {pt.kw.map((k, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* South Node Card */}
                {(() => {
                  const pObj = wheel?.planets.find(p => p.name === "SouthNode" || p.name === "SNode");
                  const pos = pObj ? formatPos(pObj.longitude) : { full: "2°39' კურო", sign: { n: "კურო" } };
                  const h = pObj && wheel?.planetHouses?.[pObj.name] ? wheel.planetHouses[pObj.name] : 10;
                  return (
                    <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10 border-t-2 border-t-slate-400 shadow-lg">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <span className="cr-glyph text-2xl" style={{ "--gc": "#d6d3d1aa" } as React.CSSProperties}>☋</span>
                        <div>
                          <h3 className="text-lg font-black text-white">სამხრეთ კვანძი (South Node)</h3>
                          <div className="text-xs text-slate-300 font-semibold">{pos.full} · {ROM[h]} სახლი</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        კარმული წარსულის გამოცდილება და ჩვევები: კუროს ნიშანი მე-10 სახლში მიუთითებს მატერიალური სტატუსის, სოციალური პრესტიჟისა და გარეგანი კონტროლის ნაცნობ კომფორტზე. სულის ამოცანაა ამ ბაზის გამოყენება შინაგანი სიღრმის (მორიელი, IV სახლი) გასავითარებლად.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {["კარმული ბაზა", "სტაბილურობა", "წარსული სტატუსი"].map((k, i) => (
                          <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            #{k}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Dedicated Karmic Axis Synthesis Card */}
              <div className="cr-glass cr-accent p-6 space-y-3 rounded-2xl border-2 border-amber-400/40 shadow-xl">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm uppercase tracking-wider">
                  <span>☸ კარმული ღერძი: კვანძების სინთეზი და MC ოპოზიცია</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  ჩრდილოეთ კვანძი მორიელში (IV სახლი) — სამხრეთ კვანძი კუროში (X სახლი). სულის მთავარი ევოლუციური ვექტორი მიმართულია გარეგანი მატერიალური მიღწევებისა და სოციალური სტატუსის დევნიდან შინაგანი, ემოციური უსაფრთხოებისა და „ფსიქოლოგიური ფესვების“ შექმნისკენ. MC-სთან კვანძის ოპოზიცია ხაზს უსვამს, რომ პროფესიული აღიარება მხოლოდ მაშინ იქნება ჭეშმარიტად მდგრადი, როცა შინაგანი სულიერი სიმშვიდე და ემოციური საყრდენი მყარია.
                </p>
              </div>
            </div>
          )}

          {/* ================= SECTION 7: NUMEROLOGY (ნუმეროლოგია) ================= */}
          {activeSec === "numerology" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ნუმეროლოგია</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">პითაგორას ნუმეროლოგიური ანალიზი</h2>
                <p className="text-xs text-slate-400 mt-1">
                  დაბადების თარიღის ვიბრაციული კოდი: ცხოვრების გზა, მასტერ-რიცხვი, 4 მწვერვალი, გამოწვევები და პითაგორას ფსიქომატრიცა.
                </p>
              </div>

              {/* 2 Main Cards: Life Path and Birthday Number */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="cr-glass cr-accent p-6 space-y-4 rounded-2xl border border-white/10 border-t-2 border-t-indigo-400 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <span className="cr-glyph text-2xl" style={{ "--gc": "#a5b4fcaa" } as React.CSSProperties}>
                      {numerology.lp}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">ცხოვრების გზის რიცხვი — 7</h3>
                      <div className="text-xs text-cyan-300 font-semibold">
                        {birthDateParts.d} + {birthDateParts.m} + {birthDateParts.y} → 7
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-cyan-200/90 italic bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-500/20">
                    ✦ {ATLAS_NUM_MEAN[7]?.k || "მისტიკოსი, მკვლევარი და მოაზროვნე"}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {ATLAS_DD_NUM.lp}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    {ATLAS_DD_NUM.lpNote}
                  </p>
                </div>

                <div className="cr-glass cr-accent p-6 space-y-4 rounded-2xl border border-white/10 border-t-2 border-t-amber-400 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <span className="cr-glyph text-2xl" style={{ "--gc": "#fbbf24aa" } as React.CSSProperties}>
                      {numerology.bd}
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">დაბადების დღის რიცხვი — 22/4</h3>
                      <div className="text-xs text-amber-300 font-semibold">
                        დაბადების დღე 22 · მასტერ რიცხვი
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-amber-200/90 italic bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-500/20">
                    ✦ {ATLAS_NUM_MEAN[22]?.k || "ოსტატი-მშენებელი (Master Builder)"}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {ATLAS_DD_NUM.bd}
                  </p>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-white/5">
                    {ATLAS_DD_NUM.bdNote}
                  </p>
                </div>
              </div>

              {/* Personal Year Card */}
              <div className="cr-glass p-6 space-y-3 rounded-2xl border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">პერსონალური წელი</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">
                      2026 წელი — პერსონალური ვიბრაცია 11/2
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[2026, 2027, 2028, 2029].map(y => (
                      <span
                        key={y}
                        className={`text-xs px-2.5 py-1 rounded-lg font-mono font-bold ${
                          y === 2026 ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40" : "bg-white/5 text-slate-400"
                        }`}
                      >
                        {y}: {y === 2026 ? "11/2" : y === 2027 ? "3" : y === 2028 ? "4" : "5"}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {ATLAS_DD_NUM.py2026}
                </p>
              </div>

              {/* 4 Pinnacles Timeline & Descriptions */}
              <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-white">ცხოვრების 4 მწვერვალი (Pinnacles)</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {numerology.p.map((pin, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left space-y-2 hover:border-cyan-400/30 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cyan-300 font-bold">{["I", "II", "III", "IV"][i]} მწვერვალი</span>
                        <span className="font-mono text-xl font-black text-white">{pin}</span>
                      </div>
                      <div className="text-[11px] text-amber-300/90 font-medium">
                        ასაკი: {i === 0 ? `0 – ${numerology.ages[0]} წ.` : i === 1 ? `${numerology.ages[0]} – ${numerology.ages[1]} წ.` : i === 2 ? `${numerology.ages[1]} – ${numerology.ages[2]} წ.` : `${numerology.ages[2]}+ წ.`}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {ATLAS_DD_NUM.pin[i] || "ცხოვრებისეული შესაძლებლობების ეტაპი."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 Challenges (გამოწვევები) */}
              <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-300">ცხოვრების 4 გამოწვევა (კარმული გაკვეთილები)</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map(i => {
                    const chalNum = [2, 0, 2, 0][i];
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 text-left space-y-2 hover:border-rose-400/40 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-rose-300 font-bold">{["I", "II", "III", "IV"][i]} გამოწვევა</span>
                          <span className="font-mono text-xl font-black text-rose-200">{chalNum}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {i === 0 ? "ადრეული ასაკი" : i === 1 ? "შუა პერიოდი" : i === 2 ? "მთავარი გამოწვევა" : "მთელი ცხოვრება"}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {ATLAS_DD_NUM.ch[i]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pythagorean Square (პითაგორას 3x3 ფსიქომატრიცა) */}
              <div className="cr-glass p-6 space-y-5 rounded-2xl border border-white/10">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">პითაგორას 3x3 ფსიქომატრიცა</div>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">პიროვნების 9 ფუნდამენტური ვექტორი</h3>
                </div>

                <div className="grid gap-6 lg:grid-cols-12 items-start">
                  {/* 3x3 Matrix Grid */}
                  <div className="lg:col-span-5 bg-black/40 p-4 rounded-2xl border border-white/10">
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      {[
                        { num: "11", label: "ხასიათი, ნება" },
                        { num: "4", label: "ჯანმრთელობა" },
                        { num: "7", label: "ტალანტი, იღბალი" },
                        { num: "22", label: "ენერგია" },
                        { num: "5", label: "ლოგიკა, ინტუიცია" },
                        { num: "8", label: "მოვალეობა" },
                        { num: "3", label: "ინტერესები" },
                        { num: "6", label: "შრომისმოყვარეობა" },
                        { num: "999", label: "მეხსიერება, ინტელექტი" },
                      ].map((cell, idx) => (
                        <div
                          key={idx}
                          className="bg-white/[0.04] p-3 rounded-xl border border-white/10 hover:border-cyan-400/40 transition"
                        >
                          <div className="font-mono text-2xl font-black text-cyan-300">{cell.num}</div>
                          <div className="text-[10px] text-slate-300 font-semibold mt-1">{cell.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interpretations for Psychomatrix Vectors */}
                  <div className="lg:col-span-7 space-y-2.5 text-xs">
                    <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 space-y-1">
                      <strong className="text-cyan-300 block">11 — ხასიათი და ნებისყოფა:</strong>
                      <p className="text-slate-300 leading-relaxed">
                        ოპტიმალური ლიდერული ბალანსი: ადამიანი არ არის ტირანი, მაგრამ ფლობს მყარ შინაგან ბირთვს, შეუძლია კომპრომისზე წასვლა და სხვების მოსმენა.
                      </p>
                    </div>
                    <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 space-y-1">
                      <strong className="text-cyan-300 block">22 — ბიოენერგია და კომუნიკაბელურობა:</strong>
                      <p className="text-slate-300 leading-relaxed">
                        სტაბილური ენერგეტიკული ნაკადი: საკმარისი ენერგია ყოველდღიური აქტივობისა და ადამიანებთან ეფექტური ურთიერთობისთვის.
                      </p>
                    </div>
                    <div className="bg-white/[0.03] p-3 rounded-xl border border-white/10 space-y-1">
                      <strong className="text-cyan-300 block">999 — მეხსიერება და ინტელექტუალური პოტენციალი:</strong>
                      <p className="text-slate-300 leading-relaxed">
                        უმაღლესი ინტელექტი და ფენომენალური აღქმის უნარი: ინფორმაციის მომენტალური ათვისება, ანალიტიკური სიღრმე და ნათელმხილველობისკენ მიდრეკილება.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 8: MATRIX (ბედის მატრიცა) ================= */}
          {activeSec === "matrix" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ბედის მატრიცა · 22 არკანა</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">არქეტიპული ოქტაგრამა (Destiny Matrix)</h2>
                <p className="text-xs text-slate-400 mt-1">
                  22 უმაღლესი არკანის სისტემა: სულის კომფორტის ზონა, კარმული კუდი (18-9-9), ფინანსური ნაკადი და პარტნიორობის ხაზი.
                </p>
              </div>

              {/* Octagram SVG and Inspector Panel */}
              <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Octagram SVG Graphic */}
                <div className="cr-glass p-6 lg:col-span-6 flex flex-col items-center justify-center space-y-4">
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
                      { k: "D", x: 230, y: 400, label: "D (კარმა)" },
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
                          className="cr-matrix-point cursor-pointer"
                        >
                          <circle
                            className="cr-matrix-point-circle"
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
                  <p className="text-[11px] text-slate-400 text-center">
                    დააჭირეთ ნებისმიერ წერტილს ოქტაგრამაზე დეტალური არკანას სანახავად
                  </p>
                </div>

                {/* Matrix Point Details Inspector */}
                <div className="cr-glass cr-accent p-6 lg:col-span-6 space-y-4">
                  {(() => {
                    const val = (matrix as Record<string, number>)[selectedMatrixPoint] || 1;
                    const rawArc = ATLAS_ARC_TEXT[String(val)] || ["არკანა", "არქეტიპული ენერგია"];
                    const arcName = rawArc[0] || `არკანა ${val}`;
                    const arcKw = rawArc[1] || "";
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="cr-glyph text-2xl" style={{ "--gc": "#fbbf24aa" } as React.CSSProperties}>
                            {val}
                          </span>
                          <div>
                            <div className="text-xs text-cyan-300 font-bold uppercase">
                              წერტილი {selectedMatrixPoint} {selectedMatrixPoint === "X" ? "· სულის კომფორტის ზონა" : selectedMatrixPoint === "A" ? "· პიროვნული რესურსი (დღე)" : selectedMatrixPoint === "B" ? "· ინტუიცია და სულიერება (თვე)" : selectedMatrixPoint === "C" ? "· მატერიალური მიზანი (წელი)" : selectedMatrixPoint === "D" ? "· კარმული ამოცანა" : ""}
                            </div>
                            <h3 className="text-2xl font-black text-white">{arcName} ({val} არკანა)</h3>
                          </div>
                        </div>

                        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-200">
                          ✦ საკვანძო ენერგია: {arcKw}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">✦ რესურსული გამოვლინება (+)</h4>
                          <p className="text-xs text-slate-200 leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/10">
                            როდესაც ეს არკანა პლუსში ვლინდება, ადამიანი ავლენს უდიდეს შემოქმედებით პოტენციალს, შინაგან თავისუფლებასა და სიბრძნეს. ის თავდაჯერებულად წარმართავს საკუთარ ცხოვრებას.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">❖ ჩრდილოვანი მხარე და გამოწვევა (-)</h4>
                          <p className="text-xs text-slate-200 leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/10">
                            მინუსში ყოფნისას შესაძლოა გამოვლინდეს შიშები, პასუხისმგებლობისგან გაქცევა ან ზედმეტი სიჯიუტე. მთავარი ამოცანაა ამ ენერგიის გაცნობიერება და პლუსში გადაყვანა.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Karmic Tail 18-9-9 Deep Card */}
              <div className="cr-glass p-6 space-y-3 rounded-2xl border-2 border-purple-500/30 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm uppercase tracking-wider">
                    <span>☸ კარმული კუდი: 18 - 9 - 9 (ჯადოქარი / განდეგილი / მთვარე)</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                    სულის მთავარი ვალი
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  წარსულ ინკარნაციაში ადამიანს ჰქონდა წვდომა უდიდეს ეზოთერიკულ და მისტიკურ ცოდნაზე, მაგრამ ეს ცოდნა დამალა ან მარტოობაში ჩაიკეტა სხვების შიშით. ამ ინკარნაციაში მთავარი გაკვეთილია: გათავისუფლება ილუზიებისა და ფარული შიშებისგან (18), შინაგანი სიბრძნისა და გამოცდილების სხვებისთვის გაზიარება (9) და საკუთარი გზის სრული მიმღებლობა.
                </p>
              </div>

              {/* Financial and Relationship Channels */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="cr-glass p-6 space-y-3 rounded-2xl border-t-2 border-t-amber-400">
                  <div className="text-xs font-bold uppercase text-amber-300">ფინანსური ნაკადის ხაზი (9 - 15 - 6)</div>
                  <h4 className="text-base font-bold text-white">მატერიალური სიუხვისა და კარიერის გასაღები</h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    ფული შემოდის ექსპერტული, სიღრმისეული ცოდნისა და ანალიტიკის მეშვეობით (9). მთავარი ფინანსური ბლოკია: ცდუნებები, მანიპულაციები ან მატერიალური მიჯაჭვულობის შიში (15). წარმატება მოდის მაშინ, როცა ადამიანი აკეთებს იმას, რაც მთელი გულით უყვარს (6).
                  </p>
                </div>

                <div className="cr-glass p-6 space-y-3 rounded-2xl border-t-2 border-t-pink-400">
                  <div className="text-xs font-bold uppercase text-pink-300">ურთიერთობებისა და სიყვარულის ხაზი (6 - 12 - 18)</div>
                  <h4 className="text-base font-bold text-white">ჰარმონიული პარტნიორობის ფორმულა</h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    იდეალური პარტნიორი უნდა იყოს ესთეტიური, თბილი და ემოციურად გახსნილი (6). მთავარი საფრთხეა: ურთიერთობაში მსხვერპლის როლის მორგება ან ზედმეტი თავგანწირვა (12). კავშირის ხანგრძლივობის საფუძველია სრული გულწრფელობა და შიშებისგან გათავისუფლება (18).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 9: PSYCH (ფსიქოლოგიური პორტრეტი) ================= */}
          {activeSec === "psych" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">ფსიქოლოგია · სიღრმისეული ანალიზი</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">სიღრმისეული ფსიქოლოგიური პორტრეტი</h2>
              </div>

              {/* Sub tabs */}
              <div className="flex flex-wrap gap-2 pb-2">
                {[
                  { id: "triad", label: "ფროიდის ტრიადა (იდი / ეგო / სუპერეგო)" },
                  { id: "defenses", label: "თავდაცვის მექანიზმები" },
                  { id: "jung", label: "იუნგის მანდალა (არქეტიპები)" },
                  { id: "attach", label: "მიჯაჭვულობის დინამიკა" },
                  { id: "needs", label: "მასლოუს პირამიდა" },
                  { id: "extra", label: "კოგნიტური პროფილი & ლოკუსი" },
                  { id: "strengths", label: "ძალები და ზრდის წერტილები" },
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
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-3">
                    {(ATLAS_PSY_DATA?.triad || []).map((trItem: any, idx: number) => (
                      <div
                        key={trItem.k || idx}
                        className={`cr-glass p-5 space-y-2 border-t-2 ${
                          trItem.k === "id" ? "border-t-rose-400" : trItem.k === "ego" ? "border-t-cyan-400 cr-accent" : "border-t-amber-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`cr-tag ${trItem.k === "id" ? "cr-neg" : trItem.k === "ego" ? "cr-new" : "cr-pos"}`}>
                            {trItem.t}
                          </span>
                          <span className="font-mono text-xs font-bold text-cyan-300">
                            {trItem.k === "id" ? "30%" : trItem.k === "ego" ? "45%" : "25%"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{trItem.s}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">{trItem.x}</p>
                      </div>
                    ))}
                  </div>

                  <div className="cr-glass p-5 text-xs text-slate-300 leading-relaxed border-l-4 border-l-cyan-400">
                    <strong className="text-white block mb-1">ტრიადის სინთეზი:</strong>
                    {ATLAS_PSY_DATA?.triadSum}
                  </div>
                </div>
              )}

              {/* Sub Tab: Defenses */}
              {psychTab === "defenses" && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(ATLAS_PSY_DATA?.defenses || []).map((def: any, idx: number) => (
                    <div key={idx} className="cr-glass p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-cyan-300">{def.n}</h4>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300">{def.s}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{def.x}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub Tab: Jung */}
              {psychTab === "jung" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(ATLAS_PSY_DATA?.jung || []).map((j: any, idx: number) => (
                    <div key={idx} className="cr-glass p-5 space-y-2">
                      <span className="cr-tag cr-new">{j.t}</span>
                      <h4 className="text-sm font-bold text-white">{j.s}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{j.x}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub Tab: Attach */}
              {psychTab === "attach" && (
                <div className="cr-glass cr-accent p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="cr-glyph" style={{ "--gc": "#38bdf8aa" } as React.CSSProperties}>⚓︎</span>
                    <div>
                      <div className="text-xs font-bold text-cyan-300 uppercase">მიჯაჭვულობის დინამიკა</div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">{ATLAS_PSY_DATA?.attach?.h}</h3>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {ATLAS_PSY_DATA?.attach?.x}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3 pt-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-1">
                      <strong className="text-cyan-300 block">რას ეძებს ურთიერთობაში:</strong>
                      <span className="text-slate-300">{ATLAS_PSY_DATA?.attach?.seek}</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-1">
                      <strong className="text-rose-300 block">ტრიგერები ურთიერთობაში:</strong>
                      <span className="text-slate-300">{ATLAS_PSY_DATA?.attach?.trig}</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-1">
                      <strong className="text-emerald-300 block">ინტეგრაციის გზა:</strong>
                      <span className="text-slate-300">{ATLAS_PSY_DATA?.attach?.path}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub Tab: Needs (Maslow) */}
              {psychTab === "needs" && (
                <div className="cr-glass p-6 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2">მოთხოვნილებათა იერარქია (მასლოუ)</div>
                  <div className="space-y-2">
                    {(ATLAS_PSY_DATA?.needs || []).map((need: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] gap-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white">{need.l}</span>
                          <p className="text-[11px] text-slate-300">{need.x}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-cyan-300 font-mono px-2 py-0.5 rounded bg-white/5">{need.h}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub Tab: Extra */}
              {psychTab === "extra" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(ATLAS_PSY_DATA?.extra || []).map((ex: any, i: number) => (
                    <div key={i} className="cr-glass p-5 space-y-2">
                      <span className="text-xs font-bold uppercase text-cyan-300">{ex.n}</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{ex.x}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub Tab: Strengths */}
              {psychTab === "strengths" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="cr-glass p-5 space-y-3 border-t-2 border-t-emerald-400">
                    <div className="text-xs font-bold uppercase text-emerald-400">ძირითადი ძალები (Superpowers)</div>
                    <div className="space-y-3 text-xs">
                      {(ATLAS_PSY_DATA?.strengths || []).map((item: string[], i: number) => {
                        const [title, desc] = item;
                        return (
                          <div key={i} className="space-y-0.5">
                            <strong className="text-white flex items-center gap-1.5">
                              <span className="text-emerald-400">✓</span> {title}
                            </strong>
                            <p className="text-slate-300 pl-4">{desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="cr-glass p-5 space-y-3 border-t-2 border-t-rose-400">
                    <div className="text-xs font-bold uppercase text-rose-400">ზრდის ზონები (Growth Edges)</div>
                    <div className="space-y-3 text-xs">
                      {(ATLAS_PSY_DATA?.growth || []).map((item: string[], i: number) => {
                        const [title, desc] = item;
                        return (
                          <div key={i} className="space-y-0.5">
                            <strong className="text-white flex items-center gap-1.5">
                              <span className="text-rose-400">❖</span> {title}
                            </strong>
                            <p className="text-slate-300 pl-4">{desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 10: CYCLES & TRANSITS (ციკლები) ================= */}
          {activeSec === "cycles" && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">დრო და ციკლები · 2026–2030 ეფემერიდი</div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">ცხოვრებისეული ციკლები და ლაივ ტრანზიტები</h2>
              </div>

              {/* Live Daily Transit Engine */}
              <div className="cr-glass cr-accent p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">ტრანზიტების ლაივ გამომთვლელი</div>
                    <h3 className="text-lg font-bold text-white mt-0.5">არჩეული თარიღი: {transitDate}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(transitDate);
                        d.setDate(d.getDate() - 1);
                        setTransitDate(d.toISOString().slice(0, 10));
                      }}
                      className="cr-chip text-xs py-1 px-2.5"
                    >
                      « -1 დღე
                    </button>
                    <input
                      type="date"
                      min="2026-01-01"
                      max="2030-12-31"
                      value={transitDate}
                      onChange={e => setTransitDate(e.target.value)}
                      className="rounded-xl border border-white/20 bg-black/60 px-3 py-1 text-xs text-white outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(transitDate);
                        d.setDate(d.getDate() + 1);
                        setTransitDate(d.toISOString().slice(0, 10));
                      }}
                      className="cr-chip text-xs py-1 px-2.5"
                    >
                      +1 დღე »
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransitDate("2026-06-22")}
                      className="cr-chip cr-on text-xs py-1 px-3"
                    >
                      სოლარი 2026
                    </button>
                  </div>
                </div>

                {/* Active Transit Hits Banner */}
                {dailyTransitData && dailyTransitData.hits.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase text-amber-300 flex items-center gap-2">
                      <span>⚡︎ აქტიური ასპექტები ნატალურ რუკასთან ({dailyTransitData.hits.length})</span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {dailyTransitData.hits.map((hit, i) => (
                        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">
                              {BODY_META[hit.transitBody]?.n || hit.transitBody} (Tr) {hit.glyph} {BODY_META[hit.natalBody]?.n || hit.natalBody}
                            </span>
                            <span className="font-mono text-[10px] text-cyan-300">{hit.orb.toFixed(2)}°</span>
                          </div>
                          <div className="text-[11px] text-slate-300">{hit.aspectKa}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-1">ამ თარიღისთვის მჭიდრო ორბიანი ასპექტები არ დაფიქსირდა.</div>
                )}

                {/* Daily Planetary Positions Table */}
                {dailyTransitData && (
                  <div className="space-y-2 pt-2">
                    <div className="text-xs font-bold text-slate-300 uppercase">პლანეტების ტრანზიტული პოზიციები ({transitDate})</div>
                    <div className="overflow-x-auto max-h-56 overflow-y-auto pr-1">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400">
                            <th className="py-1.5 px-2">სხეული</th>
                            <th className="py-1.5 px-2">ნიშანი</th>
                            <th className="py-1.5 px-2">გრადუსი</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {dailyTransitData.bodies.map(b => {
                            const meta = BODY_META[b.name] || { n: b.name, g: "•", c: "#fff" };
                            const p = formatPos(b.longitude);
                            return (
                              <tr key={b.name} className="hover:bg-white/[0.04]">
                                <td className="py-1.5 px-2 font-semibold text-white flex items-center gap-1.5">
                                  <span style={{ color: meta.c }}>{meta.g}</span>
                                  <span>{meta.n}</span>
                                </td>
                                <td className="py-1.5 px-2 text-slate-300">{p.sign.n}</td>
                                <td className="py-1.5 px-2 font-mono text-cyan-300">{p.full}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Major Lifetime Cycle Milestones Timeline */}
              <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-cyan-300">ცხოვრებისეული ციკლების ქრონოლოგია</div>
                    <h3 className="text-lg font-black text-white mt-0.5">30 მთავარი ევოლუციური ეტაპი (0–84 წელი)</h3>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/30">
                    Swiss Ephemeris დროითი ხაზი
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(ATLAS_NATAL_DATA?.cycles || []).map((cyc: any, i: number) => {
                    const cycInfo = ATLAS_CYCM[cyc.k] || [cyc.b || "ასტროლოგიური ციკლი", "მნიშვნელოვანი ევოლუციური გარდატეხა", "#cbd5e1"];
                    const [cTitle, cDesc, cColor] = cycInfo;
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-2 hover:border-cyan-400/30 transition shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white flex items-center gap-1.5" style={{ color: cColor }}>
                            <span>●</span> {cTitle}
                          </span>
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 text-cyan-300 font-bold">
                            {cyc.age.toFixed(1)} წ.
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {cDesc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5-Year High-Impact Highlights (2026-2030) */}
              <div className="cr-glass p-6 space-y-4 rounded-2xl border border-white/10">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300">2026–2030 ეპოქალური ტრანზიტები</div>
                  <h3 className="text-lg font-black text-white mt-0.5">მთავარი პლანეტარული ზემოქმედებები ნატალურ რუკაზე</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold">
                        <th className="py-2 px-3">ტრანზიტული პლანეტა</th>
                        <th className="py-2 px-3">ასპექტი</th>
                        <th className="py-2 px-3">ნატალური წერტილი</th>
                        <th className="py-2 px-3">პერიოდი (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(ATLAS_NATAL_DATA?.hl || []).map((item: any, idx: number) => {
                        const mTrans = BODY_META[item.b] || { n: item.b, g: "•", c: "#fff" };
                        const mNat = BODY_META[item.t] || { n: item.t, g: "•", c: "#fff" };
                        const aspDef = ASPECTS_DEF[item.a] || { n: item.a, g: "•" };
                        return (
                          <tr key={idx} className="hover:bg-white/[0.04] transition">
                            <td className="py-2 px-3 font-semibold text-white flex items-center gap-1.5">
                              <span style={{ color: mTrans.c }}>{mTrans.g}</span>
                              <span>{mTrans.n}</span>
                            </td>
                            <td className="py-2 px-3 text-cyan-300 font-medium">
                              {aspDef.g} {aspDef.n}
                            </td>
                            <td className="py-2 px-3 text-slate-200 font-medium">
                              {mNat.n}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                              2026–2030 პიკური ფაზები
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION 11: SYNTHESIS & FULL INTERPRETATION (სრული ინტერპრეტაცია) ================= */}
          {activeSec === "synthesis" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">სინთეზი და ბიბლიოთეკა</div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">სრული არქეტიპული სინთეზი</h2>
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

              {/* 5 Synthesis Archetype Themes Cards */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase text-white tracking-wider">მთავარი სინთეზური თემები</div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(ATLAS_SYN_DATA?.themes || []).map((th: any, idx: number) => (
                    <div key={idx} className="cr-glass p-5 space-y-2 border-t-2 border-t-cyan-400">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-cyan-300">#{idx + 1}</span>
                        <h4 className="text-sm font-bold text-white">{th.t}</h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{th.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Practical Rituals & Guidance */}
              {ATLAS_SYN_DATA?.practice && (
                <div className="cr-glass cr-accent p-6 space-y-3">
                  <div className="text-xs font-bold uppercase text-amber-300">პრაქტიკული რეკომენდაციები და ინტეგრაციის რიტუალები</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(ATLAS_SYN_DATA.practice || []).map((p: any, i: number) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs space-y-1">
                        <strong className="text-white block">{p.t}</strong>
                        <p className="text-slate-300 leading-relaxed">{p.d}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Interpretation Content Display */}
              <div className="cr-interpretation-surface p-6 sm:p-10 space-y-6 leading-relaxed">
                {interpretation ? (
                  <InterpretationText
                    text={interpretation}
                    afterNavigator={chartSynthesisPanel}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="text-center py-12 text-slate-400">
                      ინტერპრეტაცია ჯერ არ დაგენერირებულა.
                    </div>
                    {chartSynthesisPanel}
                  </div>
                )}
              </div>

              <details className="cr-glass p-5 text-sm text-slate-300">
                <summary className="cursor-pointer font-bold text-cyan-200">მეთოდოლოგია, წყაროები და სიზუსტე</summary>
                <div className="mt-4 space-y-3 leading-7 text-slate-300">
                  <p>პლანეტების პოზიციები და სახლები გამოთვლილია Swiss Ephemeris-ით. ინტერპრეტაცია აერთიანებს აპის ქართულ ბიბლიოთეკას, შესაბამის ბიბლიოთეკურ ჩანაწერებს და საჭიროებისას მათ ქეშირებულ ქართულ თარგმანს.</p>
                  <p>ხელოვნური ინტელექტის პასუხი ღილაკზე დაჭერის შემდეგ იქმნება OpenRouter-ით, საჭიროებისას Groq-ის სათადარიგო სერვისით. ის ვერ ცვლის გამოთვლილ მონაცემებს და არ არის სამედიცინო, ფსიქოლოგიური ან ფინანსური რჩევა.</p>
                </div>
              </details>
            </div>
          )}

          {activeSec === "ai-interpretation" && (
            <div className="max-w-5xl">
              <RoomAiInsight birth={birth} houseSystem={houseSystem ?? "placidus"} />
            </div>
          )}
        </main>
      </div>

      {/* ===== 5. Top-right workspace controls ===== */}
      <div className="cr-fab fixed right-[3vw] top-2 z-[70] flex items-center gap-2.5">
        <button
          onClick={() => window.print()}
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#141a3c]/90 text-white shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-indigo-600 cursor-pointer"
          aria-label="ბეჭდვა / PDF"
          title="ბეჭდვა / PDF"
        >
          <Printer className="h-3.5 w-3.5" />
        </button>

        {wheel && interpretation && (
          <>
            <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-white/25" />
            <button
              onClick={saveCurrentChart}
              type="button"
              disabled={isSavingChart || isChartSaved}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/15 text-cyan-100 shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-cyan-500/25 disabled:cursor-default disabled:opacity-80"
              aria-label={isChartSaved ? "რუკა შენახულია" : isSavingChart ? "რუკა ინახება" : "რუკის შენახვა"}
              title={saveChartMessage ?? (isChartSaved ? "რუკა შენახულია" : isSavingChart ? "რუკა ინახება…" : "რუკის შენახვა")}
            >
              {isSavingChart ? <Loader2 className="h-4 w-4 animate-spin" /> : isChartSaved ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </>
        )}

        <button
          onClick={() => setIsSearchModalOpen(true)}
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-[#141a3c]/90 text-white shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-indigo-600 cursor-pointer"
          title="ძებნა (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => setIsLightTheme(prev => !prev)}
          type="button"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 shadow-xl backdrop-blur-xl transition hover:scale-105 cursor-pointer ${
            isLightTheme ? "bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950" : "bg-[#141a3c]/90 text-slate-300"
          }`}
          aria-pressed={isLightTheme}
          title={isLightTheme ? "მუქ ფონზე დაბრუნება" : "ღია ფონზე გადასვლა"}
        >
          {isLightTheme ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>

        <button
          onClick={onClose}
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-500/40 bg-rose-950/80 text-rose-200 shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-rose-900 cursor-pointer"
          title="კაბინეტის დახურვა"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Fixed readers do not expose the page-level hub, so each room owns it. */}
      <FloatingContactHub className="z-[120]" scrollContainerRef={roomRef} />

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
                    openSection(s.id);
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
                    openSection("chart");
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
