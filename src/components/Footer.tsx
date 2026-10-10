"use client";

import Link from "next/link";
import { Compass, Github, Heart, Orbit, ShieldCheck, Sparkles } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-white/[0.08] bg-[#070a12]/80 pt-16 pb-12 backdrop-blur-xl">
      {/* Aurora edge highlight */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-950/40 text-violet-200">
                <Orbit className="h-4 w-4 transition-transform group-hover:rotate-45" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Astro<span className="text-violet-300">Num</span><sup className="text-xs text-violet-300">°</sup>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              შვეიცარული ეფემერიდის სიზუსტით შექმნილი ასტროლოგიური სამუშაო სივრცე. ნატალური, სინასტრიული და ტრანზიტული კვლევა.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="#calculator"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:text-cyan-300"
                aria-label="Astro Calculator"
              >
                <Compass className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: გამოთვლები */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              გამოთვლები
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#calculator" className="transition-colors hover:text-cyan-300">
                  ნატალური რუკა (Natal)
                </a>
              </li>
              <li>
                <a href="#calculator" className="transition-colors hover:text-cyan-300">
                  სინასტრია & თავსებადობა
                </a>
              </li>
              <li>
                <a href="#calculator" className="transition-colors hover:text-cyan-300">
                  დროის ტრანზიტები
                </a>
              </li>
              <li>
                <a href="#calculator" className="transition-colors hover:text-cyan-300">
                  Secondary Progressions
                </a>
              </li>
              <li>
                <a href="#calculator" className="transition-colors hover:text-cyan-300">
                  Solar Arc & ჰარმონიკები
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: მეთოდოლოგია */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              მეთოდოლოგია
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#features" className="transition-colors hover:text-indigo-300">
                  Swiss Ephemeris v2.1
                </a>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-indigo-300">
                  სახლების 12 სისტემა
                </a>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-indigo-300">
                  4 სტიქია & ტემპერამენტი
                </a>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-indigo-300">
                  ასპექტების ორბების ალგორითმი
                </a>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-indigo-300">
                  ასტრონომიული ფიზიკა
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: კაბინეტი & ანგარიში */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              კაბინეტი
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/cabinet" className="transition-colors hover:text-violet-300">
                  ავტორიზაცია
                </Link>
              </li>
              <li>
                <Link href="/cabinet" className="transition-colors hover:text-violet-300">
                  რეგისტრაცია
                </Link>
              </li>
              <li>
                <Link href="/cabinet" className="transition-colors hover:text-violet-300">
                  შენახული რუკების არქივი
                </Link>
              </li>
              <li>
                <a href="#pricing" className="transition-colors hover:text-violet-300">
                  ტარიფები & Pro რეჟიმი
                </a>
              </li>
              <li>
                <Link href="/cabinet" className="transition-colors hover:text-violet-300">
                  პარამეტრების მართვა
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: იურიდიული & კონფიდენციალურობა */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-300">
              უსაფრთხოება & წესები
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <span className="cursor-pointer transition-colors hover:text-rose-300">
                  კონფიდენციალურობის პოლიტიკა
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition-colors hover:text-rose-300">
                  მომსახურების პირობები
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition-colors hover:text-rose-300">
                  მონაცემთა დაცვა (GDPR)
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition-colors hover:text-rose-300">
                  API დოკუმენტაცია
                </span>
              </li>
              <li>
                <span className="cursor-pointer transition-colors hover:text-rose-300">
                  მხარდაჭერა & Feedback
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row text-xs text-slate-500">
          <p>© {currentYear} AstroNum°. ყველა უფლება დაცულია. დამზადებულია საქართველოში.</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-400">
              Systems Operational · Ephemeris Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
