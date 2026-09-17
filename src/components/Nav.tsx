"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, User, LayoutDashboard, Shield, Menu, X, Sparkles, Layers } from "lucide-react";

interface Me {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function Nav() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLegacyUi, setIsLegacyUi] = useState(false);
  const [toggleAllowed, setToggleAllowed] = useState(true);

  useEffect(() => {
    // 1. Fetch user auth status
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));

    // 2. Fetch admin permission setting for design toggle
    fetch("/api/settings/design-toggle", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setToggleAllowed(Boolean(d?.allowed)))
      .catch(() => setToggleAllowed(true));

    // 3. Initialize theme from localStorage (default to premium-ui)
    const savedTheme = localStorage.getItem("ui_theme");
    if (savedTheme === "legacy") {
      setIsLegacyUi(true);
      document.documentElement.classList.add("legacy-ui");
      document.documentElement.classList.remove("premium-ui");
      document.body.classList.add("legacy-ui");
      document.body.classList.remove("premium-ui");
    } else {
      setIsLegacyUi(false);
      document.documentElement.classList.add("premium-ui");
      document.documentElement.classList.remove("legacy-ui");
      document.body.classList.add("premium-ui");
      document.body.classList.remove("legacy-ui");
    }
  }, []);

  function toggleDesignTheme() {
    const nextLegacy = !isLegacyUi;
    setIsLegacyUi(nextLegacy);
    localStorage.setItem("ui_theme", nextLegacy ? "legacy" : "premium");
    if (nextLegacy) {
      document.documentElement.classList.add("legacy-ui");
      document.documentElement.classList.remove("premium-ui");
      document.body.classList.add("legacy-ui");
      document.body.classList.remove("premium-ui");
    } else {
      document.documentElement.classList.add("premium-ui");
      document.documentElement.classList.remove("legacy-ui");
      document.body.classList.add("premium-ui");
      document.body.classList.remove("legacy-ui");
    }
  }

  return (
    <header className="w-full px-2 py-2 sm:px-6 lg:px-12 xl:px-16 sm:py-3.5 relative z-50">
      <div className="mx-auto w-full max-w-full rounded-2xl sm:rounded-full border border-amber-400/40 bg-[#070418]/90 p-2.5 sm:px-8 sm:py-2.5 backdrop-blur-3xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20">
        
        {/* Main Header Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          {/* 1. Left: Brand Logo & Title */}
          <Link href="/" className="group flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-500/30 via-purple-900/70 to-indigo-950/90 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.7)]">
              {/* Custom AstroNum SVG Emblem */}
              <svg viewBox="0 0 36 36" className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300 transition-transform group-hover:rotate-45 duration-700">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="opacity-60" />
                <circle cx="18" cy="18" r="10" fill="none" stroke="#A855F7" strokeWidth="1.2" />
                <path d="M18 4 V32 M4 18 H32" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <polygon points="18,7 21,18 18,29 15,18" fill="currentColor" opacity="0.9" />
                <circle cx="18" cy="18" r="3" fill="#F59E0B" />
              </svg>
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[0.55rem] font-black text-slate-950 shadow-md">
                °
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(245,158,11,0.4)] leading-tight">
                Astro<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-purple-400 bg-clip-text text-transparent">Num</span>
                <sup className="text-amber-400 font-extrabold text-xs ml-0.5">°</sup>
              </span>
              <span className="hidden xl:inline-block text-[0.6rem] font-bold text-amber-300/80 tracking-widest uppercase -mt-0.5">
                ეფემერიდული გამოთვლები
              </span>
            </div>
          </Link>

          {/* 2. Center Focus: Astrological Chart Creation CTA */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md px-2">
            <Link
              href="/#calculator"
              className="group flex w-full items-center justify-center gap-2.5 rounded-2xl sm:rounded-3xl border-2 border-cyan-300 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-5 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.7)] ring-2 ring-cyan-400/50 transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(245,158,11,0.9)] hover:border-white active:scale-95"
            >
              <Compass className="h-4.5 w-4.5 text-slate-950 shrink-0 stroke-[2.5] group-hover:rotate-180 transition-transform duration-700" />
              <span className="tracking-wide whitespace-nowrap text-slate-950 font-black text-xs sm:text-sm">
                ✦ ასტროლოგიური რუკის შექმნა
              </span>
            </Link>
          </div>

          {/* 3. Right: Design Toggle & Cabinet Controls */}
          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-bold shrink-0">
            
            {/* DESIGN TOGGLE BUTTON (Controlled by Admin Checkbox via toggleAllowed) */}
            {toggleAllowed && (
              <button
                type="button"
                onClick={toggleDesignTheme}
                title={isLegacyUi ? "პრემიუმ ახალ დიზაინზე გადართვა" : "ძველ დიზაინზე გადართვა"}
                className={`relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-black transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isLegacyUi
                    ? "border-purple-400/60 bg-purple-950/80 text-purple-200 shadow-[0_0_18px_rgba(168,85,247,0.4)] hover:bg-purple-900"
                    : "border-cyan-400/60 bg-cyan-950/70 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.4)] hover:bg-cyan-900/90"
                }`}
              >
                {isLegacyUi ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                    <span>ახალი დიზაინი</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-3.5 w-3.5 text-cyan-300" />
                    <span>ძველი დიზაინი</span>
                  </>
                )}
              </button>
            )}

            {/* Guest / Not Logged In State -> Yellow/Amber Pulsing Cabinet Button */}
            {me === null && (
              <Link
                href="/cabinet"
                className="flex items-center gap-2 rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.75)] transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(245,158,11,0.95)] hover:border-white active:scale-95 animate-pulse"
              >
                <User className="h-4 w-4 text-slate-950 shrink-0 stroke-[2.5]" />
                <span className="tracking-wide">კაბინეტი</span>
              </Link>
            )}

            {/* Registered & Logged In User State -> Emerald Green Gradient Glow Cabinet Button */}
            {me && (
              <>
                <Link
                  href="/cabinet/dashboard"
                  className="flex items-center gap-2 rounded-full border-2 border-emerald-300 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.85)] ring-2 ring-emerald-400/40 transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(16,185,129,0.95)] hover:border-white active:scale-95"
                >
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-900 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
                  </span>
                  <LayoutDashboard className="h-4 w-4 text-slate-950 shrink-0 stroke-[2.5]" />
                  <span className="tracking-wide">კაბინეტი</span>
                </Link>

                {me.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-950/70 px-3 py-1.5 text-xs font-bold text-rose-200 transition-all hover:bg-rose-900/80"
                  >
                    <Shield className="h-3.5 w-3.5 text-rose-300 shrink-0" />
                    <span>ადმინი</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex sm:hidden items-center justify-center p-2 rounded-xl border border-emerald-500/40 bg-emerald-950/70 text-emerald-300"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Central Calculator CTA Bar (Visible on mobile screens) */}
        <div className="mt-2.5 pt-2 border-t border-cyan-500/20 md:hidden flex items-center justify-center w-full">
          <Link
            href="/#calculator"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-cyan-300 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.7)] ring-2 ring-cyan-400/50 transition-all hover:scale-[1.02] active:scale-98"
          >
            <Compass className="h-4 w-4 text-slate-950 shrink-0 stroke-[2.5]" />
            <span className="tracking-wide text-slate-950 font-black">✦ ასტროლოგიური რუკის შექმნა</span>
          </Link>
        </div>

        {/* Mobile Dropdown Menu for Logged In User Options */}
        {mobileMenuOpen && me && (
          <div className="mt-2 sm:hidden flex flex-col gap-2 pt-2 border-t border-amber-500/20 text-xs font-bold">
            {me.role === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl bg-rose-950/80 p-2.5 text-rose-200 hover:bg-rose-900"
              >
                <Shield className="h-4 w-4 text-rose-300" />
                <span>ადმინ პანელი</span>
              </Link>
            )}
            <div className="px-2.5 py-1 text-[0.7rem] font-medium text-slate-400 truncate">
              ავტორიზებულია: {me.email}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
