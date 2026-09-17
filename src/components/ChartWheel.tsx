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

// საერთაშორისო ასტროლოგიური სტანდარტი
const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFD26A",      // ☉ ოქროსფერი კაშკაშა მზე
  Moon: "#F1F5F9",     // ☽ ვერცხლისფერი მთვარე
  Mercury: "#C084FC",  // ☿ იასამნისფერი მერკური
  Venus: "#F472B6",    // ♀ ვარდისფერი ვენერა
  Mars: "#FF5252",     // ♂ მეწამული წითელი მარსი
  Jupiter: "#60A5FA",  // ♃ საფირისფერი ლურჯი იუპიტერი
  Saturn: "#F59E0B",   // ♄ ბრინჯაოსფერი სატურნი
  Uranus: "#22D3EE",   // ♅ ელექტრიკ აკვა ურანი
  Neptune: "#818CF8",  // ♆ ოკეანისფერი იასამნისფერი ნეპტუნი
  Pluto: "#E879F9",    // ♇ კოსმოსური მაგენტა პლუტონი
  TrueNode: "#2DD4BF", // ☊ ტირკიზისფერი ჩრდილოეთ კვანძი
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
  const rOuter = size * 0.39; // 195 at size 500
  const rZodiacIn = size * 0.325; // 162.5
  const rHouseLine = size * 0.325;
  const rPlanetBase = size * 0.245; // 122.5
  const rInner = size * 0.15; // 75

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
      if (diff < 8 && radii[i - 1] === rPlanetBase) r = rPlanetBase - size * 0.048;
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
    { lon: ascendant, label: "ASC", color: "#FFD26A", textColor: "#FFF0C2", bg: "#1a0f00" },
    { lon: mc, label: "MC", color: "#22D3EE", textColor: "#E0F2FE", bg: "#001827" },
    { lon: norm360(ascendant + 180), label: "DESC", color: "#FFD26A", textColor: "#FFF0C2", bg: "#1a0f00" },
    { lon: norm360(mc + 180), label: "IC", color: "#22D3EE", textColor: "#E0F2FE", bg: "#001827" },
  ];

  // Calculate planetary aspect lines (conjunction, trine, sextile, square, opposition)
  const aspectLines: Array<{ p1: { x: number; y: number }; p2: { x: number; y: number }; color: string; dash?: string }> = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      let diff = Math.abs(sorted[i].longitude - sorted[j].longitude);
      if (diff > 180) diff = 360 - diff;
      
      let aspectColor: string | null = null;
      let dash: string | undefined = undefined;

      if (Math.abs(diff - 120) <= 6 || Math.abs(diff - 60) <= 5) {
        // Trine (120) / Sextile (60) -> Soft Neon Cyan/Teal (Harmonious)
        aspectColor = "rgba(34, 211, 238, 0.45)";
      } else if (Math.abs(diff - 90) <= 6 || Math.abs(diff - 180) <= 6) {
        // Square (90) / Opposition (180) -> Neon Crimson/Magenta (Dynamic/Challenging)
        aspectColor = "rgba(244, 63, 94, 0.45)";
        dash = "3 3";
      } else if (diff <= 8) {
        // Conjunction (0) -> Solar Gold
        aspectColor = "rgba(255, 210, 106, 0.55)";
      }

      if (aspectColor) {
        aspectLines.push({
          p1: toXY(sorted[i].longitude, rInner - 2),
          p2: toXY(sorted[j].longitude, rInner - 2),
          color: aspectColor,
          dash,
        });
      }
    }
  }

  return (
    <div className="w-full flex justify-center items-center py-2 px-1">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="zodiac-wheel w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl drop-shadow-[0_16px_50px_rgba(0,0,0,0.9)] overflow-visible"
      >
        <defs>
          <radialGradient id="glass-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#120a2e" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#07050f" stopOpacity="0.95" />
          </radialGradient>
          <linearGradient id="gold-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD26A" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.8" />
          </linearGradient>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Glassmorphic Radial Background */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#glass-center-glow)" />

        {/* 2. Outer Zodiac Ring with Soft 1px Gradient Border */}
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="url(#gold-border-grad)" strokeWidth={1.5} filter="url(#neon-glow)" />
        <circle cx={cx} cy={cy} r={rZodiacIn} fill="none" stroke="#FFD26A" strokeOpacity={0.3} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#A855F7" strokeOpacity={0.45} strokeWidth={1} />

        {/* 3. Aspect Lines inside Inner Glass Circle (1px Thin Neon lines) */}
        {aspectLines.map((asp, idx) => (
          <line
            key={idx}
            x1={asp.p1.x}
            y1={asp.p1.y}
            x2={asp.p2.x}
            y2={asp.p2.y}
            stroke={asp.color}
            strokeWidth={1}
            strokeDasharray={asp.dash}
          />
        ))}

        {/* 4. 12 Zodiac Segments and Symbols */}
        {zodiacSegments.map(({ i, p1, p2, labelPos }) => (
          <g key={i}>
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#FFD26A" strokeOpacity={0.25} strokeWidth={1} />
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

        {/* 5. House Cusps Lines */}
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
                stroke={isAngle ? "#FFD26A" : "#64748B"}
                strokeWidth={isAngle ? 2 : 0.8}
                strokeDasharray={isAngle ? undefined : "3 3"}
                strokeOpacity={isAngle ? 0.9 : 0.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                fill="#CBD5E1"
                className="font-bold select-none"
                fontSize={size * 0.025}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* 6. ASC/MC/DESC/IC Angles */}
        {angleLines.map(({ lon, label, color, textColor, bg }) => {
          const pEnd = toXY(lon, rOuter + size * 0.035);
          const pBadge = toXY(lon, rOuter + size * 0.08);
          const pInner = toXY(lon, rInner);

          return (
            <g key={label}>
              <line
                x1={pInner.x}
                y1={pInner.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={label === "DESC" || label === "IC" ? "4 2" : undefined}
                filter="url(#neon-glow)"
              />

              <rect
                x={pBadge.x - 22}
                y={pBadge.y - 11}
                width="44"
                height="22"
                rx="11"
                fill={bg}
                stroke={color}
                strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 10px ${color})` }}
              />

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

        {/* 7. Planets (Sleek vector symbols without rough circular borders) */}
        {sorted.map((p, idx) => {
          const pos = toXY(p.longitude, radii[idx]);
          const deg = Math.floor(norm360(p.longitude) % 30);
          const color = PLANET_COLORS[p.name] ?? "#FFD26A";
          const glyph = PLANET_GLYPHS[p.name] ?? "•";

          return (
            <g key={p.name} className="select-none">
              {/* Clean Planet Symbol with Vibrant Neon Glow */}
              <text
                x={pos.x}
                y={pos.y + 0.5}
                fill={color}
                className="font-black select-none"
                fontSize={size * 0.038}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ textShadow: `0 0 14px ${color}, 0 0 5px ${color}` }}
              >
                {glyph}
              </text>
              {/* Degree label below planet */}
              <text
                x={pos.x}
                y={pos.y + size * 0.032}
                fill="#CBD5E1"
                className="font-bold select-none opacity-90"
                fontSize={size * 0.018}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {deg}°
              </text>
            </g>
          );
        })}

        {/* 8. Glassmorphic Central Layer */}
        <circle cx={cx} cy={cy} r={rInner * 0.45} fill="rgba(10, 6, 26, 0.9)" stroke="#FFD26A" strokeWidth="1" strokeOpacity="0.6" />
        <circle cx={cx} cy={cy} r={3} fill="#FFD26A" filter="url(#neon-glow)" />
      </svg>
    </div>
  );
}

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}
