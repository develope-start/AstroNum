import tzlookup from "tz-lookup";

export interface GeoResult {
  displayName: string;
  lat: number;
  lon: number;
  timezone: string;
}

type PhotonFeature = {
  geometry?: { coordinates?: unknown };
  properties?: Record<string, unknown>;
};

type PhotonResponse = { features?: PhotonFeature[] };
type CacheValue<T> = { expiresAt: number; value: T };

const PHOTON_BASE_URL = process.env.PHOTON_BASE_URL?.trim() || "https://photon.komoot.io";
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const searchCache = new Map<string, CacheValue<GeoResult[]>>();
const reverseCache = new Map<string, CacheValue<GeoResult>>();

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function readCache<T>(cache: Map<string, CacheValue<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache<T>(cache: Map<string, CacheValue<T>>, key: string, value: T) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
}

function displayName(properties: Record<string, unknown> | undefined, lat: number, lon: number) {
  if (!properties) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  const street = [properties.housenumber, properties.street]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .join(" ");
  const parts = [
    street,
    properties.name,
    properties.city,
    properties.district,
    properties.county,
    properties.state,
    properties.country,
  ].filter((part): part is string => typeof part === "string" && Boolean(part.trim()));
  const unique = [...new Set(parts.map((part) => part.trim()))];
  return unique.length ? unique.join(", ") : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function featureToGeoResult(feature: PhotonFeature): GeoResult | null {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lon, lat] = coordinates;
  if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  try {
    return {
      displayName: displayName(feature.properties, lat, lon),
      lat,
      lon,
      timezone: tzlookup(lat, lon),
    };
  } catch {
    return null;
  }
}

async function requestPhoton(url: URL, signal: AbortSignal): Promise<PhotonResponse | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AstroNum/1.0 (place search)",
      Accept: "application/geo+json, application/json",
      "Accept-Language": "ka,en;q=0.9",
    },
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Photon geocode failed:", response.status);
    return null;
  }
  const data = await response.json() as PhotonResponse;
  return data && Array.isArray(data.features) ? data : null;
}

/** Search by place name through Photon (OSM-backed, supports type-ahead search). */
export async function searchPlaces(query: string, limit = 6): Promise<GeoResult[]> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (normalizedQuery.length < 2) return [];
  const safeLimit = Math.min(10, Math.max(1, Math.trunc(limit) || 6));
  const cacheKey = `${normalizedQuery.toLocaleLowerCase("ka-GE")}\0${safeLimit}`;
  const cached = readCache(searchCache, cacheKey);
  if (cached) return cached;

  const url = new URL("/api/", PHOTON_BASE_URL);
  url.searchParams.set("q", normalizedQuery);
  url.searchParams.set("limit", String(safeLimit));

  const timeout = withTimeout(8_000);
  try {
    const data = await requestPhoton(url, timeout.signal);
    const results = (data?.features ?? [])
      .map(featureToGeoResult)
      .filter((result): result is GeoResult => result !== null);
    if (data) writeCache(searchCache, cacheKey, results);
    return results;
  } catch (error) {
    console.error("Photon geocode error:", error);
    return [];
  } finally {
    timeout.clear();
  }
}

/** Search a single best matching place. */
export async function geocodePlace(query: string): Promise<GeoResult | null> {
  const results = await searchPlaces(query, 1);
  return results[0] ?? null;
}

/** Resolve a clicked map coordinate through Photon reverse geocoding. */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const timezone = tzlookup(lat, lon);
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = readCache(reverseCache, cacheKey);
  if (cached) return { ...cached, lat, lon, timezone };

  const fallback = { displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon, timezone };
  const url = new URL("/reverse", PHOTON_BASE_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));

  const timeout = withTimeout(8_000);
  try {
    const data = await requestPhoton(url, timeout.signal);
    const result = data?.features?.[0] ? featureToGeoResult(data.features[0]) : null;
    if (!result) return fallback;
    const resolved = { ...result, lat, lon, timezone };
    writeCache(reverseCache, cacheKey, resolved);
    return resolved;
  } catch (error) {
    console.error("Photon reverse geocode error:", error);
    return fallback;
  } finally {
    timeout.clear();
  }
}
