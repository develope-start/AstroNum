"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, User, LayoutDashboard, Settings, Shield } from "lucide-react";

interface Me {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function Nav() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.user))
      .catch(() => setMe(null));
  }, []);

  return (
    <header className="sticky top-0 z-50 px-1.5 py-1.5 sm:px-6 sm:py-3 w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-amber-400/30 bg-[#070414]/90 px-2.5 py-1.5 sm:px-4 sm:py-2.5 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] w-full">
        {/* Original AstroNum Logo */}
        <Link href="/" className="group flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="relative flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-xl sm:rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-purple-900/60 to-indigo-950/80 shadow-[0_0_24px_rgba(245,158,11,0.35)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_35px_rgba(245,158,11,0.55)]">
            {/* Custom AstroNum SVG Emblem */}
            <svg viewBox="0 0 36 36" className="h-4 w-4 sm:h-6 sm:w-6 text-amber-300 transition-transform group-hover:rotate-45 duration-700">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="opacity-60" />
              <circle cx="18" cy="18" r="10" fill="none" stroke="#A855F7" strokeWidth="1.2" />
              <path d="M18 4 V32 M4 18 H32" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <polygon points="18,7 21,18 18,29 15,18" fill="currentColor" opacity="0.9" />
              <circle cx="18" cy="18" r="3" fill="#F59E0B" />
            </svg>
            <div className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-amber-400 text-[0.45rem] sm:text-[0.55rem] font-black text-slate-950 shadow-md">
              °
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-display text-base sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              Astro<span className="bg-gradient-to-r from-amber-300 via-amber-400 to-purple-400 bg-clip-text text-transparent">Num</span>
              <sup className="text-amber-400 font-extrabold text-[0.65rem] sm:text-sm ml-0.5">°</sup>
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-1 sm:gap-3 text-xs font-bold text-slate-200 shrink-0">
          <Link
            href="/#calculator"
            className="flex items-center gap-1 rounded-full px-2 py-1.5 sm:px-4 sm:py-2 transition-all hover:bg-amber-400/15 hover:text-amber-300 shrink-0"
          >
            <Compass className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
            <span className="text-[0.68rem] sm:text-xs">გამომთვლელი</span>
          </Link>

          {me === null && (
            <Link
              href="/cabinet"
              className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-purple-600/25 to-amber-500/20 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[0.68rem] sm:text-xs font-bold text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all hover:scale-105 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] shrink-0"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
              <span>კაბინეტი</span>
            </Link>
          )}

          {me && (
            <>
              <Link
                href="/cabinet/dashboard"
                className="flex items-center gap-1 rounded-full px-2 py-1.5 sm:px-3.5 sm:py-2 transition-all hover:bg-amber-400/10 hover:text-amber-300 shrink-0"
              >
                <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
                <span className="text-[0.68rem] sm:text-xs">ჩემი რუკები</span>
              </Link>
              <Link
                href="/cabinet/settings"
                className="flex items-center gap-1 rounded-full px-2 py-1.5 sm:px-3.5 sm:py-2 transition-all hover:bg-amber-400/10 hover:text-amber-300 shrink-0"
              >
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">მართვა</span>
              </Link>
              {me.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 rounded-full px-2 py-1.5 sm:px-3.5 sm:py-2 text-amber-400 hover:bg-amber-400/10 hover:text-amber-300 shrink-0"
                >
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="text-[0.68rem] sm:text-xs">ადმინი</span>
                </Link>
              )}
              <span className="hidden lg:inline-block max-w-[120px] truncate rounded-full border border-violet-400/30 bg-violet-950/70 px-3 py-1 text-xs font-medium text-violet-200 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                {me.email}
              </span>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}




