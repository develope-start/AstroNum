const TTL_MS = 12 * 60 * 60 * 1000; // 12 საათი

interface CacheEntry<T> {
  savedAt: number;
  data: T;
}

function key(tab: string) {
  return `astro_guest_${tab}`;
}

export function saveGuestCache<T>(tab: string, data: T) {
  if (typeof window === "undefined") return;
  const entry: CacheEntry<T> = { savedAt: Date.now(), data };
  try {
    window.localStorage.setItem(key(tab), JSON.stringify(entry));
  } catch {
    // localStorage შეიძლება მიუწვდომელი იყოს (პრივატული რეჟიმი და ა.შ.) — უბრალოდ არ შევინახოთ
  }
}

export function loadGuestCache<T>(tab: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(tab));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.savedAt > TTL_MS) {
      window.localStorage.removeItem(key(tab));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function clearGuestCache(tab: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(tab));
}

export async function validateGuestCache(tab: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/guest/status?type=${encodeURIComponent(tab)}`, { cache: "no-store" });
    if (!response.ok) return true;
    const data = await response.json() as { active?: boolean };
    if (data.active === false) {
      clearGuestCache(tab);
      return false;
    }
    return true;
  } catch {
    // Temporary network failures must not erase a user's locally cached calculation.
    return true;
  }
}
