"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { Compass, LayoutDashboard, Menu, Shield, User, X } from "lucide-react";

interface Me {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

const BURST_PARTICLES = Array.from({ length: 14 }).map((_, i) => {
  const angle = (i * 360) / 14;
  const rad = (angle * Math.PI) / 180;
  const dist = 36 + (i % 3) * 12;
  const x = Math.cos(rad) * dist;
  const y = Math.sin(rad) * dist;
  return { x: `${x}px`, y: `${y}px`, delay: `${(i % 3) * 0.04}s` };
});

export default function Nav() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isBrandLit, setIsBrandLit] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setMe(data.user))
      .catch(() => setMe(null));
  }, []);

  const triggerExplosion = () => {
    setIsExploding(true);
    setIsBrandLit(true);
    setTimeout(() => setIsExploding(false), 700);
    setTimeout(() => setIsBrandLit(false), 520);
  };

  return (
    <header className="site-header">
      <div className="nav-shell px-3 py-2 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className={`brand-link group flex min-w-0 items-center gap-3${isBrandLit ? " is-brand-lit" : ""}`}
            onClick={triggerExplosion}
          >
            <div className="brand-mark-container">
              {/* 3D Stardust Orbital Ring on Hover */}
              <div className="brand-stardust-orbit" aria-hidden="true">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <circle cx="50" cy="50" r="42" stroke="rgba(167, 139, 250, 0.4)" strokeWidth="1" strokeDasharray="3 6" fill="none" />
                  <circle cx="50" cy="8" r="2.5" fill="#f43f5e" className="drop-shadow-[0_0_6px_#f43f5e]" />
                  <circle cx="92" cy="50" r="2" fill="#38bdf8" className="drop-shadow-[0_0_6px_#38bdf8]" />
                  <circle cx="50" cy="92" r="2.5" fill="#eab308" className="drop-shadow-[0_0_6px_#eab308]" />
                  <circle cx="8" cy="50" r="2" fill="#a855f7" className="drop-shadow-[0_0_6px_#a855f7]" />
                </svg>
              </div>

              {/* Starlight Explosion on Click */}
              {isExploding && (
                <div className="brand-burst-container" aria-hidden="true">
                  <div className="brand-burst-flash" />
                  {BURST_PARTICLES.map((p, idx) => (
                    <span
                      key={idx}
                      className="brand-burst-particle"
                      style={
                        {
                          "--burst-x": p.x,
                          "--burst-y": p.y,
                          animationDelay: p.delay,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              )}

              {/* Main Celestial Astrolabe Glass Emblem Logo */}
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 48 48" className="h-7 w-7 text-violet-200 transition-transform duration-500 group-hover:scale-110" fill="none">
                  {/* Outer Astrolabe Ring & Cardinal Star Ticks */}
                  <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.2" opacity="0.35" strokeDasharray="1 3" />
                  <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                  
                  {/* Inclined Planetary Orbital Ring */}
                  <ellipse cx="24" cy="24" rx="20" ry="8" stroke="url(#logo-grad-1)" strokeWidth="1.5" opacity="0.85" transform="rotate(-30 24 24)" />
                  <circle cx="39" cy="16" r="2" fill="#38bdf8" className="drop-shadow-[0_0_8px_#38bdf8]" />
                  
                  {/* 8-Pointed Celestial Star Core */}
                  <g opacity="0.9" className="transition-transform duration-700 group-hover:rotate-45" style={{ transformOrigin: "24px 24px" }}>
                    <path d="M24 6 L26.5 19.5 L40 22 L26.5 24.5 L24 38 L21.5 24.5 L8 22 L21.5 19.5 Z" fill="url(#logo-grad-2)" opacity="0.95" />
                  </g>
                  
                  {/* Center Radiant Core */}
                  <circle cx="24" cy="24" r="4" fill="#ffffff" className="drop-shadow-[0_0_10px_#a855f7]" />
                  
                  <defs>
                    <linearGradient id="logo-grad-1" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c4b5fd" />
                      <stop offset="0.5" stopColor="#38bdf8" />
                      <stop offset="1" stopColor="#f43f5e" />
                    </linearGradient>
                    <linearGradient id="logo-grad-2" x1="8" y1="6" x2="40" y2="38" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff" />
                      <stop offset="0.6" stopColor="#c4b5fd" />
                      <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </div>

            {/* Brand title with the Georgia silhouette anchored to AstroNum's lower-right edge */}
            <span className="brand-title-wrap min-w-0 flex flex-col justify-center">
              <span className="brand-title-row">
                <span className="block truncate font-display text-lg font-bold tracking-tight text-slate-100 sm:text-xl drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]">
                  Astro<span className="text-violet-300">Num</span><sup className="ml-0.5 text-[0.55em] font-extrabold text-violet-300">°</sup>
                </span>
                <svg
                  viewBox="0 0 120 60"
                  className="brand-georgia-map"
                  role="img"
                  aria-label="საქართველოს რუკა"
                >
                  <title>საქართველოს რუკა</title>
                  <path d="M9 29c4-6 9-8 16-8 5-4 10-7 16-4 5-4 11-5 17-1 6-2 12 0 16 3 7-2 12 0 17 4l11 1-4 6-9 2-4 7-9-1-8 5-9-2-7 5-8-4-8 3-8-5-8 2-7-5-8 1-4-5-7-2z" />
                  <path className="brand-georgia-map-cross" d="M58 18v16M50 26h16" />
                </svg>
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <Link href="/#calculator" className="nav-quiet-action"><Compass className="h-3.5 w-3.5" />რუკის შექმნა</Link>
            {me === null && <Link href="/cabinet" className="nav-action"><User className="h-3.5 w-3.5" />კაბინეტი</Link>}
            {me && <Link href="/cabinet/dashboard" className="nav-action"><LayoutDashboard className="h-3.5 w-3.5" />კაბინეტი</Link>}
            {me?.role === "ADMIN" && <Link href="/admin" className="nav-quiet-action"><Shield className="h-3.5 w-3.5 text-violet-300" />ადმინი</Link>}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {me === null && <Link href="/cabinet" className="nav-action"><User className="h-3.5 w-3.5" /><span className="hidden sm:inline">კაბინეტი</span></Link>}
            {me && <Link href="/cabinet/dashboard" className="nav-action"><LayoutDashboard className="h-3.5 w-3.5" /></Link>}
            <button type="button" onClick={() => setMobileMenuOpen((value) => !value)} className="nav-quiet-action px-2.5" aria-label="მენიუს გახსნა">
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-3 grid gap-2 border-t border-slate-700/30 pt-3 md:hidden">
            <Link href="/#calculator" onClick={() => setMobileMenuOpen(false)} className="nav-quiet-action justify-start"><Compass className="h-4 w-4" />რუკის შექმნა</Link>
            {me?.role === "ADMIN" && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="nav-quiet-action justify-start"><Shield className="h-4 w-4 text-violet-300" />ადმინ პანელი</Link>}
            {me && <p className="truncate px-2 text-xs text-slate-500">{me.email}</p>}
          </div>
        )}
      </div>
    </header>
  );
}
