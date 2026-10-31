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

const ELEMENT_INSIGHTS: Record<string, string> = {
  fire: "დომინირებს ცეცხლის სტიქია — ინიციატივის, ენერგიისა და თამამი გადაწყვეტილებების ხელსაყრელი პერიოდია.",
  earth: "დომინირებს მიწის სტიქია — პრაქტიკული საქმეების, ფინანსური დაგეგმვისა და სტაბილურობის დღეა.",
  air: "დომინირებს ჰაერის სტიქია — კომუნიკაციის, იდეების გაცვლისა და ახალი კავშირების დამყარების ფაზაა.",
  water: "დომინირებს წყლის სტიქია — ინტუიციის, ემოციური გააზრებისა და შემოქმედებითი ჰარმონიის დროა.",
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

  const dominantElement = snapshot
    ? [...snapshot.elements].sort((a, b) => b.percentage - a.percentage)[0]
    : null;

  return (
    <details open className="group mb-5 rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-[#090f22]/90 via-[#070b18]/85 to-[#050813]/90 p-4 sm:p-6 shadow-[0_15px_45px_rgba(34,211,238,0.1)] backdrop-blur-2xl transition-all" aria-label="მიმდინარე ტრანზიტული სტიქიების ბალანსი">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base sm:text-lg font-bold text-white transition hover:text-cyan-200 marker:hidden">
        <div className="flex items-center gap-2.5">
          <span className="live-beacon shrink-0" />
          <span className="font-display font-bold tracking-tight">დღევანდელი ცის სტიქიური ბალანსი & ცოცხალი ტრანზიტი</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-cyan-300/80 hidden sm:inline">SWISS EPHEMERIS LIVE</span>
          <span aria-hidden="true" className="text-cyan-300 font-mono text-sm transition-transform duration-200 group-open:rotate-180">▼</span>
        </div>
      </summary>
      <div className="mt-4 pt-3 border-t border-cyan-400/15 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-950/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <span className="live-beacon shrink-0" />
            <span>მიმდინარე ტრანზიტი · 10 პლანეტის რეალური კოორდინატი</span>
          </div>
          {dominantElement && dominantElement.percentage > 25 && (
            <p className="mt-2.5 text-xs sm:text-sm font-semibold text-cyan-200 flex items-center gap-2">
              <span className="text-base">{ELEMENT_STYLE[dominantElement.id].icon}</span>
              <span>{ELEMENT_INSIGHTS[dominantElement.id]}</span>
            </p>
          )}
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-300">
            პროცენტი ითვლება 10 ძირითადი პლანეტის ზოდიაქოს სტიქიაში მდებარეობით — თითო პლანეტა თანაბრად (10%), ჯამში 100%. ასპექტები ნაჩვენებია ქვემოთ და პროცენტს არ ცვლის.
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="rounded-full border border-cyan-400/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-bold text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.2)] transition hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-50 cursor-pointer">
          {refreshing ? "ახლდება…" : "✦ განახლება"}
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
          <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {snapshot.elements.map((element) => {
              const style = ELEMENT_STYLE[element.id];
              return (
                <div key={element.id} className="rounded-2xl border border-white/10 bg-[#090d1e]/70 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-white/20 hover:bg-[#090d1e]/90">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-bold flex items-center gap-1.5 ${style.text}`}>
                      <span className="text-base">{style.icon}</span>
                      <span>{element.name}</span>
                    </span>
                    <span className="font-mono text-xl font-black text-white">{element.percentage}%</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10 p-[1px]" role="progressbar" aria-label={`${element.name} სტიქიის წილი`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={element.percentage}>
                    <div className={`h-full rounded-full ${style.bar} shadow-[0_0_10px_currentColor] transition-[width] duration-700 ease-out`} style={{ width: `${element.percentage}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{element.count} პლანეტა</span>
                    <span className="font-mono opacity-80">{element.count * 10}%</span>
                  </div>
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
