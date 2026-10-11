"use client";

/**
 * useLiveTransit — კლიენტ-საიდ hook, რომელიც astronomy-engine-ს იყენებს
 * მიმდინარე პლანეტარული პოზიციების გამოსათვლელად.
 *
 * თბილისი: lat=41.6938°N, lon=44.8015°E
 * UTC დრო: გრინვიჩის მიხედვით (JavaScript-ის Date ობიექტი ყოველთვის UTC-ით მუშაობს)
 */

import { useEffect, useState } from "react";
import * as Astronomy from "astronomy-engine";

// თბილისის კოორდინატები
export const TBILISI_LAT = 41.6938;
export const TBILISI_LON = 44.8015;

export interface PlanetData {
  name: string;
  nameKa: string;
  symbol: string;
  longitude: number;
  signIndex: number;
  signKa: string;
  signSymbol: string;
  deg: number;
  min: number;
  retrograde: boolean;
  element: "fire" | "earth" | "air" | "water";
  color: string;
}

export interface AnglesData {
  ascendant: number;
  mc: number;
  ascSignKa: string;
  ascSignSymbol: string;
  ascDeg: number;
  ascMin: number;
  mcSignKa: string;
  mcSignSymbol: string;
  mcDeg: number;
  mcMin: number;
}

export interface ElementBalance {
  fire: number;
  earth: number;
  air: number;
  water: number;
}

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  symbol1: string;
  symbol2: string;
  aspectName: string;
  aspectSymbol: string;
  orb: number;
  score: number;
  type: "harmonic" | "tense";
}

export interface LunarCalendarDay {
  date: string;
  dayOfMonth: number;
  lunarDay: number;
  isCurrentMonth: boolean;
}

export interface LunarCalendarData {
  lunarDay: number;
  daysSinceNewMoon: number;
  daysUntilFullMoon: number;
  month: number;
  year: number;
  days: LunarCalendarDay[];
}

export interface LiveTransitData {
  planets: PlanetData[];
  angles: AnglesData;
  elements: ElementBalance;
  synastryAspects: SynastryAspect[];
  lunarCalendar: LunarCalendarData;
  utcTime: string;
  tbilisiTime: string;
  date: string;
}

const SIGN_NAMES_KA = [
  "ვერძი", "კურო", "ტყუპები", "კირჩხიბი", "ლომი", "ქალწული",
  "სასწორი", "მორიელი", "მშვილდოსანი", "თხის რქა", "მერწყული", "თევზები",
];

const SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const SIGN_ELEMENTS: Array<"fire" | "earth" | "air" | "water"> = [
  "fire", "earth", "air", "water", "fire", "earth",
  "air", "water", "fire", "earth", "air", "water",
];

const PLANET_META: Array<{
  key: Astronomy.Body;
  name: string;
  nameKa: string;
  symbol: string;
  color: string;
}> = [
  { key: Astronomy.Body.Sun,     name: "Sun",     nameKa: "მზე",       symbol: "☉", color: "text-amber-300" },
  { key: Astronomy.Body.Moon,    name: "Moon",    nameKa: "მთვარე",    symbol: "☽", color: "text-sky-200" },
  { key: Astronomy.Body.Mercury, name: "Mercury", nameKa: "მერკური",   symbol: "☿", color: "text-slate-300" },
  { key: Astronomy.Body.Venus,   name: "Venus",   nameKa: "ვენერა",    symbol: "♀", color: "text-pink-300" },
  { key: Astronomy.Body.Mars,    name: "Mars",    nameKa: "მარსი",     symbol: "♂", color: "text-rose-400" },
  { key: Astronomy.Body.Jupiter, name: "Jupiter", nameKa: "იუპიტერი",  symbol: "♃", color: "text-orange-300" },
  { key: Astronomy.Body.Saturn,  name: "Saturn",  nameKa: "სატურნი",   symbol: "♄", color: "text-yellow-600" },
  { key: Astronomy.Body.Uranus,  name: "Uranus",  nameKa: "ურანი",     symbol: "⛢", color: "text-teal-300" },
  { key: Astronomy.Body.Neptune, name: "Neptune", nameKa: "ნეპტუნი",   symbol: "♆", color: "text-indigo-300" },
  { key: Astronomy.Body.Pluto,   name: "Pluto",   nameKa: "პლუტონი",   symbol: "♇", color: "text-violet-400" },
];

