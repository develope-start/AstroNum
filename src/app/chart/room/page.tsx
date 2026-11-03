"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CalculationRoom from "@/components/CalculationRoom";
import { loadGuestCache } from "@/lib/guestCache";
import { EMPTY_BIRTH, type BirthValue } from "@/components/BirthFields";
import type { WheelPlanet } from "@/components/ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import type { HouseSystem } from "@/lib/astro/positions";
import type { EphemerisMetadata } from "@/lib/astro/ephemeris";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CacheShape {
  birth: BirthValue;
  houseSystem: HouseSystem;
  interpretation: string;
  wheel: {
    ascendant: number;
    mc: number;
    houseCusps: number[];
    planets: WheelPlanet[];
    aspects: AspectHit[];
    fixedStars: Array<{ star: string; planet: string; longitude: number; orb: number }>;
    planetHouses: Record<string, number>;
    ephemeris?: EphemerisMetadata;
  } | null;
  mapNumber?: string | null;
  savedId?: string | null;
}

export default function ChartRoomPage() {
  const router = useRouter();
  const [cached, setCached] = useState<CacheShape | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const data = loadGuestCache<CacheShape>("natal");
    if (data && data.wheel) {
      setCached(data);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#04060f] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!cached || !cached.wheel) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#04060f] p-6 text-center text-white">
        <div className="cr-glass max-w-md p-8 space-y-4">
          <h2 className="text-xl font-bold text-cyan-300">გამოთვლის მონაცემები ვერ მოიძებნა</h2>
          <p className="text-xs text-slate-300">
            ასტროლოგიურ კაბინეტში შესასვლელად ჯერ შეიყვანეთ დაბადების მონაცემები მთავარ გვერდზე.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>კალკულატორში გადასვლა</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CalculationRoom
      isOpen={true}
      onClose={() => router.push("/")}
      birth={cached.birth}
      wheel={cached.wheel}
      interpretation={cached.interpretation}
      mapNumber={cached.mapNumber}
      houseSystem={cached.houseSystem}
      savedChart={Boolean(cached.savedId)}
    />
  );
}
