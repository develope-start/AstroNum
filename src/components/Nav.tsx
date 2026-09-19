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
                  viewBox="0 0 1000 510"
                  className="brand-georgia-map"
                  role="img"
                  aria-label="საქართველოს სახელმწიფოებრივი რუკა"
                >
                  <title>საქართველოს რუკა</title>
                  {/* Simplified public-domain Georgia silhouette, fitted to the compact brand mark. */}
                  <path d="M45.5 58.1l0.7-3.2 9.2-24.1 1.8-3 3.3-2.1 9.1-2.5 9.3 0 33.5 12.5 5.4 0.7 4.2-1.1 8.8-4.6 4.9-0.6 3.9 2 1.2 1 6.9 5.2 13.8 4.8 4.4 2.6 18.6 14.9 4.1 1.1 14.1-1.9 4.7 1 4.3 2.2 4.2 3.4 4.7 2.1 9.7-1.9 4.1 1.6 1.3 1.8 1.9 4.4 1.2 1.9 2 1.5 7.1 2.2 3.5 2.2 6.1 6.2 3.6 2 5 0.5 9.9-1.4 4.9 0.6 8.9 2.5 4.2 0.5 9.5-1.1 3.9 0.2 4 1.1 4.2 2.1 4.3 1.3 4.3 0.2 4.4-0.9 10.7-6 0.7-0.4 3.5-1.1 22.9-1.9 1.1 0.1 8.2 1.2 7.7 5.2 3.5 3.6 4 3.1 8.2 4.6 2.6 0.6 2-0.8 3.6-3.4 2.3-1.2 4.3-0.1 6.3-1.9 5.4 0.1 5.2 1.4 3.8 2.5 3.8 3.6 3.9 2.6 11.6 4.3 0 2.5-1 3-0.4 3 1.2 2 6.7 4.7 14.6 13.8 2.6 1.4 2.6 1.5 26 7.3 12.7 3.6 5.1 1.3 9.3 4.6 2.3 2 5.6 6.7 2.5 1.6 12.6 3.1 3.6 1.8 2.5 1.3 1.5 5.4-3.1 4.4-4.8 3.4-3.8 3.8-0.4 5.4 3.9 4.8 6.1 1.6 6.6 0.6 5.4 1.4 3.1 2.4 1.8 1.3 2.5 1.3 2.5-0.4 2.1-1.8 3.3-4.7 1.8-2 5.9-2.7 13-0.7 4.8-1.4 1.5-0.5 1.9-1.9 2.6-2.6 2.5-5.2 3.1-3.8 12.1-0.2 5.5-1.8 10.5-5.7 3.9-1.1 6.8-0.5 5.8 0.7 5.1 1.6 0.5 0.2 5 2.9 2.2 1.7 4 4.3 1.6 2.5 3.3 10.7 1.7 1.8 1.2-1.3 2.2-10.1 3.9-8.6 0.9-2.9 3.4-4.7 5.9 1.2 14.8 10.6 2.4 1.2 2.5 0.5 2.6-0.4 1.2-0.6 3.8-1.7 2.6-0.3 4.3 1.7 3.9 3.4 13.4 16.3 1.5 2.5 1.1 2.4 1.4 3.3 1.4 2.1 4.5 1.9 5.8-0.8 10.9-3.3 7.8 0.2 11.4 2 10.6 4.2 5.5 6.6 0 0.2-0.4 4.2-15.6 40.9 1.3 4.3 4.1 2.6 5.5 2.6 14.9 10.4 9.4 2.5 1.9 1.8 3.8 9.6 1.5 2 1.8 1 2.5 0.2 1-0.4 1.8-1.4 1.1-0.3 0.9 0.4 2.3 2 1.1 0.6 2.5-0.1 1.8-0.5 1.3 0.9 1 4 3.2 1.5 4.2 0.1 7.9-1.6 0.1 0 0-0.1 1.2-0.3 1.1-0.1 1.2 0.1 1.3 0.4 3.5 2.9 6 7.1 3.8 1.7 8.1 0.7 3.3 1.9 3.3 4.5-5.2 10.6-2.9 4.8-5.8 7.1-2 1.8-2.2 1-2.8 0.3-6.3-1.4-3 0.3-2.6 2.8-1.3 6.2 0.1 9.2 1.7 8.2 3.7 3 1.2-1 0.6-1.6 0.9-1.4 1.9-0.1 0.3 1 3 5.8 0.2 1.3 1.1 7.1 1.2 3.9 2.3 3 7.1 5 1.6 0.7 2.8 0.7 6.3 5.9 13.2 5.6 6.7 4 2.1 5 2.1-0.8 0.9 0.6 0.2 0.1 0.9 1.6 2.6 2.9 4.3 6.6 0.8 2.6-0.4 0.2-1.1-0.2-1.2 1.5-0.3 1.3-0.1 3.2-0.3 1.2-0.8 1.1-1.8 1.7-0.8 1.1-1.3 4.9-0.7 6.2-1.1 5.7-0.8 1.1-1.9 2.6-2.6 0.5-2.6-0.7-2.7-0.3-2.8 1.8-1.5 2.9-0.8 2.8-1.2 1.9-3 0.1-2.4-1.5-3.8-5.1-2.2-2-8.1-2.6-2.8-1.7-8-7.3-3.9-4.9-2.1-2.1-2.5-0.9-10.2 0.1-3 0.7-3.4 2.2-3.6 2.3-2.7 1-3.2 0.3-6.6-0.8-20.1-7.3-6.8-4.2-2.6-1.6-5.6-4.8-3.3-5.2 3-3.7 3.1-1.2 2-1-0.2-1.1-3.2-1.3-8.8-1.8-19.5-7.6-4.4-4.2-1.9-2.3-2-0.3-4.5 1.3-2.7 0.3-2.2-0.4-6.5-3.4-2.5-1.3-4.4-0.3-4.4 1.6-20.6 17-12.9 10.8-1.7 1-3 2.8-1.7 1.2-5.1 0.1-13.1-2-2.6 2.6 1.1 2.6 5.1 2.4 0.9 1.3 0.5 0.8-1.3 1.9-3.6 0.4-19.9-0.4-5.6-2.2-2.8-0.4-2.9 1.3-1.7 2.4-1.7 2.8-2 1.8-2.8-0.8-0.7-1.4-0.5-1.8-0.7-1.4-1.5 0.1-0.8 0.7-2.8 3-3.3 1-3-0.2-3-1.1-7.2-4.4-1.7-0.2-1.6 0.5-1.1 1-1 1.1-1.2 0.9-3.2 0.5-2.5-0.9-6.6-4.6-3.6-1.5-1.5 0-1.6 1.1-0.3 1.4-0.1 1.5-0.7 1.7-2.2 2.2-2.6 1.4-2.9 0.5-5.7-1.6-2.7 0.3-5.5 2.5-3.1 0.7 0 0.1-3 0.7-12.5 0.3-5.9 2.4-6.3 5.6-2.6 1.1-3.3 0.3-22.1-3.2-5.8 0.3-7.3 3-1.3 0.3-1.4-0.1-1.3-0.3 1.5-4.7-1.9-4.2-3.7-3.5-3.7-2.1-4.3-1.2-3.9 0.3-12.5 3.5-1.9-1.4-3.3-8-2.7-3.2-2.7-0.3-3 0.3-3.6-1.1 7.3-3.8 2-1.7 1.8-2.6-0.2-1-4-0.5-4.1-2-6.6-5.8-9.9-6.8-2-2.1-4.1-7.7-1-1.2-1.2-0.5-0.7-0.7-0.5-0.8-0.8-0.8-4-1.3-1.1-0.7-1.1-2-0.7-2.2-1-1.2-1.8 1.1-3.4 3.9-2.5-0.9-2.6-2.8-3.5-2.1 1.2-1.8 2.6-2.2 1.1-1.4 0.6-1.6 0.3-1.8 0.4-1.8 1.1-1.7-2.6-1.2-19-1.7-6.8 0.6-2.7 0.9-0.5 0.2-0.2 0.1-2.7 2.1-1.4 3-1.3 7.4-1.4 2.9-2.9 3.1-4.1 6.2-2.8 1.8-1.6 0.1-1.8 0.1-23.8-9.3-6.6 0.4-3.3-0.3-2.2-2.1-2-1.2-2 0-4.3 1.2-1.9-0.9-1.9-0.3-1.9 0.3-2 0.9-4.8 1.5-9.7-3.7-5.4 2.2-1.9 1.4-4.2 6.1-5.5 4.7-1.3 0.8-1.6-0.7-5.4-5.1-1.8-0.6-4-0.5-1.6-0.6-0.5-1.2 0-1.4 0.2-1.4-0.2-0.7-1.1 0-3.4 1.5-4 0.4-1.7-0.4-14.5-6.1 8.9-16 4-5.4 8.2-5.4 2.3-5.4 6.3-10.5 0.4-2.1 0-1.7 0.2-1.4 0.8-1.6 2.2-3.1 0.7-1.5 0.3-1.6 0-14.8 0-0.7-1.6-11.5-0.2-4.1-0.6-2.6-5.5-9.6-4.1-7.3-1.5-1.2-1.4-1.5-0.6-3.5-0.3-6.2-1.1-8.3-7.1-25.1-0.6-1.1-0.9-1.4-3.7-3.6-0.5-1.3-0.4-3.1-7-43-2.3-7.3-3.5-6.2-4.4-4.8-5.6-3.2-10.3-1.9-2.2-1.3-2.2-2-3.3-1.8-3.4-1.3-2.7-0.4-1.6 0.4-2.7 1.7-1.7 0.4-1.5-0.9-6.1-9.4-3.2-11.4-5.6-9.8-2.3-5.3-3.4 0.1-5.3 2.4-3.4-1.2-4-6.2-2.4-1.5-0.1-0.9-3.1-5.5-1-0.8-9.8-3.9-13.6-1.9-6.3 0.4-4.4 1.1-1.7 0.1-1.6-0.6-2.6-2.6-1.3-0.6-0.6-0.5-2.4-2.5-1.2-0.9-1.3-0.5-4.3-0.8-10.9-5.2-5-0.6-3.5 4.6-1.4-1.5-2-5-1.3-2.4-3-3.1-1.4-2.1 0.6-5.8-2.1-5.5-3-5-2.2-2.8-4.1-1.9-7.5-2.3-4.3-4.4-2-0.9-6.2-1-4.2-1.8-3.2-0.7z" />
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