const ASPECT_DEFS = [
  { name: "კონიუნქცია", symbol: "☌", angle: 0,   orb: 8, score: 7,  type: "harmonic" as const },
  { name: "სექსტილი",   symbol: "⚹", angle: 60,  orb: 6, score: 6,  type: "harmonic" as const },
  { name: "ტრიგონი",    symbol: "△", angle: 120, orb: 8, score: 9,  type: "harmonic" as const },
  { name: "კვადრატი",   symbol: "□", angle: 90,  orb: 8, score: -7, type: "tense" as const },
  { name: "ოპოზიცია",   symbol: "☍", angle: 180, orb: 8, score: -8, type: "tense" as const },
  { name: "კვინკუნქსი", symbol: "⚻", angle: 150, orb: 3, score: -4, type: "tense" as const },
];

function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

function getEclipticLon(body: Astronomy.Body, date: Date): { lon: number; speed: number } {
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  const lon = norm360(ecl.elon);
  const d2 = new Date(date.getTime() + 24 * 3600 * 1000);
  const vec2 = Astronomy.GeoVector(body, d2, true);
  const ecl2 = Astronomy.Ecliptic(vec2);
  const lon2 = norm360(ecl2.elon);
  let speed = lon2 - lon;
  if (speed > 180) speed -= 360;
  if (speed < -180) speed += 360;
  return { lon, speed };
}

function lonToSignInfo(lon: number) {
  const norm = norm360(lon);
  const signIndex = Math.floor(norm / 30);
  const degInSign = norm - signIndex * 30;
  const deg = Math.floor(degInSign);
  const min = Math.round((degInSign - deg) * 60);
  return {
    signIndex,
    signKa: SIGN_NAMES_KA[signIndex],
    signSymbol: SIGN_SYMBOLS[signIndex],
    element: SIGN_ELEMENTS[signIndex],
    deg,
    min,
  };
}

function computeAngles(date: Date): AnglesData {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const ramc = (gst * 15 + TBILISI_LON) % 360;
  const obliquityDeg = Astronomy.e_tilt(time).tobl;
  const eps = (obliquityDeg * Math.PI) / 180;
  const ramcRad = (ramc * Math.PI) / 180;
  const mcLon = norm360(
    (Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(eps)) * 180) / Math.PI
  );
  const latRad = (TBILISI_LAT * Math.PI) / 180;
  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -(Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(ramcRad))
  );
  const asc = norm360((ascRad * 180) / Math.PI);
  const ascInfo = lonToSignInfo(asc);
  const mcInfo = lonToSignInfo(mcLon);
  return {
    ascendant: asc,
    mc: mcLon,
    ascSignKa: ascInfo.signKa,
    ascSignSymbol: ascInfo.signSymbol,
    ascDeg: ascInfo.deg,
    ascMin: ascInfo.min,
    mcSignKa: mcInfo.signKa,
    mcSignSymbol: mcInfo.signSymbol,
    mcDeg: mcInfo.deg,
    mcMin: mcInfo.min,
  };
}

function computeElements(planets: PlanetData[]): ElementBalance {
  const counts = { fire: 0, earth: 0, air: 0, water: 0 };
  for (const p of planets) counts[p.element]++;
  const total = planets.length;
  return {
    fire:  Math.round((counts.fire  / total) * 100),
    earth: Math.round((counts.earth / total) * 100),
    air:   Math.round((counts.air   / total) * 100),
    water: Math.round((counts.water / total) * 100),
  };
}

