"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, User, LayoutDashboard, Settings, Shield, Menu, X } from "lucide-react";

interface Me {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function Nav() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
  }, []);

  return (
    <header className="w-full px-2 py-2 sm:px-6 sm:py-3.5">
      <div className="mx-auto max-w-6xl xl:max-w-7xl rounded-2xl sm:rounded-full border border-amber-400/40 bg-[#08041a]/95 p-2.5 sm:px-6 sm:py-2.5 backdrop-blur-3xl shadow-[0_16px_50px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20">
        
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

          {/* 2. Center Focus: Prominent Central Calculator Button (Desktop & Tablet) */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-xs px-2">
            <Link
              href="/#calculator"
              className="group flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-400/70 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.55)] transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(245,158,11,0.85)] active:scale-95"
            >
              <Compass className="h-4 w-4 text-slate-950 shrink-0 group-hover:rotate-180 transition-transform duration-700" />
              <span className="tracking-wide whitespace-nowrap">✦ ასტროლოგიური გამოთვლელი</span>
            </Link>
          </div>

          {/* 3. Right: Cabinet Button with VIBRANT STRIKING COLOR (მკვეთრი ფერი!) */}
          <nav className="flex items-center gap-2 sm:gap-3 text-xs font-bold shrink-0">
            {me === null && (
              <Link
                href="/cabinet"
                className="flex items-center gap-2 rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.75)] transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(245,158,11,0.95)] hover:border-white active:scale-95 animate-pulse"
              >
                <User className="h-4 w-4 text-slate-950 shrink-0 stroke-[2.5]" />
                <span className="tracking-wide">კაბინეტი</span>
              </Link>
            )}

            {me && (
              <>
                <Link
                  href="/cabinet/dashboard"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full border-2 border-amber-300 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 px-3.5 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.65)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(245,158,11,0.85)]"
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-950 shrink-0 stroke-[2.5]" />
                  <span>ჩემი რუკები</span>
                </Link>

                <Link
                  href="/cabinet/settings"
                  className="hidden sm:flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-950/70 px-3 py-1.5 text-xs font-bold text-purple-200 transition-all hover:bg-purple-900/80 hover:text-white"
                >
                  <Settings className="h-3.5 w-3.5 text-purple-300 shrink-0" />
                  <span>მართვა</span>
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
                  className="flex sm:hidden items-center justify-center p-2 rounded-xl border border-amber-500/30 bg-purple-950/70 text-amber-300"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Central Calculator CTA Bar (Visible on mobile screens) */}
        <div className="mt-2.5 pt-2 border-t border-amber-500/20 md:hidden flex items-center justify-center w-full">
          <Link
            href="/#calculator"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-amber-400/70 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.55)] transition-all hover:scale-[1.02] active:scale-98"
          >
            <Compass className="h-4 w-4 text-slate-950 shrink-0" />
            <span className="tracking-wide">✦ ასტროლოგიური გამოთვლელი</span>
          </Link>
        </div>

        {/* Mobile Dropdown Menu for Logged In User Options */}
        {mobileMenuOpen && me && (
          <div className="mt-2 sm:hidden flex flex-col gap-2 pt-2 border-t border-amber-500/20 text-xs font-bold">
            <Link
              href="/cabinet/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl bg-purple-950/80 p-2.5 text-purple-200 hover:bg-purple-900"
            >
              <Settings className="h-4 w-4 text-purple-300" />
              <span>პარამეტრები & მართვა</span>
            </Link>
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
