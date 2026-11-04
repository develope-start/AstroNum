"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GuestCalculationRoom from "@/components/GuestCalculationRoom";
import { loadGuestCache } from "@/lib/guestCache";
import { type BirthValue } from "@/components/BirthFields";
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

export default function GuestChartRoomPage() {
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
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#080a14] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!cached || !cached.wheel) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#080a14] p-6 text-center text-white">
        <div className="max-w-md p-8 rounded-2xl border border-[rgba(212,175,55,0.3)] bg-[rgba(16,21,38,0.85)] backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-4">
          <h2 className="text-xl font-bold text-[#f5d77f]">გამოთვლის მონაცემები ვერ მოიძებნა</h2>
          <p className="text-xs text-slate-300">
            ასტროლოგიურ კაბინეტში შესასვლელად ჯერ შეიყვანეთ დაბადების მონაცემები მთავარ გვერდზე და დააჭირეთ „რუკის გამოთვლა“-ს.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] px-6 py-2.5 text-xs font-bold text-slate-950 transition hover:brightness-110 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>კალკულატორში დაბრუნება</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <GuestCalculationRoom
      birth={cached.birth}
      wheel={cached.wheel}
      interpretation={cached.interpretation}
      houseSystem={cached.houseSystem}
      onClose={() => router.push("/")}
    />
  );
}