function findBestSynastryAspects(planets: PlanetData[]): SynastryAspect[] {
  const aspects: SynastryAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            planet1: p1.nameKa,
            planet2: p2.nameKa,
            symbol1: p1.symbol,
            symbol2: p2.symbol,
            aspectName: def.name,
            aspectSymbol: def.symbol,
            orb: Math.round(orb * 10) / 10,
            score: def.score,
            type: def.type,
          });
        }
      }
    }
  }
  aspects.sort((a, b) => {
    if (a.type === "harmonic" && b.type !== "harmonic") return -1;
    if (a.type !== "harmonic" && b.type === "harmonic") return 1;
    return Math.abs(b.score) - Math.abs(a.score);
  });
  return aspects.slice(0, 6);
}

function computeLunarCalendar(now: Date, localDate: string): LunarCalendarData {
  const lastNewMoon = Astronomy.SearchMoonPhase(0, now, -35);
  const nextFullMoon = Astronomy.SearchMoonPhase(180, now, 35);
  if (!lastNewMoon || !nextFullMoon) {
    throw new Error("Could not find the surrounding lunar phases.");
  }

  const daysSinceNewMoon = (now.getTime() - lastNewMoon.date.getTime()) / 86_400_000;
  const [year, month] = localDate.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1, 8));
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const days: LunarCalendarDay[] = [];

  for (let index = 0; index < 42; index++) {
    const date = new Date(Date.UTC(year, month - 1, 1 - mondayOffset + index, 8));
    const dateString = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    const previousNewMoon = Astronomy.SearchMoonPhase(0, date, -35);
    if (!previousNewMoon) {
      throw new Error(`Could not find a new moon for ${dateString}.`);
    }

    days.push({
      date: dateString,
      dayOfMonth: date.getUTCDate(),
      lunarDay: Math.floor((date.getTime() - previousNewMoon.date.getTime()) / 86_400_000) + 1,
      isCurrentMonth: date.getUTCMonth() === month - 1 && date.getUTCFullYear() === year,
    });
  }

  return {
    lunarDay: Math.floor(daysSinceNewMoon) + 1,
    daysSinceNewMoon,
    daysUntilFullMoon: (nextFullMoon.date.getTime() - now.getTime()) / 86_400_000,
    month,
    year,
    days,
  };
}

function formatTimes(date: Date): { utcTime: string; tbilisiTime: string; dateStr: string } {
  const utcH = String(date.getUTCHours()).padStart(2, "0");
  const utcM = String(date.getUTCMinutes()).padStart(2, "0");
  const utcTime = `${utcH}:${utcM} UTC`;
  const tbDate = new Date(date.getTime() + 4 * 3600 * 1000);
  const tbHH = String(tbDate.getUTCHours()).padStart(2, "0");
  const tbMM = String(tbDate.getUTCMinutes()).padStart(2, "0");
  const tbilisiTime = `${tbHH}:${tbMM} (+04:00)`;
  const dateStr = `${tbDate.getUTCFullYear()}-${String(tbDate.getUTCMonth() + 1).padStart(2, "0")}-${String(tbDate.getUTCDate()).padStart(2, "0")}`;
  return { utcTime, tbilisiTime, dateStr };
}

export function useLiveTransit(): LiveTransitData | null {
  const [data, setData] = useState<LiveTransitData | null>(null);

  function compute() {
    try {
      const now = new Date();
      const { utcTime, tbilisiTime, dateStr } = formatTimes(now);
      const planets: PlanetData[] = PLANET_META.map(({ key, name, nameKa, symbol, color }) => {
        const { lon, speed } = getEclipticLon(key, now);
        const info = lonToSignInfo(lon);
        return {
          name, nameKa, symbol,
          longitude: lon,
          signIndex: info.signIndex,
          signKa: info.signKa,
          signSymbol: info.signSymbol,
          deg: info.deg,
          min: info.min,
          retrograde: speed < 0,
          element: info.element,
          color,
        };
      });
      const angles = computeAngles(now);
      const elements = computeElements(planets);
      const synastryAspects = findBestSynastryAspects(planets);
      const lunarCalendar = computeLunarCalendar(now, dateStr);
      setData({ planets, angles, elements, synastryAspects, lunarCalendar, utcTime, tbilisiTime, date: dateStr });
    } catch (e) {
      console.error("useLiveTransit error:", e);
    }
  }

  useEffect(() => {
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return data;
}
