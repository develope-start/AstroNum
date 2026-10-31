"use client";

import { useEffect, useState } from "react";

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

export interface LunarCalendarData {
  lunarDay: number;
  daysSinceNewMoon: number;
  daysUntilFullMoon: number;
  phase: "new" | "full" | null;
  month: number;
  year: number;
  days: Array<{ date: string; dayOfMonth: number; lunarDay: number; isCurrentMonth: boolean }>;
}

export interface LiveTransitData {
  planets: PlanetData[];
  angles: AnglesData;
  elements: { fire: number; earth: number; air: number; water: number };
  synastryAspects: SynastryAspect[];
  lunarCalendar: LunarCalendarData;
  utcTime: string;
  tbilisiTime: string;
  date: string;
}

/** Fetches the server-calculated Swiss Ephemeris transit once per minute. */
export function useLiveTransit(): LiveTransitData | null {
  const [data, setData] = useState<LiveTransitData | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch("/api/transits/live", { cache: "no-store" });
        if (!response.ok) throw new Error(`Live transit request failed (${response.status})`);
        const next = await response.json() as LiveTransitData;
        if (!cancelled) setData(next);
      } catch (error) {
        // Keep the most recently successful reading visible during a transient outage.
        console.error("Live transit refresh failed:", error);
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return data;
}
