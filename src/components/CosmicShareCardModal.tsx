"use client";

import { Download, Sparkles, X, Share2, Flame, Droplets, Wind, Mountain } from "lucide-react";
import { useRef, useState } from "react";
import type { WheelPlanet } from "./ChartWheel";
import { eclipticToSign, formatDegree } from "@/lib/astro/signs";

interface CosmicShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  birthDate: string;
  birthPlace: string;
  planets: WheelPlanet[];
  ascendant: number;
}

const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const ELEMENTS = ["fire", "earth", "air", "water"] as const;

export default function CosmicShareCardModal({
  isOpen,
  onClose,
  userName,
  birthDate,
  birthPlace,
  planets,
  ascendant,
}: CosmicShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const sun = planets.find((p) => p.name === "Sun");
  const moon = planets.find((p) => p.name === "Moon");

  const sunSign = sun ? eclipticToSign(sun.longitude) : null;
  const moonSign = moon ? eclipticToSign(moon.longitude) : null;
  const ascSign = eclipticToSign(ascendant);

  const sunSymbol = sunSign ? SIGN_SYMBOLS[sunSign.signIndex] : "☉";
  const moonSymbol = moonSign ? SIGN_SYMBOLS[moonSign.signIndex] : "☽";
  const ascSymbol = SIGN_SYMBOLS[ascSign.signIndex];

  // Element calculation
  const elementCounts: Record<string, number> = { fire: 0, earth: 0, air: 0, water: 0 };
  planets.forEach((p) => {
    const s = eclipticToSign(p.longitude);
    const elemName = ELEMENTS[s.signIndex % 4];
    elementCounts[elemName] = (elementCounts[elemName] ?? 0) + 1;
  });
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "fire";

  const elementInfo: Record<string, { label: string; icon: typeof Flame; color: string; temper: string }> = {
    fire: { label: "ცეცხლი", icon: Flame, color: "#f59e0b", temper: "ქოლერიკული" },
    earth: { label: "მიწა", icon: Mountain, color: "#c8b72e", temper: "მელანქოლიკური" },
    air: { label: "ჰაერი", icon: Wind, color: "#a855f7", temper: "სანგვინიკური" },
    water: { label: "წყალი", icon: Droplets, color: "#38bdf8", temper: "ფლეგმატური" },
  };

  const elem = elementInfo[dominantElement] ?? elementInfo.fire!;
  const ElemIcon = elem.icon;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Create a canvas snapshot of the holographic card
      const card = cardRef.current;
      if (!card) return;

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw cosmic background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, "#05030f");
      bgGrad.addColorStop(0.5, "#0b071e");
      bgGrad.addColorStop(1, "#030108");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // Draw nebula glow
      const nebula = ctx.createRadialGradient(540, 600, 50, 540, 600, 600);
      nebula.addColorStop(0, "rgba(99, 102, 241, 0.35)");
      nebula.addColorStop(0.5, "rgba(168, 85, 247, 0.2)");
      nebula.addColorStop(1, "transparent");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, 1080, 1920);

      // Gold border frame
      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 6;
      ctx.strokeRect(60, 60, 960, 1800);

      // Inner thin frame
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 80, 920, 1760);

      // Header
      ctx.font = "bold 44px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#f59e0b";
      ctx.textAlign = "center";
      ctx.fillText("✦ ASTRONUM° COSMIC PROFILE ✦", 540, 180);

      ctx.font = "28px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("SWISS EPHEMERIS PRECISION ENGINE", 540, 230);

      // User name
      ctx.font = "bold 64px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(userName || "მომხმარებელი", 540, 380);

      ctx.font = "32px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(`${birthDate} · ${birthPlace}`, 540, 440);

      // Big 3 Section Divider
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      ctx.moveTo(180, 500);
      ctx.lineTo(900, 500);
      ctx.stroke();

      // Sun Sign
      ctx.font = "bold 90px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(sunSymbol, 540, 650);

      ctx.font = "bold 52px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`მზე: ${sunSign?.signName ?? "—"}`, 540, 740);

      ctx.font = "32px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(sun ? formatDegree(sunSign?.degreeInSign ?? 0) : "", 540, 790);

      // Moon Sign
      ctx.font = "bold 90px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#e0f2fe";
      ctx.fillText(moonSymbol, 540, 970);

      ctx.font = "bold 52px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`მთვარე: ${moonSign?.signName ?? "—"}`, 540, 1060);

      ctx.font = "32px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#7dd3fc";
      ctx.fillText(moon ? formatDegree(moonSign?.degreeInSign ?? 0) : "", 540, 1110);

      // Ascendant
      ctx.font = "bold 90px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#f472b6";
      ctx.fillText(ascSymbol, 540, 1290);

      ctx.font = "bold 52px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`ასცენდენტი: ${ascSign.signName}`, 540, 1380);

      ctx.font = "32px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#f472b6";
      ctx.fillText(formatDegree(ascSign.degreeInSign), 540, 1430);

      // Dominant Element
      ctx.font = "bold 38px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = elem.color;
      ctx.fillText(`დომინანტი სტიქია: ${elem.label} (${elem.temper})`, 540, 1600);

      // Footer
      ctx.font = "26px 'Noto Sans Georgian', sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("შექმნილია AstroNum° პლატფორმაზე · astronum.ge", 540, 1750);

      // Trigger download
      const link = document.createElement("a");
      link.download = `AstroNum-CosmicCard-${userName || "Chart"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative flex flex-col items-center max-w-sm w-full">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-slate-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          aria-label="დახურვა"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Holographic Cosmic Card (9:16 Aspect) */}
        <div
          ref={cardRef}
          className="relative w-full overflow-hidden rounded-[28px] border-2 border-amber-400/40 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(245,158,11,0.25)] transition-all"
          style={{
            background: "linear-gradient(165deg, #090518 0%, #150a33 45%, #05020c 100%)",
          }}
        >
          {/* Holographic Shimmer Foil Overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40 mix-blend-color-dodge"
            style={{
              background:
                "linear-gradient(115deg, transparent 20%, rgba(245, 158, 11, 0.25) 40%, rgba(56, 189, 248, 0.3) 60%, rgba(168, 85, 247, 0.25) 80%, transparent 100%)",
            }}
          />

          {/* Card Eyebrow */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-950/40 px-3 py-1 text-[11px] font-bold text-amber-300">
            <Sparkles className="h-3 w-3" />
            <span>ASTRONUM° COSMIC ID</span>
          </div>

          {/* User Details */}
          <h3 className="mt-4 font-display text-2xl font-black text-white tracking-tight">
            {userName || "ნატალური რუკა"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {birthDate} {birthPlace && `· ${birthPlace}`}
          </p>

          <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

          {/* The Big 3 Pillars */}
          <div className="space-y-3.5">
            {/* Sun */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-amber-400 font-black">{sunSymbol}</span>
                <div>
                  <span className="text-[10px] text-amber-300/80 font-bold uppercase tracking-wider block">მზე (იდენტობა)</span>
                  <span className="text-sm font-extrabold text-white">{sunSign?.signName ?? "—"}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-300">
                {sun ? formatDegree(sunSign?.degreeInSign ?? 0) : ""}
              </span>
            </div>

            {/* Moon */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-sky-300 font-black">{moonSymbol}</span>
                <div>
                  <span className="text-[10px] text-sky-300/80 font-bold uppercase tracking-wider block">მთვარე (სული/ემოცია)</span>
                  <span className="text-sm font-extrabold text-white">{moonSign?.signName ?? "—"}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-sky-200">
                {moon ? formatDegree(moonSign?.degreeInSign ?? 0) : ""}
              </span>
            </div>

            {/* Ascendant */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-rose-300 font-black">{ascSymbol}</span>
                <div>
                  <span className="text-[10px] text-rose-300/80 font-bold uppercase tracking-wider block">ასცენდენტი (გარეგნობა)</span>
                  <span className="text-sm font-extrabold text-white">{ascSign.signName}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-rose-200">
                {formatDegree(ascSign.degreeInSign)}
              </span>
            </div>
          </div>

          {/* Dominant Element Pill */}
          <div
            className="mt-4 flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
            style={{ borderColor: `${elem.color}55`, color: elem.color, backgroundColor: `${elem.color}15` }}
          >
            <ElemIcon className="h-4 w-4" />
            <span>დომინანტი სტიქია: {elem.label} · {elem.temper}</span>
          </div>

          {/* Footer Branding */}
          <div className="mt-5 text-[10px] text-slate-500 font-mono tracking-wider">
            SWISS EPHEMERIS · PRECISION ASTRONUM°
          </div>
        </div>

        {/* Download & Share Actions */}
        <div className="mt-4 flex w-full gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-950" />
            <span>{downloading ? "მზადდება…" : "ჩამოტვირთვა (Story)"}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center px-4 py-3 rounded-full border border-white/20 bg-white/5 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
}
