"use client";

import { scrollToAscendantSection } from "@/lib/scrollToAscendant";

const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const SIGN_COLORS = [
  "#FF3B30", "#D97706", "#38BDF8", "#2563EB", // ცეცხლი/მიწა/ჰაერი/წყალი
  "#FF3B30", "#D97706", "#38BDF8", "#2563EB",
  "#FF3B30", "#D97706", "#38BDF8", "#2563EB",
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
  MeanNode: "☊",
};

// საერთაშორისო ასტროლოგიური სტანდარტის მიხედვით აღიარებული პლანეტებისა და მნათობების ფერები
const PLANET_COLORS: Record<string, string> = {
  Sun: "#FBBF24",      // ☉ ოქროსფერი კაშკაშა მზე
  Moon: "#F1F5F9",     // ☽ ვერცხლისფერი მთვარე
  Mercury: "#C084FC",  // ☿ იასამნისფერი მერკური
  Venus: "#F472B6",    // ♀ ვარდისფერი ვენერა
  Mars: "#EF4444",     // ♂ მეწამული წითელი მარსი
  Jupiter: "#60A5FA",  // ♃ საფირისფერი ლურჯი იუპიტერი
  Saturn: "#F59E0B",   // ♄ ბრინჯაოსფერი სატურნი
  Uranus: "#22D3EE",   // ♅ ელექტრიკ აკვა ურანი
  Neptune: "#818CF8",  // ♆ ოკეანისფერი იასამნისფერი ნეპტუნი
  Pluto: "#E879F9",    // ♇ კოსმოსური მაგენტა პლუტონი
  TrueNode: "#2DD4BF", // ☊ ტირკიზისფერი ჩრდილოეთ კვანძი
  MeanNode: "#2DD4BF",
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

        {/* ASC/MC/DESC/IC ღერძები და გამოსახული პილების ბეჯები */}
        {angleLines.map(({ lon, label, color, textColor, bg }) => {
          const pEnd = toXY(lon, rOuter + size * 0.035);
          const pBadge = toXY(lon, rOuter + size * 0.08);
          const pInner = toXY(lon, rInner);
          const isAsc = label === "ASC";

          return (
            <g
              key={label}
              className={isAsc ? "ascendant-axis cursor-pointer transition-opacity hover:opacity-80" : undefined}
              onClick={isAsc ? scrollToAscendantSection : undefined}
              onKeyDown={isAsc ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  scrollToAscendantSection();
                }
              } : undefined}
              role={isAsc ? "button" : undefined}
              tabIndex={isAsc ? 0 : undefined}
            >
              {isAsc && <title>გადადი ასცენდენტის ინტერპრეტაციაზე</title>}
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

        {/* პლანეტები - პროფესიონალური ასტროლოგიური სტანდარტით (სტატიკური, უანიმაციო, მკვეთრი) */}
        {sorted.map((p, idx) => {
          const pos = toXY(p.longitude, radii[idx]);
          const deg = Math.floor(norm360(p.longitude) % 30);
          const color = PLANET_COLORS[p.name] ?? "#F59E0B";
          const glyph = PLANET_GLYPHS[p.name] ?? "•";

          return (
            <g key={p.name} className="select-none">
              {/* ნაზი, ელეგანტური ფონის ჰალო (Halo) პლანეტის გარშემო */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={size * 0.024}
                fill="#0d0726"
                stroke={color}
                strokeWidth="1.2"
                opacity="0.9"
                style={{ filter: `drop-shadow(0 0 6px ${color}bb)` }}
              />
              {/* პლანეტის ოფიციალური სიმბოლო - მკვეთრი, მყარი და მკაფიო (უანიმაციო) */}
              <text
                x={pos.x}
                y={pos.y + 0.5}
                fill={color}
                className="font-black select-none"
                fontSize={size * 0.036}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ textShadow: `0 0 10px ${color}, 0 0 4px ${color}` }}
              >
                {glyph}
              </text>
              {/* გრადუსის მაჩვენებელი */}
              <text
                x={pos.x}
                y={pos.y + size * 0.034}
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
