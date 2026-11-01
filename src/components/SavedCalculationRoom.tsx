"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import CalculationRoom from "@/components/CalculationRoom";
import type { WheelFixedStar, WheelPlanet } from "@/components/ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import type { HouseSystem } from "@/lib/astro/positions";
import { readApiResponse } from "@/lib/apiResponse";

type ChartPayload = {
  type?: string;
  name1?: string;
  date1?: string;
  time1?: string;
  place1?: string;
  lat1?: number | null;
  lon1?: number | null;
  tz1?: string | null;
  name2?: string | null;
  date2?: string | null;
  time2?: string | null;
  place2?: string | null;
  transitDate?: string | null;
  houseSystem?: string;
  mapNumber?: string | null;
  createdAt?: string;
  interpretation?: string | null;
  result?: unknown;
  error?: string;
};

type WheelData = {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
  aspects: AspectHit[];
  fixedStars: WheelFixedStar[];
  planetHouses: Record<string, number>;
};

function wheelFromResult(result: unknown): WheelData | null {
  if (!result || typeof result !== "object") return null;
  const record = result as Record<string, unknown>;
  const source = record.ascendant !== undefined
    ? record
    : record.natalChart && typeof record.natalChart === "object"
      ? record.natalChart as Record<string, unknown>
      : record.chartA && typeof record.chartA === "object"
        ? record.chartA as Record<string, unknown>
        : null;
  if (!source || typeof source.ascendant !== "number" || !Array.isArray(source.planets) || !Array.isArray(source.houseCusps)) return null;

  const advanced = source.advanced && typeof source.advanced === "object" ? source.advanced as Record<string, unknown> : null;
  return {
    ascendant: source.ascendant,
    mc: typeof source.mc === "number" ? source.mc : 0,
    houseCusps: source.houseCusps as number[],
    planets: source.planets as WheelPlanet[],
    // These are the actual cross-chart/transit aspects when the saved result
    // contains a nested natal chart.
    aspects: Array.isArray(record.aspects) ? record.aspects as AspectHit[] : Array.isArray(source.aspects) ? source.aspects as AspectHit[] : [],
    fixedStars: Array.isArray(advanced?.fixedStarContacts) ? advanced.fixedStarContacts as WheelFixedStar[] : [],
    planetHouses: source.planetHouses && typeof source.planetHouses === "object" ? source.planetHouses as Record<string, number> : {},
  };
}

export default function SavedCalculationRoom({ endpoint, returnTo }: { endpoint: string; returnTo: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<ChartPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const data = await readApiResponse<ChartPayload>(response);
        if (!response.ok) throw new Error(data.error || "რუკის მონაცემები ვერ ჩაიტვირთა.");
        setPayload(data);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(cause instanceof Error ? cause.message : "რუკის მონაცემები ვერ ჩაიტვირთა.");
      }
    })();
    return () => controller.abort();
  }, [endpoint]);

  const wheel = useMemo(() => wheelFromResult(payload?.result), [payload?.result]);
  const houseSystem: HouseSystem = ["whole_sign", "equal", "porphyry", "placidus"].includes(payload?.houseSystem ?? "")
    ? payload!.houseSystem as HouseSystem
    : "placidus";
  const displayError = error ?? (payload && !wheel ? "რუკის გამოთვლილი შედეგი დაზიანებულია ან არასრულია." : null);

  if (payload && wheel) {
    return (
      <CalculationRoom
        isOpen={true}
        onClose={() => router.push(returnTo)}
        birth={{
          name: payload.name1 ?? "უცნობი",
          date: payload.date1 ?? "",
          time: payload.time1 ?? "",
          place: payload.place1 ?? "",
          lat: Number.isFinite(payload.lat1) ? payload.lat1 ?? null : null,
          lon: Number.isFinite(payload.lon1) ? payload.lon1 ?? null : null,
          timezone: payload.tz1 ?? null,
        }}
        wheel={wheel}
        interpretation={payload.interpretation ?? null}
        mapNumber={payload.mapNumber ?? null}
        houseSystem={houseSystem}
        calculationContext={{
          type: payload.type ?? "NATAL",
          secondaryProfile: payload.name2 ? { name: payload.name2, date: payload.date2 ?? null, time: payload.time2 ?? null, place: payload.place2 ?? null } : null,
          transitDate: payload.transitDate ?? null,
          createdAt: payload.createdAt ?? null,
        }}
      />
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center bg-[#04060f] p-6 text-center text-white">
      {displayError ? (
        <div className="max-w-md space-y-4 rounded-3xl border border-rose-400/30 bg-rose-950/20 p-7">
          <p className="text-sm text-rose-200">{displayError}</p>
          <button type="button" onClick={() => router.push(returnTo)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white">
            <ArrowLeft className="h-4 w-4" /> უკან დაბრუნება
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-sm text-cyan-200">
          <Loader2 className="h-8 w-8 animate-spin" />
          რუკის სრული შედეგი იტვირთება…
        </div>
      )}
    </main>
  );
}
