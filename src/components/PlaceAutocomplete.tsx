"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "leaflet/dist/leaflet.css";
import { GEORGIAN_CITIES } from "@/lib/georgianCities";
import { MapPin, Map as MapIcon, Check, Loader2, Globe } from "lucide-react";

export interface PlaceValue {
  place: string;
  lat: number | null;
  lon: number | null;
  timezone: string | null;
}

interface SearchHit {
  label: string;
  lat: number;
  lon: number;
  timezone?: string;
  source: "ge" | "search";
}

export default function PlaceAutocomplete({
  value,
  onChange,
}: {
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
}) {
  const [query, setQuery] = useState(value.place || "");
  const [open, setOpen] = useState(false);
  const [remoteHits, setRemoteHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [mapOpen, setMapOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open]);

  const localHits: SearchHit[] = GEORGIAN_CITIES.filter((c) =>
    query.trim() ? c.name.toLowerCase().includes(query.trim().toLowerCase()) : true
  ).map((c) => ({ label: c.name, lat: c.lat, lon: c.lon, timezone: "Asia/Tbilisi", source: "ge" as const }));

  useEffect(() => {
    const controller = new AbortController();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setRemoteHits([]);
      setSearching(false);
      return () => controller.abort();
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}&limit=6`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok && Array.isArray(data.results)) {
          setRemoteHits(
            data.results.map((r: { displayName: string; lat: number; lon: number; timezone: string }) => ({
              label: r.displayName,
              lat: r.lat,
              lon: r.lon,
              timezone: r.timezone,
              source: "search" as const,
            }))
          );
        } else {
          setRemoteHits([]);
        }
      } catch {
        if (!controller.signal.aborted) setRemoteHits([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        boxRef.current &&
        !boxRef.current.contains(target) &&
        portalRef.current &&
        !portalRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectHit(hit: SearchHit) {
    setQuery(hit.label);
    onChange({ place: hit.label, lat: hit.lat, lon: hit.lon, timezone: hit.timezone ?? null });
    setStatus("ok");
    setOpen(false);
  }

  useEffect(() => {
    if (!mapOpen || !mapDivRef.current || mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;
      const startLat = value.lat ?? 41.7151;
      const startLon = value.lon ?? 44.8271;
      const map = L.map(mapDivRef.current).setView([startLat, startLon], value.lat ? 10 : 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const marker = L.circleMarker([startLat, startLon], {
        radius: 8,
        color: "#C9A24B",
        fillColor: "#C9A24B",
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
      markerRef.current = marker;

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSearching(true);
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const label = res.ok ? data.displayName : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          const timezone = res.ok ? data.timezone : undefined;
          setQuery(label);
          onChange({ place: label, lat, lon: lng, timezone: timezone ?? null });
          setStatus("ok");
        } catch {
          setQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          onChange({ place: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lon: lng, timezone: null });
        } finally {
          setSearching(false);
        }
      });

      mapRef.current = map;
    });
    return () => {
      cancelled = true;
    };
  }, [mapOpen, onChange, value.lat, value.lon]);

  useEffect(() => {
    if (!mapOpen && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [mapOpen]);

  const dropdownHits = query.trim() ? [...localHits, ...remoteHits] : localHits;

  return (
    <div ref={boxRef} className="relative">
      <div className="flex gap-2 w-full">
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            className="w-full rounded-xl sm:rounded-2xl border border-amber-500/25 bg-[#080418] px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)] hover:border-amber-500/40"
            value={query}
            onFocus={() => {
              setOpen(true);
              updateCoords();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setStatus("idle");
              updateCoords();
              onChange({ place: e.target.value, lat: null, lon: null, timezone: null });
            }}
            placeholder="დაიწყეთ აკრეფა ან აირჩიეთ სიიდან…"
          />
          {searching && (
            <Loader2 className="absolute right-3.5 top-3 sm:top-3.5 h-4 w-4 animate-spin text-amber-400" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setMapOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-purple-600/20 px-3 py-2.5 sm:px-4 sm:py-3 text-[0.72rem] sm:text-xs font-bold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all hover:scale-105 hover:border-amber-400 cursor-pointer"
        >
          <MapIcon className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{mapOpen ? "დახურვა" : "რუკაზე"}</span>
        </button>
      </div>

      {status === "ok" && value.lat !== null && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[0.7rem] sm:text-xs font-semibold text-amber-300">
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{value.timezone}</span>
          <span className="text-slate-400">· ({value.lat?.toFixed(3)}, {value.lon?.toFixed(3)})</span>
        </div>
      )}

      {/* Render Dropdown via React Portal directly into document.body */}
      {open && dropdownHits.length > 0 && mounted && coords && createPortal(
        <div
          ref={portalRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: coords.width,
            maxHeight: "260px",
            zIndex: 999999,
          }}
          className="overflow-y-auto rounded-2xl border-2 border-amber-400 bg-[#0a0422] p-2 shadow-[0_25px_90px_rgba(0,0,0,1)] ring-4 ring-amber-500/30 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150"
        >
          {localHits.length > 0 && (
            <div className="flex items-center justify-center gap-1.5 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-wider text-amber-300 border-b border-amber-500/30 bg-purple-950/60 rounded-xl mb-1">
              <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>საქართველოს ქალაქები</span>
            </div>
          )}
          {localHits.map((h, i) => (
            <button
              key={`ge-${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectHit(h);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-100 transition-all hover:bg-amber-500/30 hover:text-amber-300 gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span className="truncate max-w-[170px] sm:max-w-[260px]">{h.label}</span>
              <span className="text-[0.62rem] sm:text-[0.68rem] font-bold text-violet-300 bg-purple-900/70 px-2 py-0.5 rounded-md shrink-0">Asia/Tbilisi</span>
            </button>
          ))}
          {remoteHits.length > 0 && (
            <div className="mt-2 border-t border-amber-500/30 pt-2 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-amber-300 flex items-center justify-center gap-1.5 bg-purple-950/60 rounded-xl mb-1">
              <Globe className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>სხვა შედეგები</span>
            </div>
          )}
          {remoteHits.map((h, i) => (
            <button
              key={`r-${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectHit(h);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-100 transition-all hover:bg-amber-500/30 hover:text-amber-300 gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span className="truncate max-w-[160px] sm:max-w-[240px]">{h.label}</span>
              <span className="text-[0.62rem] sm:text-[0.68rem] font-bold text-violet-300 bg-purple-900/70 px-2 py-0.5 rounded-md shrink-0">{h.timezone || "მსოფლიო"}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {mapOpen && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-amber-500/40 shadow-2xl">
          <div ref={mapDivRef} style={{ height: 260, width: "100%" }} />
          <div className="bg-slate-900/90 px-3 py-2 text-[0.7rem] text-slate-300">
            💡 დააწკაპუნეთ რუკაზე ზუსტ წერტილზე — კოორდინატები ავტომატურად ჩაიწერება.
          </div>
        </div>
      )}
    </div>
  );
}
