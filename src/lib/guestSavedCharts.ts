export interface GuestSavedChart {
  id: string;
  savedAt: string;
  type: string;
  label: string;
  birth: {
    name: string;
    date: string;
    time: string;
    place: string;
    lat: number | null;
    lon: number | null;
    timezone: string | null;
  };
  secondaryBirth?: GuestSavedChart["birth"];
  transit?: { date: string; startDate: string; endDate: string };
  houseSystem: string;
  interpretation: string | null;
  result: unknown;
}

const STORAGE_KEY = "astro_guest_saved_charts";
const MAX_SAVED_CHARTS = 50;

function isGuestSavedChart(value: unknown): value is GuestSavedChart {
  if (!value || typeof value !== "object") return false;
  const chart = value as Partial<GuestSavedChart>;
  return typeof chart.id === "string"
    && typeof chart.savedAt === "string"
    && typeof chart.type === "string"
    && typeof chart.label === "string"
    && typeof chart.houseSystem === "string"
    && !!chart.birth
    && typeof chart.birth.name === "string"
    && (chart.interpretation === null || typeof chart.interpretation === "string");
}

export function saveGuestChart(chart: Omit<GuestSavedChart, "id" | "savedAt">): GuestSavedChart {
  if (typeof window === "undefined") throw new Error("რუკის შენახვა ამ გარემოში მიუწვდომელია.");

  const savedChart: GuestSavedChart = {
    ...chart,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed) || !parsed.every(isGuestSavedChart)) {
      throw new Error("შენახული რუკების მონაცემები დაზიანებულია.");
    }
    const existing = parsed;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([savedChart, ...existing].slice(0, MAX_SAVED_CHARTS)));
  } catch (error) {
    if (error instanceof Error && error.message === "შენახული რუკების მონაცემები დაზიანებულია.") throw error;
    throw new Error("რუკა მოწყობილობაზე ვერ შეინახა. შეამოწმეთ ბრაუზერის საცავის ადგილი.");
  }

  return savedChart;
}

export function getGuestSavedCharts(): GuestSavedChart[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const charts: unknown = JSON.parse(stored);
    if (!Array.isArray(charts) || !charts.every(isGuestSavedChart)) {
      throw new Error("შენახული რუკების მონაცემები დაზიანებულია.");
    }
    return charts;
  } catch (error) {
    if (error instanceof Error && error.message === "შენახული რუკების მონაცემები დაზიანებულია.") throw error;
    throw new Error("შენახული რუკების სიის წაკითხვა ვერ მოხერხდა.");
  }
}
