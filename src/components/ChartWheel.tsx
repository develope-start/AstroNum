"use client";

const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_COLORS = [
  "#FF5722", "#10B981", "#FBBF24", "#00E5FF", // ცეცხლი/მიწა/ჰაერი/წყალი
  "#FF5722", "#10B981", "#FBBF24", "#00E5FF",
  "#FF5722", "#10B981", "#FBBF24", "#00E5FF",
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
  size = 500,
}: {
  ascendant: number;
  mc: number;
  cusps: number[];
  planets: WheelPlanet[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.38; // 190 at size 500
  const rZodiacIn = size * 0.31; // 155
  const rHouseLine = size * 0.31;
  const rPlanetBase = size * 0.235; // 117.5
  const rInner = size * 0.14; // 70

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
      if (diff < 8 && radii[i - 1] === rPlanetBase) r = rPlanetBase - size * 0.05;
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
    { lon: ascendant, label: "ASC", color: "#F59E0B", textColor: "#FDE68A", bg: "#1a0f00" },
    { lon: mc, label: "MC", color: "#38BDF8", textColor: "#E0F2FE", bg: "#001827" },
    { lon: norm360(ascendant + 180), label: "DESC", color: "#F59E0B", textColor: "#FDE68A", bg: "#1a0f00" },
    { lon: norm360(mc + 180), label: "IC", color: "#38BDF8", textColor: "#E0F2FE", bg: "#001827" },
  ];

  return (
    <div className="w-full flex justify-center items-center py-2 px-1">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl drop-shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-visible"
      >
        <defs>
          <radialGradient id="wheel-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#0F0728" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#080414" stopOpacity="0.98" />
          </radialGradient>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ფონის რადიალური გრადიენტი */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#wheel-center-glow)" />

        {/* გარე წრე და ზოდიაქოს რგოლი */}
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#F59E0B" strokeOpacity={0.5} strokeWidth={2} filter="url(#gold-glow)" />
        <circle cx={cx} cy={cy} r={rZodiacIn} fill="none" stroke="#F59E0B" strokeOpacity={0.35} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#A855F7" strokeOpacity={0.4} strokeWidth={1.2} />

        {/* 12 სექტორი და ზოდიაქოს ნიშნები */}
        {zodiacSegments.map(({ i, p1, p2, labelPos }) => (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#F59E0B" strokeOpacity={0.3} strokeWidth={1} />
            <text
              x={labelPos.x}
              y={labelPos.y}
              fill={SIGN_COLORS[i]}
              fontSize={size * 0.042}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-extrabold select-none"
              style={{ textShadow: `0 0 12px ${SIGN_COLORS[i]}` }}
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
          const labelPos = toXY(c + 4, rInner + size * 0.05);
          return (
            <g key={i}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isAngle ? "#F59E0B" : "#64748B"}
                strokeWidth={isAngle ? 2.5 : 1}
                strokeDasharray={isAngle ? undefined : "3 3"}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill="#CBD5E1"
                className="font-bold select-none"
                fontSize={size * 0.026}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* ASC/MC/DESC/IC ღერძები და გამოსახული პილების ბეჯები (Zero-Clipping) */}
        {angleLines.map(({ lon, label, color, textColor, bg }) => {
          const pEnd = toXY(lon, rOuter + size * 0.035);
          const pBadge = toXY(lon, rOuter + size * 0.08); // Radius 230 - perfect 20px padding from 250 edge
          const pInner = toXY(lon, rInner);

          return (
            <g key={label}>
              {/* ღერძის ხაზი ცენტრიდან გარე ბეჯამდე */}
              <line
                x1={pInner.x}
                y1={pInner.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={color}
                strokeWidth={2.5}
                strokeDasharray={label === "DESC" || label === "IC" ? "4 2" : undefined}
                filter="url(#gold-glow)"
              />

              {/* კაშკაშა ბეჯის ფონი (Pill Badge) */}
              <rect
                x={pBadge.x - 22}
                y={pBadge.y - 11}
                width="44"
                height="22"
                rx="11"
                fill={bg}
                stroke={color}
                strokeWidth="1.8"
                style={{ filter: `drop-shadow(0 0 10px ${color})` }}
              />

              {/* ASC / MC / DESC / IC ტექსტი */}
              <text
                x={pBadge.x}
                y={pBadge.y}
                fill={textColor}
                className="font-black select-none tracking-wider"
                fontSize={size * 0.028}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* პლანეტები წრეების გარეშე, სტიქიური ფერებითა და გლოუ ნათებით */}
        {sorted.map((p, idx) => {
          const pos = toXY(p.longitude, radii[idx]);
          const deg = Math.floor(norm360(p.longitude) % 30);
          const signIdx = Math.floor(norm360(p.longitude) / 30);
          const color = SIGN_COLORS[signIdx % 4];

          return (
            <g key={p.name} className="group cursor-pointer">
              {/* პლანეტის სიმბოლო - წრის გარეშე, სტიქიური ფერის გლოუ ნათებით */}
              <text
                x={pos.x}
                y={pos.y}
                fill={color}
                className="font-black select-none transition-transform duration-300 group-hover:scale-125"
                fontSize={size * 0.038}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ textShadow: `0 0 10px ${color}, 0 0 20px ${color}aa` }}
              >
                {PLANET_GLYPHS[p.name] ?? "•"}
              </text>
              {/* გრადუსის მაჩვენებელი ქვემოთ */}
              <text
                x={pos.x}
                y={pos.y + size * 0.032}
                fill={color}
                className="font-bold select-none opacity-85 group-hover:opacity-100"
                fontSize={size * 0.02}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {deg}°
              </text>
            </g>
          );
        })}

        {/* ცენტრალური გულარი */}
        <circle cx={cx} cy={cy} r={rInner * 0.4} fill="#09041A" stroke="#A855F7" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={3} fill="#F59E0B" />
      </svg>
    </div>
  );
}

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}
