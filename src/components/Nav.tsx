"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass, LayoutDashboard, Menu, Shield, User, X } from "lucide-react";

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
      .then((response) => response.json())
      .then((data) => setMe(data.user))
      .catch(() => setMe(null));
  }, []);

  return (
    <header className="site-header">
      <div className="nav-shell px-3 py-2.5 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="brand-link group flex min-w-0 items-center gap-2.5">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 36 36" className="h-5 w-5" fill="none">
                <circle cx="18" cy="18" r="13" stroke="currentColor" strokeWidth="1" opacity=".65" />
                <ellipse cx="18" cy="18" rx="15" ry="6" stroke="currentColor" strokeWidth="1" opacity=".45" transform="rotate(-24 18 18)" />
                <circle cx="18" cy="18" r="3" fill="currentColor" />
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-semibold tracking-tight text-slate-100 sm:text-lg">
                Astro<span className="text-violet-300">Num</span><sup className="ml-0.5 text-[0.55em] text-violet-300">°</sup>
              </span>
              <span className="hidden text-[0.58rem] font-bold uppercase tracking-[0.2em] text-slate-500 sm:block">precision astrology</span>
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
