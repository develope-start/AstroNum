"use client";

const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_COLORS = [
  "#EF4444", "#10B981", "#F59E0B", "#38BDF8", // ცეცხლი/მიწა/ჰაერი/წყალი — ვერძი,კურო,ტყუპ,კირჩხ
  "#EF4444", "#10B981", "#F59E0B", "#38BDF8",
  "#EF4444", "#10B981", "#F59E0B", "#38BDF8",
];

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  TrueNode: "☊",
};

export interface WheelPlanet {
  name: string;
  longitude: number;
}

export default function ChartWheel({
  ascendant,
  mc,
  cusps,
  planets,
  size = 380,
}: {
  ascendant: number;
  mc: number;
  cusps: number[];
  planets: WheelPlanet[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.48;
  const rZodiacIn = size * 0.4;
  const rHouseLine = size * 0.4;
  const rPlanetBase = size * 0.3;
  const rInner = size * 0.18;

  function toXY(longitude: number, r: number) {
    const mathAngle = ((180 + (longitude - ascendant)) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(mathAngle),
      y: cy - r * Math.sin(mathAngle),
    };
  }

  const sorted = [...planets].sort((a, b) => a.longitude - b.longitude);
  const radii: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    let r = rPlanetBase;
    if (i > 0) {
      const prev = sorted[i - 1];
      let diff = sorted[i].longitude - prev.longitude;
      if (diff < 0) diff += 360;
      if (diff < 7 && radii[i - 1] === rPlanetBase) r = rPlanetBase - size * 0.055;
    }
    radii.push(r);
  }

  const zodiacSegments = Array.from({ length: 12 }, (_, i) => {
    const start = i * 30;
    const mid = start + 15;
    const p1 = toXY(start, rOuter);
    const p2 = toXY(start, rZodiacIn);
    const labelPos = toXY(mid, (rOuter + rZodiacIn) / 2);
    return { i, p1, p2, labelPos };
  });

  const angleLines = [
    { lon: ascendant, label: "ASC" },
    { lon: mc, label: "MC" },
    { lon: norm360(ascendant + 180), label: "DESC" },
    { lon: norm360(mc + 180), label: "IC" },
  ];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-md drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
      <defs>
        <radialGradient id="wheel-center-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#0F0728" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#080414" stopOpacity="0.95" />
        </radialGradient>
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ფონის რადიალური გრადიენტი */}
      <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheel-center-glow)" />

      {/* გარე წრე და ზოდიაქოს რგოლი */}
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#F59E0B" strokeOpacity={0.4} strokeWidth={1.5} filter="url(#gold-glow)" />
      <circle cx={cx} cy={cy} r={rZodiacIn} fill="none" stroke="#F59E0B" strokeOpacity={0.3} strokeWidth={1} />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#A855F7" strokeOpacity={0.35} strokeWidth={1} />

      {zodiacSegments.map(({ i, p1, p2, labelPos }) => (
        <g key={i}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#F59E0B" strokeOpacity={0.25} strokeWidth={1} />
          <text
            x={labelPos.x}
            y={labelPos.y}
            fill={SIGN_COLORS[i]}
            fontSize={size * 0.046}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-extrabold select-none"
            style={{ textShadow: `0 0 10px ${SIGN_COLORS[i]}77` }}
          >
            {SIGN_SYMBOLS[i]}
          </text>
        </g>
      ))}

      {/* სახლების ცუსპები */}
      {cusps.map((c, i) => {
        const p1 = toXY(c, rInner);
        const p2 = toXY(c, rHouseLine);
        const isAngle = i === 0 || i === 3 || i === 6 || i === 9;
        const labelPos = toXY(c + 3, rInner + (size * 0.05));
        return (
          <g key={i}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isAngle ? "#F59E0B" : "#475569"}
              strokeWidth={isAngle ? 2 : 0.85}
              strokeDasharray={isAngle ? undefined : "2 2"}
            />
            <text x={labelPos.x} y={labelPos.y} fill="#94A3B8" className="font-semibold select-none" fontSize={size * 0.028} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* ASC/MC/DESC/IC ღერძები */}
      {angleLines.map(({ lon, label }) => {
        const p = toXY(lon, rOuter + size * 0.04);
        return (
          <text key={label} x={p.x} y={p.y} fill="#FDE68A" className="font-extrabold select-none" fontSize={size * 0.035} textAnchor="middle" filter="url(#gold-glow)">
            {label}
          </text>
        );
      })}

      {/* პლანეტები */}
      {sorted.map((p, idx) => {
        const pos = toXY(p.longitude, radii[idx]);
        return (
          <g key={p.name} className="group cursor-pointer">
            <circle cx={pos.x} cy={pos.y} r={size * 0.034} fill="#09041A" stroke="#F59E0B" strokeWidth={1.5} filter="url(#gold-glow)" />
            <text
              x={pos.x}
              y={pos.y}
              fill="#FDE68A"
              className="font-bold select-none"
              fontSize={size * 0.036}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {PLANET_GLYPHS[p.name] ?? "•"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

