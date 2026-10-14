"use client";

import { useCallback, useEffect, useState } from "react";
import type { CurrentTransitElementSnapshot } from "@/lib/astro/currentTransitElements";

type Snapshot = CurrentTransitElementSnapshot & {
  ephemeris: { precision: "swiss" | "astronomy-engine"; source: string };
};

const ELEMENT_STYLE = {
  fire: { icon: "🔥", bar: "bg-orange-400", text: "text-orange-200" },
  earth: { icon: "🌍", bar: "bg-emerald-400", text: "text-emerald-200" },
  air: { icon: "🌬️", bar: "bg-sky-400", text: "text-sky-200" },
  water: { icon: "💧", bar: "bg-blue-400", text: "text-blue-200" },
} as const;

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
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("ka-GE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tbilisi",
  });
}

export default function CurrentTransitElementBalance() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/transits/current-elements", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `გამოთვლა ვერ შესრულდა (${response.status})`);
      setSnapshot(data as Snapshot);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "მიმდინარე ცის მონაცემები ვერ ჩაიტვირთა.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5 * 60 * 1000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return (
    <details className="mb-5 rounded-2xl border border-cyan-400/25 bg-slate-950/55 p-4 shadow-[0_0_30px_rgba(34,211,238,0.07)] sm:p-5" aria-label="მიმდინარე ტრანზიტული სტიქიების ბალანსი">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base sm:text-lg font-bold text-white transition hover:text-cyan-200 marker:hidden">
        <span>დღევანდელი ცის სტიქიური ბალანსი</span>
        <span aria-hidden="true" className="text-cyan-300 font-mono text-sm">⌄</span>
      </summary>
      <div className="mt-4 pt-3 border-t border-cyan-400/15 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
            <span className="live-beacon shrink-0" />
            <span>მიმდინარე ტრანზიტი · ცოცხალი გამოთვლა</span>
          </div>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300">
            პროცენტი ითვლება 10 ძირითადი პლანეტის ზოდიაქოს სტიქიაში მდებარეობით — თითო პლანეტა თანაბრად, ჯამში 100%. ასპექტები ნაჩვენებია ცალკე და პროცენტს არ ცვლის, რადგან მათთვის განსხვავებული წონა ამ მაჩვენებელში განსაზღვრული არ არის.
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="rounded-full border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200 disabled:opacity-50">
          {refreshing ? "ახლდება…" : "განახლება"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200" role="alert">
          {error}
          {!snapshot && <button type="button" onClick={() => void refresh()} className="ml-2 underline">ხელახლა ცდა</button>}
        </div>
      )}

      {!snapshot && !error && <p className="mt-4 text-sm text-slate-400" role="status">მიმდინარე პლანეტარული პოზიციები ითვლება…</p>}

      {snapshot && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshot.elements.map((element) => {
              const style = ELEMENT_STYLE[element.id];
              return (
                <div key={element.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold ${style.text}`}>{style.icon} {element.name}</span>
                    <span className="font-mono text-lg font-black text-white">{element.percentage}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${element.name} სტიქიის წილი`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={element.percentage}>
                    <div className={`h-full rounded-full ${style.bar} transition-[width] duration-500`} style={{ width: `${element.percentage}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">{element.count} / {snapshot.balance.total} პლანეტა</p>
                </div>
              );
            })}
          </div>

          <details className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-200">პლანეტების მდებარეობები და მიმდინარე ძირითადი ასპექტები</summary>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div>
                <h5 className="mb-2 text-xs font-bold text-cyan-200">პლანეტები ზოდიაქოში</h5>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {snapshot.planets.map((planet) => (
                    <span key={planet.name} className="rounded-lg bg-slate-900/80 px-2 py-1.5 text-[11px] text-slate-200">
                      <span className="mr-1 text-cyan-200">{PLANET_GLYPHS[planet.name]}</span>{planet.nameKa}: {planet.sign} {planet.degree}{planet.retrograde ? " ℞" : ""}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="mb-2 text-xs font-bold text-violet-200">მჭიდრო ძირითადი ასპექტები</h5>
                {snapshot.aspects.length
                  ? <ul className="space-y-1.5">{snapshot.aspects.map((aspect, index) => (
                    <li key={`${aspect.a}-${aspect.b}-${aspect.aspect}-${index}`} className="text-[11px] text-slate-300">
                      {PLANET_GLYPHS[aspect.a]} {aspect.a} · {aspect.aspectKa} · {PLANET_GLYPHS[aspect.b]} {aspect.b}
                      <span className="ml-1 text-slate-500">ორბი {aspect.orb.toFixed(2)}° · {aspect.applying ? "ზუსტი ხდება" : "იშლება"}</span>
                    </li>
                  ))}</ul>
                  : <p className="text-[11px] text-slate-400">ამ მომენტში ძირითადი ასპექტი მითითებულ ორბში არ ფიქსირდება.</p>}
              </div>
            </div>
          </details>

          <p className="mt-3 text-[10px] text-slate-500">
            გამოთვლილია: {formatTimestamp(snapshot.computedAt)} (თბილისის დრო) ·
            {" "}{snapshot.ephemeris.precision === "swiss" ? "Swiss Ephemeris" : "Astronomy Engine fallback"} · ავტომატური განახლება ყოველ 5 წუთში
          </p>
        </>
      )}
    </details>
  );
}
