"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminCalculationViewer, { CalculationViewData } from "@/components/AdminCalculationViewer";
import { readApiResponse } from "@/lib/apiResponse";

interface ChartRow {
  id: string;
  type: string;
  label: string;
  name1: string;
  date1: string;
  time1: string;
  place1: string;
  name2: string | null;
  date2: string | null;
  time2: string | null;
  place2: string | null;
  transitDate: string | null;
  createdAt: string;
}

interface CalculationRow {
  id: string;
  publicId: string | null;
  saved: boolean;
  guestGroupId?: string;
  type: string;
  name1: string;
  date1: string;
  time1: string;
  place1: string;
  lat1: number;
  lon1: number;
  tz1: string;
  name2: string | null;
  date2: string | null;
  time2: string | null;
  place2: string | null;
  lat2: number | null;
  lon2: number | null;
  tz2: string | null;
  transitDate: string | null;
  houseSystem: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string | null;
  user: { email: string; username?: string | null; publicId: string | null; adminId: string | null } | null;
}

interface GuestCalculationGroup {
  id: string;
  publicId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  calculations: CalculationRow[];
}

interface AccountEventRow {
  id: string;
  type: string;
  emailSnapshot: string;
  oldEmail: string | null;
  newEmail: string | null;
  createdAt: string;
  user: { email: string; username?: string | null; role: string; adminId: string | null } | null;
}

interface UserRow {
  id: string;
  email: string;
  publicId: string | null;
  adminId: string | null;
  name: string | null;
  role: string;
  createdAt: string;
  charts: ChartRow[];
}

