import tzlookup from "tz-lookup";

export interface GeoResult {
  displayName: string;
  lat: number;
  lon: number;
  timezone: string;
}

const NOMINATIM_HEADERS = {
  // Nominatim-ის გამოყენების წესები მოითხოვს იდენტიფიცირებად User-Agent-ს — შეცვალეთ
  // საკუთარი დომენით/ელფოსტით საკუთარ დეპლოიზე, თუ ბევრი მოთხოვნა გექნებათ.
  "User-Agent": "astro-app/1.0 (astrology chart calculator)",
  Accept: "application/json",
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

/**
 * ადგილის სახელს (მაგ. "რუსთავი, საქართველო") გადააქცევს კოორდინატებად
 * OpenStreetMap-ის Nominatim სერვისის მეშვეობით (უფასო, API-გასაღები არ სჭირდება).
 * აბრუნებს რამდენიმე ვარიანტს (autocomplete-ისთვის).
 */
export async function searchPlaces(query: string, limit = 6): Promise<GeoResult[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("accept-language", "ka,en");

  const { signal, clear } = withTimeout(8000);
  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS, signal, cache: "no-store" });
    clear();
    if (!res.ok) {
      console.error("Nominatim geocode failed:", res.status, await res.text().catch(() => ""));
      return [];
    }
    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    return data.map((d) => {
      const lat = parseFloat(d.lat);
      const lon = parseFloat(d.lon);
      return { displayName: d.display_name, lat, lon, timezone: tzlookup(lat, lon) };
    });
  } catch (e) {
    clear();
    console.error("Nominatim geocode error:", e);
    return [];
  }
}

/**
 * ერთი (საუკეთესო) შედეგის მოძებნა — ძველი, მარტივი გამოძახებისთვის.
 */
export async function geocodePlace(query: string): Promise<GeoResult | null> {
  const results = await searchPlaces(query, 1);
  return results[0] ?? null;
}

/** კოორდინატებიდან ადგილის სახელს პოულობს (რუკაზე დაწკაპებისას). */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoResult> {
  const timezone = tzlookup(lat, lon);
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("accept-language", "ka,en");

  const { signal, clear } = withTimeout(8000);
  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS, signal, cache: "no-store" });
    clear();
    if (!res.ok) {
      return { displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon, timezone };
    }
    const data = (await res.json()) as { display_name?: string };
    return { displayName: data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon, timezone };
  } catch (e) {
    clear();
    console.error("Nominatim reverse geocode error:", e);
    return { displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, lat, lon, timezone };
  }
}
