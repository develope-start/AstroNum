import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="cr-glass max-w-md p-8 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">404 — გვერდი ვერ მოიძებნა</h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          სამწუხაროდ, მოთხოვნილი გვერდი არ არსებობს ან გადაადგილებულია.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>მთავარ გვერდზე დაბრუნება</span>
        </Link>
      </div>
    </div>
  );
}