function GuestCalculationPicker({
  group,
  activeId,
  onSelect,
  typeLabel,
}: {
  group: GuestCalculationGroup;
  activeId: string;
  onSelect: (id: string) => void;
  typeLabel: Record<string, string>;
}) {
  if (group.calculations.length <= 1) return null;

  return (
    <details className="mt-4 rounded-lg border border-line/70 bg-ink-2/40 p-3">
      <summary className="cursor-pointer select-none text-sm font-semibold text-parchment hover:text-blue-300">
        სხვა შედგენილი რუკები ({group.calculations.length - 1})
      </summary>
      <div className="mt-3 space-y-2">
        {group.calculations.map((calculation, index) => {
          const isActive = calculation.id === activeId;
          return (
            <button
              key={calculation.id}
              type="button"
              onClick={() => onSelect(calculation.id)}
              className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition ${isActive ? "border-line bg-ink-2 text-parchment-dim" : "border-transparent text-parchment-dim hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-200"}`}
            >
              რუკა #{group.calculations.length - index} · {typeLabel[calculation.type] ?? calculation.type} · {formatDateTime(calculation.createdAt)}
              {isActive && <span className="ml-2 text-[10px] uppercase tracking-wide">მიმდინარე</span>}
            </button>
          );
        })}
      </div>
    </details>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" });
}

function displayValue(value: string | number | null | undefined) {
  return value ?? "—";
}

function GuestCalculationCard({
  group,
  selectedId,
  onSelect,
  typeLabel,
  onView,
}: {
  group: GuestCalculationGroup;
  selectedId?: string;
  onSelect: (id: string) => void;
  typeLabel: Record<string, string>;
  onView: (calculation: CalculationRow) => void;
}) {
  const calculation = group.calculations.find((item) => item.id === selectedId) ?? group.calculations[0];
  if (!calculation) return null;

  return (
    <article className="rounded-xl border border-red-500/50 bg-red-500/5 p-4 text-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
        <div>
          <h3 className="font-medium flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <span>დაურეგისტრირებელი</span>
            </span>
            <span className="text-red-400">· აიდი: {displayValue(group.publicId)}</span>
          </h3>
          {calculation.updatedAt && <p className="text-xs text-parchment-dim/70">განახლებული: {formatDateTime(calculation.updatedAt)}</p>}
          <p className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${calculation.saved ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-300" : "border-amber-400/50 bg-amber-500/10 text-amber-300"}`}>
            {calculation.saved ? "მონაცემები შენახულია" : "შენახვის გარეშე"}
          </p>
          <p className="mt-1 text-xs text-parchment-dim">IP: {displayValue(group.ipAddress)} · რუკები: {group.calculations.length}</p>
          <p className="max-w-3xl break-words text-xs text-parchment-dim">მოწყობილობა: {displayValue(group.userAgent)}</p>
        </div>
        <p className="text-xs text-parchment-dim">გამოთვლილია: {formatDateTime(calculation.createdAt)}</p>
      </div>

      {/* Centered Glowing Slate '✦ რუკის ნახვა' Action Button */}
      <div className="my-3 flex justify-center border-y border-line/50 py-2.5">
        <button
          type="button"
          onClick={() => onView(calculation)}
          className="group flex items-center justify-center gap-2 rounded-full border-2 border-slate-300/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-100 shadow-[0_0_22px_rgba(148,163,184,0.45)] ring-2 ring-slate-400/30 transition-all hover:scale-105 hover:border-white hover:text-white hover:shadow-[0_0_32px_rgba(148,163,184,0.7)] active:scale-95 cursor-pointer"
        >
          <span className="tracking-wide text-slate-100 font-extrabold">✦ რუკის ნახვა</span>
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">პირველი პროფილი</h4>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            <dt className="text-parchment-dim">სახელი</dt><dd>{calculation.name1}</dd>
            <dt className="text-parchment-dim">თარიღი</dt><dd>{calculation.date1}</dd>
            <dt className="text-parchment-dim">დრო</dt><dd>{calculation.time1}</dd>
            <dt className="text-parchment-dim">ადგილი</dt><dd>{calculation.place1}</dd>
            <dt className="text-parchment-dim">კოორდინატები</dt><dd>{calculation.lat1}, {calculation.lon1}</dd>
            <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{calculation.tz1}</dd>
          </dl>
        </div>
        {(calculation.type === "SYNASTRY" || calculation.name2) && (
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">მეორე პროფილი</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-parchment-dim">სახელი</dt><dd>{displayValue(calculation.name2)}</dd>
              <dt className="text-parchment-dim">თარიღი</dt><dd>{displayValue(calculation.date2)}</dd>
              <dt className="text-parchment-dim">დრო</dt><dd>{displayValue(calculation.time2)}</dd>
              <dt className="text-parchment-dim">ადგილი</dt><dd>{displayValue(calculation.place2)}</dd>
              <dt className="text-parchment-dim">კოორდინატები</dt><dd>{displayValue(calculation.lat2)}, {displayValue(calculation.lon2)}</dd>
              <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{displayValue(calculation.tz2)}</dd>
            </dl>
          </div>
        )}
      </div>
      <dl className="mt-4 grid gap-x-3 gap-y-1 border-t border-line/60 pt-3 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt className="text-parchment-dim">სახლთა სისტემა</dt><dd>{calculation.houseSystem}</dd>
        <dt className="text-parchment-dim">ტრანზიტის თარიღი</dt><dd>{displayValue(calculation.transitDate)}</dd>
      </dl>
      <GuestCalculationPicker group={group} activeId={calculation.id} onSelect={onSelect} typeLabel={typeLabel} />
    </article>
  );
}

type FilterStatus = "ALL" | "REGISTERED" | "UNREGISTERED";

interface CalculationFilters {
  createdFrom: string;
  createdTo: string;
  type: string;
  status: FilterStatus;
  email: string;
  publicId: string;
  name: string;
  birthDate: string;
  time: string;
  place: string;
}

const EMPTY_FILTERS: CalculationFilters = {
  createdFrom: "",
  createdTo: "",
  type: "ALL",
  status: "ALL",
  email: "",
  publicId: "",
  name: "",
  birthDate: "",
  time: "",
  place: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [calculations, setCalculations] = useState<CalculationRow[] | null>(null);
  const [guestCalculationGroups, setGuestCalculationGroups] = useState<GuestCalculationGroup[]>([]);
  const [accountEvents, setAccountEvents] = useState<AccountEventRow[] | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CalculationFilters>(EMPTY_FILTERS);
  const [selectedGuestCalculations, setSelectedGuestCalculations] = useState<Record<string, string>>({});
  const [selectedAccountEvents, setSelectedAccountEvents] = useState<string[]>([]);
  const [showDeleteEventsModal, setShowDeleteEventsModal] = useState(false);
  const [eventsDeleteLoading, setEventsDeleteLoading] = useState(false);
  const [viewingCalculation, setViewingCalculation] = useState<CalculationViewData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;

    async function loadAdminData() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        if (res.status === 403 || res.status === 401) {
          if (!cancelled) setError("წვდომა აკრძალულია — ეს გვერდი მხოლოდ ადმინისტრატორისთვისაა.");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError(`ადმინის API-ის შეცდომა (${res.status})`);
          return;
        }
        const data = await readApiResponse<{
          admin?: { email?: string; adminId?: string | null };
          users?: UserRow[];
          calculations?: CalculationRow[];
          guestCalculationGroups?: GuestCalculationGroup[];
          accountEvents?: AccountEventRow[];
          error?: string;
        }>(res);
        if (!cancelled) {
          setAdminEmail(data.admin?.email ?? null);
          setAdminId(data.admin?.adminId ?? null);
          setUsers(data.users ?? []);
          setCalculations(data.calculations ?? []);
          setGuestCalculationGroups(data.guestCalculationGroups ?? []);
          setAccountEvents(data.accountEvents ?? []);
        }
      } catch {
        if (!cancelled) setError("ადმინის მონაცემების ჩატვირთვა ვერ მოხერხდა.");
      } finally {
        requestInFlight = false;
      }
    }

    loadAdminData();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadAdminData();
    }, 30000);
    window.addEventListener("focus", loadAdminData);
    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", loadAdminData);
    };
  }, [router]);

  async function openCalculationView(calculation: CalculationRow) {
    setViewLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/management/calculation/${calculation.id}`, { cache: "no-store" });
      const rawBody = await response.text();
      let body: { error?: string; result?: unknown; interpretation?: string | null } = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        body = {};
      }
      if (!response.ok) throw new Error(body.error || `რუკის გახსნა ვერ მოხერხდა (${response.status})`);
      if (!body.result) throw new Error(body.error || "რუკის მონაცემი ვერ მოიძებნა");
      setViewingCalculation({ ...calculation, result: body.result, interpretation: body.interpretation ?? null });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "რუკის გახსნა ვერ მოხერხდა");
    } finally {
      setViewLoading(false);
    }
  }

  async function permanentlyDeleteAccountEvents() {
    if (selectedAccountEvents.length === 0) return;
    setEventsDeleteLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/management/account-events/permanent", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedAccountEvents }),
      });
      const data = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error || `ისტორიის წაშლა ვერ შესრულდა (${response.status})`);
      setAccountEvents((current) => current?.filter((event) => !selectedAccountEvents.includes(event.id)) ?? []);
      setSelectedAccountEvents([]);
      setShowDeleteEventsModal(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ისტორიის წაშლა ვერ შესრულდა");
    } finally {
      setEventsDeleteLoading(false);
    }
  }

  const filteredCalculations = useMemo(() => {
    if (!calculations) return null;

    const includes = (values: Array<string | null | undefined>, query: string) => {
      if (!query.trim()) return true;
      const normalizedQuery = query.trim().toLocaleLowerCase("ka-GE");
      return values.some((value) => value?.toLocaleLowerCase("ka-GE").includes(normalizedQuery));
    };

    return calculations
      .filter((calculation) => {
        const createdDate = calculation.createdAt.slice(0, 10);
        const registered = Boolean(calculation.user);
        return (
          (!filters.createdFrom || createdDate >= filters.createdFrom) &&
          (!filters.createdTo || createdDate <= filters.createdTo) &&
          (filters.type === "ALL" || calculation.type === filters.type) &&
          (filters.status === "ALL" || (filters.status === "REGISTERED" ? registered : !registered)) &&
          includes([calculation.user?.email], filters.email) &&
          includes([calculation.publicId, calculation.user?.publicId, calculation.user?.adminId], filters.publicId) &&
          includes([calculation.name1, calculation.name2], filters.name) &&
          includes([calculation.date1, calculation.date2], filters.birthDate) &&
          includes([calculation.time1, calculation.time2], filters.time) &&
          includes([calculation.place1, calculation.place2], filters.place)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [calculations, filters]);

  const filteredGuestCalculationGroups = useMemo(() => {
    const includes = (values: Array<string | null | undefined>, query: string) => {
      if (!query.trim()) return true;
      const normalizedQuery = query.trim().toLocaleLowerCase("ka-GE");
      return values.some((value) => value?.toLocaleLowerCase("ka-GE").includes(normalizedQuery));
    };

    return guestCalculationGroups
      .map((group) => ({
        ...group,
        calculations: group.calculations.filter((calculation) => {
          const createdDate = calculation.createdAt.slice(0, 10);
          return (
            (!filters.createdFrom || createdDate >= filters.createdFrom) &&
            (!filters.createdTo || createdDate <= filters.createdTo) &&
            (filters.type === "ALL" || calculation.type === filters.type) &&
            (filters.status === "ALL" || filters.status === "UNREGISTERED") &&
            includes([], filters.email) &&
            includes([calculation.publicId, group.publicId], filters.publicId) &&
            includes([calculation.name1, calculation.name2], filters.name) &&
            includes([calculation.date1, calculation.date2], filters.birthDate) &&
            includes([calculation.time1, calculation.time2], filters.time) &&
            includes([calculation.place1, calculation.place2], filters.place)
          );
        }),
      }))
      .filter((group) => group.calculations.length > 0);
  }, [guestCalculationGroups, filters]);

  const stats = useMemo(() => {
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    const d7 = 7 * 24 * 60 * 60 * 1000;
    const d30 = 30 * 24 * 60 * 60 * 1000;

    let charts24h = 0;
    let charts7d = 0;
    let charts30d = 0;

    if (calculations) {
      for (const c of calculations) {
        const time = new Date(c.createdAt).getTime();
        const diff = now - time;
        if (diff <= h24) charts24h++;
        if (diff <= d7) charts7d++;
        if (diff <= d30) charts30d++;
      }
    }

    let users24h = 0;
    let users7d = 0;
    let users30d = 0;

    if (users) {
      for (const u of users) {
        const time = new Date(u.createdAt).getTime();
        const diff = now - time;
        if (diff <= h24) users24h++;
        if (diff <= d7) users7d++;
        if (diff <= d30) users30d++;
      }
    }

    return { charts24h, users24h, charts7d, users7d, charts30d, users30d };
  }, [calculations, users]);

  if (error) {
    return <p className="mt-10 text-center text-ember">{error}</p>;
  }

  const typeLabel: Record<string, string> = {
    NATAL: "ნატალური რუკა",
    SYNASTRY: "სინასტრია",
    TRANSIT: "ტრანზიტი",
  };
  const eventLabel: Record<string, string> = {
    ACCOUNT_CREATED: "კაბინეტი შეიქმნა",
    EMAIL_CHANGED: "ელფოსტა შეიცვალა",
    PASSWORD_CHANGED: "პაროლი შეიცვალა",
    PASSWORD_RESET: "პაროლი აღდგა",
    ACCOUNT_DELETED: "კაბინეტი წაიშალა",
    ADMIN_EMAIL_CHANGED: "ელფოსტა შეიცვალა (ადმინის მიერ)",
    NAME_CHANGED: "სახელი შეიცვალა (ადმინის მიერ)",
    USERNAME_CHANGED: "Username შეიცვალა (ადმინის მიერ)",
    PROFILE_CHANGED: "პროფილი შეიცვალა (ადმინის მიერ)",
  };

  const show = (value: string | number | null | undefined) => value ?? "—";
  const showDateTime = (value: string) =>
    new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" });
  const eventStatusLabel: Record<string, string> = {
    ACCOUNT_AND_CHARTS_DELETED: "წაშლილი — ანგარიში და შედგენილი რუკები",
    CHART_DELETED: "წაშლილი — შედგენილი რუკა",
    CALCULATION_DELETED: "წაშლილი — რუკის ჩანაწერი",
    ACCOUNT_RESTORED: "აღდგენილი — ანგარიში",
    CALCULATION_RESTORED: "აღდგენილი — შედგენილი რუკა",
  };
  const eventBaseType = (type: string) => type.split(":", 1)[0];
  const eventIsDeleted = (type: string) => ["ACCOUNT_DELETED", "ACCOUNT_AND_CHARTS_DELETED", "CHART_DELETED", "CALCULATION_DELETED"].includes(eventBaseType(type));
  const eventIsRestored = (type: string) => ["ACCOUNT_RESTORED", "CALCULATION_RESTORED"].includes(eventBaseType(type));

  const hasFilters =
    Boolean(filters.createdFrom || filters.createdTo || filters.email || filters.publicId || filters.name || filters.birthDate || filters.time || filters.place) ||
    filters.type !== "ALL" ||
    filters.status !== "ALL";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-5">
        <h1 className="font-display text-2xl font-black text-brass-2 drop-shadow">ადმინის პანელი — ყველა მომხმარებელი</h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Left: მომხმარებლების მართვა (Users Management) */}
          <a
            href="/admin/users"
            className="group flex items-center gap-2 rounded-2xl border-2 border-dashed border-amber-400/70 bg-purple-950/50 px-5 py-2.5 text-xs sm:text-sm font-black text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/30 transition-all duration-300 hover:scale-105 hover:border-solid hover:border-white hover:bg-gradient-to-r hover:from-amber-400 hover:via-amber-500 hover:to-purple-600 hover:text-slate-950 hover:shadow-[0_0_35px_rgba(245,158,11,0.7)] active:scale-95 cursor-pointer"
          >
            <span className="tracking-wide">✦ მომხმარებლების მართვა</span>
          </a>

          {/* Right: ადმინისტრატორების მართვა (Admins Management) */}
          {adminId === "ADMIN" && (
            <a
              href="/admin/admins"
              className="group flex items-center gap-2 rounded-2xl border-2 border-rose-600/70 bg-rose-950/50 px-5 py-2.5 text-xs sm:text-sm font-black text-rose-300 shadow-[0_0_20px_rgba(225,29,72,0.4)] ring-1 ring-rose-500/30 transition-all duration-300 hover:scale-105 hover:border-indigo-400 hover:bg-gradient-to-r hover:from-rose-900 hover:via-purple-950 hover:to-indigo-900 hover:text-white hover:shadow-[0_0_35px_rgba(225,29,72,0.7)] active:scale-95 cursor-pointer"
            >
              <span className="tracking-wide">🛡️ ადმინისტრატორების მართვა</span>
            </a>
          )}
        </div>
      </div>
      <div className="mb-8 rounded-2xl border-2 border-[#35c759] bg-[#35c759]/10 p-5 shadow-lg shadow-[#35c759]/20">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#d98a9b]">ადმინის ანგარიში</p>
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-2xl font-bold tracking-wide text-[#55e6e1]">{adminEmail ?? "იტვირთება…"}</span>
          <span className="text-lg font-bold text-orange-400">{adminId ?? "ADMIN"}</span>
          <span className="text-4xl font-black tracking-wide text-[#ff7a18]">ადმინი</span>
        </div>
      </div>
      {users === null && <p className="text-parchment-dim">იტვირთება…</p>}

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-line/40 pb-3">
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-[0_0_18px_rgba(245,158,11,0.65)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] hover:scale-[1.01] cursor-default">
            📜 რუკების გამოთვლის ისტორია
          </h2>
          <a
            href="#account-events-section"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("account-events-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group flex items-center gap-2 rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-r from-slate-950 via-cyan-950/60 to-slate-950 px-5 py-2.5 text-xs sm:text-sm font-black text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.5)] ring-1 ring-cyan-400/30 transition-all duration-300 hover:scale-105 hover:border-cyan-300 hover:bg-gradient-to-r hover:from-cyan-900 hover:via-indigo-900 hover:to-purple-900 hover:text-white hover:shadow-[0_0_35px_rgba(34,211,238,0.85)] active:scale-95 cursor-pointer"
          >
            <span className="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 group-hover:text-white">
              🔑 კაბინეტების ცვლილების ისტორია ↓
            </span>
          </a>
        </div>

        {/* Subtle Live Stats Indicator Banner */}
        <div className="mb-4 rounded-xl border border-line/50 bg-ink-2/40 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs italic text-parchment-dim/85">
            {/* Live Beep / Pulse Indicator Dot */}
            <div className="flex items-center gap-2 not-italic">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">სტატისტიკა:</span>
            </div>

            {/* 24 Hours */}
            <div className="flex items-center gap-1.5">
              <span>⚡ ბოლო 24 საათში:</span>
              <span className="font-semibold text-amber-300 not-italic">{stats.charts24h}</span>
              <span>რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-semibold text-cyan-300 not-italic">{stats.users24h}</span>
              <span>მომხმარებელი</span>
            </div>

            {/* 1 Week */}
            <div className="flex items-center gap-1.5">
              <span>📅 ბოლო 1 კვირაში:</span>
              <span className="font-semibold text-amber-300 not-italic">{stats.charts7d}</span>
              <span>რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-semibold text-cyan-300 not-italic">{stats.users7d}</span>
              <span>მომხმარებელი</span>
            </div>

            {/* 1 Month */}
            <div className="flex items-center gap-1.5">
              <span>🗓️ ბოლო 1 თვეში:</span>
              <span className="font-semibold text-amber-300 not-italic">{stats.charts30d}</span>
              <span>რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-semibold text-cyan-300 not-italic">{stats.users30d}</span>
              <span>მომხმარებელი</span>
            </div>
          </div>
        </div>
        <div className="mb-4 rounded-xl border border-line bg-ink-2/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-parchment-dim">
              აიდი
              <input value={filters.publicId} onChange={(e) => setFilters((current) => ({ ...current, publicId: e.target.value }))} placeholder="მაგ. R00001 ან 00001" className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim">
              შედგენის თარიღიდან
              <input type="date" value={filters.createdFrom} onChange={(e) => setFilters((current) => ({ ...current, createdFrom: e.target.value }))} className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim">
              შედგენის თარიღამდე
              <input type="date" value={filters.createdTo} onChange={(e) => setFilters((current) => ({ ...current, createdTo: e.target.value }))} className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim">
              რუკის ტიპი
              <select value={filters.type} onChange={(e) => setFilters((current) => ({ ...current, type: e.target.value }))} className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass">
                <option value="ALL">ყველა ტიპი</option>
                <option value="NATAL">ნატალური</option>
                <option value="SYNASTRY">სინასტრიული</option>
                <option value="TRANSIT">ტრანზიტული</option>
              </select>
            </label>
            <label className="text-xs text-parchment-dim">
              რეგისტრაცია
              <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value as FilterStatus }))} className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass">
                <option value="ALL">ყველა</option>
                <option value="REGISTERED">რეგისტრირებული</option>
                <option value="UNREGISTERED">დაურეგისტრირებელი</option>
              </select>
            </label>
            <label className="text-xs text-parchment-dim">
              მეილი
              <input value={filters.email} onChange={(e) => setFilters((current) => ({ ...current, email: e.target.value }))} placeholder="მომხმარებლის მეილი" className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim">
              სახელი
              <input value={filters.name} onChange={(e) => setFilters((current) => ({ ...current, name: e.target.value }))} placeholder="ნებისმიერი პროფილი" className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim">
              დაბადების თარიღი
              <input type="date" value={filters.birthDate} onChange={(e) => setFilters((current) => ({ ...current, birthDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim">
              დრო
              <input type="time" value={filters.time} onChange={(e) => setFilters((current) => ({ ...current, time: e.target.value }))} className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
            <label className="text-xs text-parchment-dim sm:col-span-2 lg:col-span-4">
              ადგილი
              <input value={filters.place} onChange={(e) => setFilters((current) => ({ ...current, place: e.target.value }))} placeholder="ქალაქი ან ქვეყანა" className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3 text-xs">
            <span className="text-parchment-dim">
              ნაჩვენებია {filteredCalculations?.length ?? 0} ჩანაწერი / სულ {calculations?.length ?? 0}
            </span>
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters} className="rounded-full border border-brass/60 px-3 py-1.5 text-brass-2 disabled:cursor-not-allowed disabled:opacity-40">
              ფილტრების გასუფთავება
            </button>
          </div>
        </div>

        {/* Registered Users Map History Sub-Header & Jump Button to Unregistered */}
        <div id="registered-calculations-section" className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 scroll-mt-6">
          <h3 className="font-display text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.55)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(56,189,248,0.95)] hover:scale-[1.01] cursor-default">
            რეგისტრირებული მომხმარებლების რუკების ისტორია
          </h3>
          {filteredGuestCalculationGroups.length > 0 && (
            <button
              type="button"
              onClick={() => {
                document.getElementById("guest-calculations-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3.5 py-1.5 text-xs sm:text-sm font-black text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.4)] ring-1 ring-rose-500/30 transition-all duration-300 hover:scale-105 hover:border-rose-400 hover:bg-rose-900/60 hover:text-white hover:shadow-[0_0_25px_rgba(244,63,94,0.85)] active:scale-95 cursor-pointer"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
              </span>
              <span>დაურეგისტრირებელი მომხმარებლების რუკების ისტორია ↓</span>
            </button>
          )}
        </div>

        {calculations?.length === 0 && (
          <p className="text-xs text-parchment-dim">ჯერ არცერთი რუკა არ გამოთვლილა.</p>
        )}
        {calculations && calculations.length > 0 && filteredCalculations?.length === 0 && (
          <p className="text-xs text-parchment-dim">ამ ფილტრებით ჩანაწერი ვერ მოიძებნა.</p>
        )}
        <div className="space-y-4">
          {filteredCalculations?.map((c) => (
            <article key={c.id} className="rounded-xl border border-line bg-ink-2/60 p-4 text-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <div>
                  <h3 className="font-medium text-brass-2">{typeLabel[c.type] ?? c.type}</h3>
                  {c.updatedAt && <p className="text-xs text-parchment-dim/70">განახლებული: {showDateTime(c.updatedAt)}</p>}
                  {c.user ? (
                    <div className="mt-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-orange-400">ADMIN ID: {show(c.user.adminId)}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                          </span>
                          <span>რეგისტრირებული</span>
                        </span>
                      </div>
                      <span className="mt-1 block text-parchment-dim">აიდი: {show(c.user.publicId ?? c.publicId)}</span>
                      <span className="block text-parchment-dim">იუზერი: {c.user.email}</span>
                      <span className="mt-0.5 block text-xs font-semibold text-[#55e6e1]">
                        Username: {c.user.username ? `@${c.user.username}` : <span className="text-amber-400/80 italic font-normal">არ აქვს მითითებული</span>}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                        </span>
                        <span>დაურეგისტრირებელი</span>
                      </span>
                      <span className="mt-1 block text-parchment-dim">აიდი: {show(c.publicId)}</span>
                      <span className="block text-parchment-dim">IP: {show(c.ipAddress)}</span>
                      <span className="block max-w-3xl break-words text-parchment-dim">
                        მოწყობილობა: {show(c.userAgent)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-parchment-dim">გამოთვლილია: {showDateTime(c.createdAt)}</p>
              </div>

              {/* Centered Glowing Slate '✦ რუკის ნახვა' Action Button */}
              <div className="my-3 flex justify-center border-y border-line/50 py-2.5">
                <button
                  type="button"
                  onClick={() => openCalculationView(c)}
                  className="group flex items-center justify-center gap-2 rounded-full border-2 border-slate-300/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-100 shadow-[0_0_22px_rgba(148,163,184,0.45)] ring-2 ring-slate-400/30 transition-all hover:scale-105 hover:border-white hover:text-white hover:shadow-[0_0_32px_rgba(148,163,184,0.7)] active:scale-95 cursor-pointer"
                >
                  <span className="tracking-wide text-slate-100 font-extrabold">✦ რუკის ნახვა</span>
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">პირველი პროფილი</h4>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <dt className="text-parchment-dim">სახელი</dt><dd>{c.name1}</dd>
                    <dt className="text-parchment-dim">თარიღი</dt><dd>{c.date1}</dd>
                    <dt className="text-parchment-dim">დრო</dt><dd>{c.time1}</dd>
                    <dt className="text-parchment-dim">ადგილი</dt><dd>{c.place1}</dd>
                    <dt className="text-parchment-dim">კოორდინატები</dt><dd>{c.lat1}, {c.lon1}</dd>
                    <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{c.tz1}</dd>
                  </dl>
                </div>

                {(c.type === "SYNASTRY" || c.name2) && (
                  <div>
                    <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">მეორე პროფილი</h4>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      <dt className="text-parchment-dim">სახელი</dt><dd>{show(c.name2)}</dd>
                      <dt className="text-parchment-dim">თარიღი</dt><dd>{show(c.date2)}</dd>
                      <dt className="text-parchment-dim">დრო</dt><dd>{show(c.time2)}</dd>
                      <dt className="text-parchment-dim">ადგილი</dt><dd>{show(c.place2)}</dd>
                      <dt className="text-parchment-dim">კოორდინატები</dt><dd>{show(c.lat2)}, {show(c.lon2)}</dd>
                      <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{show(c.tz2)}</dd>
                    </dl>
                  </div>
                )}
              </div>

              <dl className="mt-4 grid gap-x-3 gap-y-1 border-t border-line/60 pt-3 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
                <dt className="text-parchment-dim">სახლთა სისტემა</dt><dd>{c.houseSystem}</dd>
                <dt className="text-parchment-dim">ტრანზიტის თარიღი</dt><dd>{show(c.transitDate)}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {filteredGuestCalculationGroups.length > 0 && (
        <section id="guest-calculations-section" className="mb-8 scroll-mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
            <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-rose-500 drop-shadow-[0_0_18px_rgba(244,63,94,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(244,63,94,0.95)] hover:scale-[1.01] cursor-default">
              დაურეგისტრირებელი მომხმარებლების რუკების ისტორია
            </h2>
            <button
              type="button"
              onClick={() => {
                document.getElementById("registered-calculations-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center gap-2 rounded-xl border border-sky-400/50 bg-cyan-950/40 px-3.5 py-1.5 text-xs sm:text-sm font-black text-cyan-300 shadow-[0_0_14px_rgba(56,189,248,0.4)] ring-1 ring-sky-400/30 transition-all duration-300 hover:scale-105 hover:border-cyan-300 hover:bg-cyan-900/60 hover:text-white hover:shadow-[0_0_25px_rgba(56,189,248,0.85)] active:scale-95 cursor-pointer"
            >
              <span>↑ რეგისტრირებული მომხმარებლების რუკების ისტორია</span>
            </button>
          </div>
          <div className="space-y-4">
            {filteredGuestCalculationGroups.map((group) => (
              <GuestCalculationCard
                key={group.id}
                group={group}
                selectedId={selectedGuestCalculations[group.id]}
                onSelect={(id) => setSelectedGuestCalculations((current) => ({ ...current, [group.id]: id }))}
                typeLabel={typeLabel}
                onView={openCalculationView}
              />
            ))}
          </div>
        </section>
      )}

      <section id="account-events-section" className="mb-8 scroll-mt-6">
        {accountEvents && accountEvents.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/30 px-3 py-2 text-xs font-bold text-cyan-200">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-cyan-400"
                checked={selectedAccountEvents.length === accountEvents.length}
                onChange={(event) => setSelectedAccountEvents(event.target.checked ? accountEvents.map((item) => item.id) : [])}
              />
              ყველას მონიშვნა
            </label>
            <button
              type="button"
              disabled={selectedAccountEvents.length === 0 || eventsDeleteLoading}
              onClick={() => setShowDeleteEventsModal(true)}
              className="rounded-full border border-rose-500/70 bg-rose-950/50 px-4 py-2 text-xs font-black text-rose-300 transition hover:bg-rose-900/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              სამუდამოდ წაშლა ({selectedAccountEvents.length})
            </button>
          </div>
        )}
        <h2 className="font-display mb-4 text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-indigo-400 drop-shadow-[0_0_18px_rgba(34,211,238,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(34,211,238,0.95)] hover:scale-[1.01] cursor-default">
          🔑 კაბინეტების ცვლილებების ისტორია
        </h2>
        {accountEvents?.length === 0 && <p className="text-xs text-parchment-dim">ცვლილებების ისტორია ჯერ ცარიელია.</p>}
        <div className="space-y-2">
          {accountEvents?.map((event) => (
            <div key={event.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-ink-2/60 p-3 text-xs ${event.user?.role === "ADMIN" ? "border-2 border-[#35c759] bg-[#35c759]/10" : "border-line"}`}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  aria-label="ისტორიის ჩანაწერის მონიშვნა"
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-cyan-400"
                  checked={selectedAccountEvents.includes(event.id)}
                  onChange={() => setSelectedAccountEvents((current) => current.includes(event.id) ? current.filter((id) => id !== event.id) : [...current, event.id])}
                />
                <div>
                <span className={`inline-flex rounded-full border px-2.5 py-1 font-bold ${eventIsDeleted(event.type) ? "border-rose-400/70 bg-rose-950/50 text-rose-300" : eventIsRestored(event.type) ? "border-emerald-400/70 bg-emerald-950/50 text-emerald-300" : "border-amber-400/50 bg-amber-500/10 text-brass-2"}`}>
                  {eventStatusLabel[eventBaseType(event.type)] ?? eventLabel[eventBaseType(event.type)] ?? event.type}
                </span>
                <span className="ml-3 text-parchment-dim">იუზერი:</span>
                {event.user?.role === "ADMIN" ? (
                  <span className="ml-2 inline-flex flex-wrap items-center gap-4">
                    <span className="text-xl font-bold tracking-wide text-[#55e6e1]">{event.user.email}</span>
                    <span className="text-xs font-bold text-[#55e6e1]">
                      Username: {event.user.username ? `@${event.user.username}` : <span className="text-amber-400/80 italic font-normal">არ აქვს მითითებული</span>}
                    </span>
                    <span className="text-lg font-bold text-orange-400">{event.user.adminId ?? "ADMIN"}</span>
                    <span className="text-3xl font-black tracking-wide text-[#ff7a18]">ადმინი</span>
                  </span>
                ) : (
                  <span className="ml-2 inline-flex flex-wrap items-center gap-3 text-parchment-dim">
                    <span>{event.user?.email ?? event.emailSnapshot}</span>
                    <span className="text-xs font-semibold text-[#55e6e1]">
                      (Username: {event.user?.username ? `@${event.user.username}` : <span className="text-amber-400/80 italic font-normal">არ აქვს მითითებული</span>})
                    </span>
                  </span>
                )}
                {event.oldEmail && event.newEmail && <span className="ml-3 text-parchment-dim">{event.oldEmail} → {event.newEmail}</span>}
              </div>
               <span className="text-parchment-dim">{showDateTime(event.createdAt)}</span>
             </div>
            </div>
           ))}
        </div>
      </section>

      {showDeleteEventsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-500/50 bg-[#120826] p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
            <h3 className="font-display text-xl font-bold text-rose-300">ისტორიის სამუდამოდ წაშლა</h3>
            <p className="text-sm leading-relaxed text-slate-200">
              ნამდვილად გსურთ მონიშნული {selectedAccountEvents.length} ისტორიის ჩანაწერის სამუდამოდ წაშლა? ეს მოქმედება საბოლოოა და ჩანაწერების აღდგენა ვეღარ მოხდება.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDeleteEventsModal(false)} className="rounded-full border border-slate-500/50 bg-slate-800/60 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700/60">უარყოფა</button>
              <button type="button" disabled={eventsDeleteLoading} onClick={permanentlyDeleteAccountEvents} className="rounded-full border border-rose-500 bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-xs font-black text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] disabled:opacity-50">
                {eventsDeleteLoading ? "იშლება..." : "თანხმობა, სამუდამოდ წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewLoading && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 text-sm text-slate-200">იტვირთება...</div>}
      {viewingCalculation && <AdminCalculationViewer calculation={viewingCalculation} onClose={() => setViewingCalculation(null)} />}

    </div>
  );
}
