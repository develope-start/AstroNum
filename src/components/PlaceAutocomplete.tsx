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
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

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

  useEffect(() => {
    setQuery(value.place || "");
  }, [value.place]);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportPadding = 8;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const width = Math.min(rect.width, Math.max(0, window.innerWidth - viewportPadding * 2));
      const preferredHeight = 260;
      const spaceBelow = viewportHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placeAbove = preferredHeight > spaceBelow && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(preferredHeight, placeAbove ? spaceAbove - 8 : spaceBelow));
      const top = placeAbove
        ? Math.max(viewportPadding, rect.top - maxHeight - 6)
        : Math.min(rect.bottom + 6, Math.max(viewportPadding, viewportHeight - viewportPadding - maxHeight));
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
      );
      setCoords({
        top,
        left,
        width,
        maxHeight,
      });
    }
  };

  useEffect(() => {
    if (!open) return;
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    window.visualViewport?.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
      window.visualViewport?.removeEventListener("resize", updateCoords);
    };
  }, [open]);

  function keepInputVisible() {
    if (!window.matchMedia("(max-width: 640px)").matches) return;
    window.requestAnimationFrame(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
  }

  // Handle clicking outside to close the portal dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const localHits: SearchHit[] = (GEORGIAN_CITIES || [])
    .filter((c) => !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8)
    .map((c) => ({
      label: `${c.name}, საქართველო`,
      lat: c.lat,
      lon: c.lon,
      timezone: "Asia/Tbilisi",
      source: "ge" as const,
    }));

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setRemoteHits([]);
      setSearching(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.results)) {
          setRemoteHits(
            data.results.map((r: { displayName: string; lat: number; lon: number; timezone?: string }) => ({
              label: r.displayName,
              lat: r.lat,
              lon: r.lon,
              timezone: r.timezone,
              source: "search" as const,
            }))
          );
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function selectHit(hit: SearchHit) {
    setQuery(hit.label);
    setOpen(false);
    setStatus("ok");
    onChange({
      place: hit.label,
      lat: hit.lat,
      lon: hit.lon,
      timezone: hit.timezone ?? null,
    });
  }

  useEffect(() => {
    if (!mapOpen || !mapDivRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapDivRef.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const initialLat = value.lat ?? 41.7151;
      const initialLon = value.lon ?? 44.8271;
      const map = L.map(mapDivRef.current).setView([initialLat, initialLon], value.lat ? 10 : 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const marker = L.circleMarker([initialLat, initialLon], {
        radius: 8,
        color: "#38bdf8",
        fillColor: "#0284c7",
        fillOpacity: 0.8,
      }).addTo(map);
      markerRef.current = marker;

      map.on("click", async (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSearching(true);
        try {
          const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
          const data = await res.json().catch(() => ({}));
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
            className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-xs sm:text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:shadow-[0_0_25px_rgba(56,189,248,0.25)] hover:border-white/20"
            value={query}
            onFocus={() => {
              setOpen(true);
              updateCoords();
              keepInputVisible();
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
            <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 animate-spin text-sky-400" />
          )}
        </div>
        <button
          type="button"
          onClick={() => setMapOpen((v) => !v)}
          className="place-map-button flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-xs font-bold text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-all hover:bg-white/[0.08] hover:border-sky-400/40 cursor-pointer"
        >
          <MapIcon className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{mapOpen ? "დახურვა" : "რუკაზე"}</span>
        </button>
      </div>

      {status === "ok" && value.lat !== null && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-sky-300">
          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>{value.timezone}</span>
          <span className="text-slate-300">· ({value.lat?.toFixed(3)}, {value.lon?.toFixed(3)})</span>
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
            maxHeight: coords.maxHeight,
            zIndex: 999999,
          }}
          className="place-suggestions overflow-y-auto rounded-3xl border border-white/20 bg-[#060813]/98 p-3 shadow-[0_25px_90px_rgba(0,0,0,0.9)] ring-1 ring-sky-500/30 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-150"
        >
          {localHits.length > 0 && (
            <div className="place-suggestions-header flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-sky-300 border-b border-white/10 bg-sky-950/40 rounded-xl mb-1.5">
              <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" />
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
              className="place-suggestion-option flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-white transition-all hover:bg-sky-500/20 hover:text-white gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span className="truncate max-w-[170px] sm:max-w-[260px]">{h.label}</span>
              <span className="place-suggestion-meta text-[0.68rem] font-bold text-sky-300 bg-sky-950/70 border border-sky-500/30 px-2 py-0.5 rounded-md shrink-0">Asia/Tbilisi</span>
            </button>
          ))}
          {remoteHits.length > 0 && (
            <div className="place-suggestions-header mt-2 border-t border-white/10 pt-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-center gap-2 bg-purple-950/40 rounded-xl mb-1.5">
              <Globe className="h-3.5 w-3.5 text-purple-400 shrink-0" />
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
              className="place-suggestion-option flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold text-white transition-all hover:bg-purple-500/20 hover:text-white gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span className="truncate max-w-[160px] sm:max-w-[240px]">{h.label}</span>
              <span className="place-suggestion-meta text-[0.68rem] font-bold text-purple-300 bg-purple-950/70 border border-purple-500/30 px-2 py-0.5 rounded-md shrink-0">{h.timezone || "მსოფლიო"}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {mapOpen && (
        <div className="place-map-panel mt-3 overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
          <div ref={mapDivRef} style={{ height: 260, width: "100%" }} />
          <div className="bg-[#070914]/95 px-4 py-2.5 text-xs text-slate-300 border-t border-white/10">
            💡 დააწკაპუნეთ რუკაზე ზუსტ წერტილზე — კოორდინატები ავტომატურად ჩაიწერება.
          </div>
        </div>
      )}
    </div>
  );
}
