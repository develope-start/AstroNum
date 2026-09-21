"use client";

import { scrollToAscendantSection } from "@/lib/scrollToAscendant";
import type { AspectHit } from "@/lib/astro/aspects";

const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_COLORS = [
  "#fb7185", "#f59e0b", "#38bdf8", "#60a5fa", "#fb7185", "#f59e0b",
  "#38bdf8", "#60a5fa", "#fb7185", "#f59e0b", "#38bdf8", "#60a5fa",
];

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
  Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", TrueNode: "☊", MeanNode: "☊",
  Lilith: "⚸", Selena: "⚪", Chiron: "⚷",
};

const PLANET_COLORS: Record<string, string> = {
  Sun: "#fbbf24", Moon: "#f8fafc", Mercury: "#c084fc", Venus: "#f472b6", Mars: "#ef4444",
  Jupiter: "#60a5fa", Saturn: "#f59e0b", Uranus: "#22d3ee", Neptune: "#818cf8", Pluto: "#e879f9",
  TrueNode: "#2dd4bf", MeanNode: "#2dd4bf", Lilith: "#f472b6", Selena: "#e2e8f0", Chiron: "#a78bfa",
};

const ASPECT_COLORS: Record<string, string> = {
  Conjunction: "#fbbf24", Sextile: "#38bdf8", Trine: "#34d399", Opposition: "#fb7185",
  Square: "#f97316", SemiSextile: "#94a3b8", SemiSquare: "#c084fc", Quintile: "#a78bfa",
  Sesquiquadrate: "#fb923c", Biquintile: "#818cf8", Quincunx: "#f472b6",
};

export interface WheelPlanet {
  name: string;
  longitude: number;
}

export interface WheelFixedStar {
  star: string;
  planet: string;
  longitude: number;
  orb: number;
}

function emitFocus(target: { type: string; key: string }) {
  window.dispatchEvent(new CustomEvent("focus-interpretation", { detail: target }));
}

export default function ChartWheel({
  ascendant,
  mc,
  cusps,
  planets,
  aspects = [],
  fixedStars = [],
  size = 620,
}: {
  ascendant: number;
  mc: number;
  cusps: number[];
  planets: WheelPlanet[];
  aspects?: AspectHit[];
  fixedStars?: WheelFixedStar[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.40;
  const rZodiacIn = size * 0.325;
  const rHouseLine = size * 0.325;
  const rPlanetBase = size * 0.245;
  const rInner = size * 0.145;

  function toXY(longitude: number, r: number) {
    const mathAngle = ((180 + (longitude - ascendant)) * Math.PI) / 180;
    return { x: cx + r * Math.cos(mathAngle), y: cy - r * Math.sin(mathAngle) };
  }

  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const radii: number[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    let r = rPlanetBase;
    if (i > 0) {
      const diff = angularDistance(sorted[i]!.longitude, sorted[i - 1]!.longitude);
      if (diff < 8) r = rPlanetBase - size * 0.052;
    }
    radii.push(r);
  }

  const pointByName = new Map(planets.map((planet) => [planet.name, planet]));
  const zodiacSegments = Array.from({ length: 12 }, (_, i) => {
    const start = i * 30;
    const p1 = toXY(start, rOuter);
    const p2 = toXY(start, rZodiacIn);
    const labelPos = toXY(start + 15, (rOuter + rZodiacIn) / 2);
    return { i, p1, p2, labelPos };
  });
  const angleLines = [
    { lon: ascendant, label: "ASC", color: "#f59e0b", textColor: "#fef3c7", bg: "#261500" },
    { lon: mc, label: "MC", color: "#38bdf8", textColor: "#e0f2fe", bg: "#001827" },
    { lon: norm360(ascendant + 180), label: "DESC", color: "#f59e0b", textColor: "#fef3c7", bg: "#261500" },
    { lon: norm360(mc + 180), label: "IC", color: "#38bdf8", textColor: "#e0f2fe", bg: "#001827" },
  ];

  return (
    <div className="chart-wheel-wrap w-full overflow-visible px-0.5 py-2 sm:px-2 sm:py-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block h-auto w-full max-w-[42rem] overflow-visible drop-shadow-[0_12px_45px_rgba(0,0,0,0.85)]" role="img" aria-label="ნატალური რუკის ბორბალი">
        <defs>
          <radialGradient id="wheel-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#0f0728" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#080414" stopOpacity="0.98" />
          </radialGradient>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>

        <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheel-center-glow)" />
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#f59e0b" strokeOpacity={0.55} strokeWidth={2} filter="url(#gold-glow)" />
        <circle cx={cx} cy={cy} r={rZodiacIn} fill="none" stroke="#f59e0b" strokeOpacity={0.35} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#a855f7" strokeOpacity={0.4} strokeWidth={1.2} />

        {zodiacSegments.map(({ i, p1, p2, labelPos }) => (
          <g key={`zodiac-${i}`}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeOpacity={0.3} strokeWidth={1} />
            <text x={labelPos.x} y={labelPos.y} fill={SIGN_COLORS[i]} fontSize={size * 0.045} textAnchor="middle" dominantBaseline="central" className="select-none font-extrabold" style={{ textShadow: `0 0 12px ${SIGN_COLORS[i]}` }}>{SIGN_SYMBOLS[i]}</text>
          </g>
        ))}

        {cusps.map((c, i) => {
          const p1 = toXY(c, rInner);
          const p2 = toXY(c, rHouseLine);
          const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
          const labelPos = toXY(c + 4, rInner + size * 0.052);
          return (
            <g key={`cusp-${i}`} className="cursor-pointer" onClick={() => emitFocus({ type: "house", key: String(i + 1) })}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isAngle ? (i === 0 || i === 6 ? "#f59e0b" : "#38bdf8") : "#64748b"} strokeWidth={isAngle ? 2.8 : 1} strokeDasharray={isAngle ? undefined : "3 3"} />
              <text x={labelPos.x} y={labelPos.y} fill={isAngle ? "#fde68a" : "#cbd5e1"} className="select-none font-bold" fontSize={size * 0.027} textAnchor="middle" dominantBaseline="central">{i + 1}</text>
              <title>{`სახლი ${i + 1} — დეტალების ნახვა`}</title>
            </g>
          );
        })}

        {angleLines.map(({ lon, label, color, textColor, bg }) => {
          const pEnd = toXY(lon, rOuter + size * 0.036);
          const pBadge = toXY(lon, rOuter + size * 0.08);
          const pInner = toXY(lon, rInner);
          const isAsc = label === "ASC";
          return (
            <g key={label} className="chart-wheel-interactive cursor-pointer transition-opacity hover:opacity-80" onClick={isAsc ? scrollToAscendantSection : () => emitFocus({ type: "angle", key: label })} onMouseDown={(event) => event.currentTarget.blur()} onKeyDown={isAsc ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); scrollToAscendantSection(); } } : undefined} role="button" tabIndex={isAsc ? 0 : -1}>
              <line x1={pInner.x} y1={pInner.y} x2={pEnd.x} y2={pEnd.y} stroke={color} strokeWidth={2.6} strokeDasharray={label === "DESC" || label === "IC" ? "4 2" : undefined} filter="url(#gold-glow)" />
              <rect x={pBadge.x - 24} y={pBadge.y - 12} width="48" height="24" rx="12" fill={bg} stroke={color} strokeWidth="1.8" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
              <text x={pBadge.x} y={pBadge.y} fill={textColor} className="select-none font-black tracking-wider" fontSize={size * 0.029} textAnchor="middle" dominantBaseline="central">{label}</text>
            </g>
          );
        })}

        {aspects.map((aspect, index) => {
          const a = pointByName.get(aspect.a);
          const b = pointByName.get(aspect.b);
          if (!a || !b) return null;
          const p1 = toXY(a.longitude, rInner * 0.95);
          const p2 = toXY(b.longitude, rInner * 0.95);
          const color = ASPECT_COLORS[aspect.aspect] ?? "#94a3b8";
          const opacity = Math.max(0.22, 0.78 - aspect.orb * 0.06);
          return <g key={`aspect-${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`} className="cursor-pointer" onClick={() => emitFocus({ type: "aspect", key: `${aspect.a}|${aspect.aspect}|${aspect.b}` })}><line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={color} strokeOpacity={opacity} strokeWidth={aspect.kind === "major" ? 1.8 : 0.95} strokeDasharray={aspect.kind === "minor" ? "3 3" : undefined} /><title>{`${aspect.a} ${aspect.aspectKa} ${aspect.b} — ორბი ${aspect.orb}°`}</title></g>;
        })}

        {fixedStars.map((star, index) => {
          const pos = toXY(star.longitude, rPlanetBase + size * 0.055);
          return <g key={`star-${star.star}-${index}`} className="cursor-pointer" onClick={() => emitFocus({ type: "star", key: star.star })}><circle cx={pos.x} cy={pos.y} r={size * 0.017} fill="#0d0726" stroke="#fef08a" strokeWidth="1.2" /><text x={pos.x} y={pos.y + 0.5} fill="#fef08a" fontSize={size * 0.029} textAnchor="middle" dominantBaseline="central">★</text><title>{`${star.star} — ${star.planet}, ორბი ${star.orb}°`}</title></g>;
        })}

        {sorted.map((planet, index) => {
          const pos = toXY(planet.longitude, radii[index]!);
          const deg = Math.floor(norm360(planet.longitude) % 30);
          const color = PLANET_COLORS[planet.name] ?? "#f59e0b";
          const glyph = PLANET_GLYPHS[planet.name] ?? "•";
          return <g key={planet.name} className="cursor-pointer select-none" onClick={() => emitFocus({ type: "planet", key: planet.name })}><circle cx={pos.x} cy={pos.y} r={size * 0.027} fill="#0d0726" stroke={color} strokeWidth="1.3" opacity="0.95" style={{ filter: `drop-shadow(0 0 6px ${color}bb)` }} /><text x={pos.x} y={pos.y + 0.5} fill={color} className="font-black" fontSize={size * 0.039} textAnchor="middle" dominantBaseline="central" style={{ textShadow: `0 0 10px ${color}` }}>{glyph}</text><text x={pos.x} y={pos.y + size * 0.041} fill="#cbd5e1" className="font-bold" fontSize={size * 0.019} textAnchor="middle" dominantBaseline="central">{deg}°</text><title>{`${planet.name} — დეტალების ნახვა`}</title></g>;
        })}

        <circle cx={cx} cy={cy} r={rInner * 0.4} fill="#09041a" stroke="#a855f7" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={3} fill="#f59e0b" />
      </svg>
    </div>
  );
}

function angularDistance(a: number, b: number) {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}

function norm360(x: number) {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}
