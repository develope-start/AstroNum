"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCalculationViewer, { CalculationViewData } from "@/components/AdminCalculationViewer";

type NullableString = string | null;

interface CalculationData {
  id: string;
  publicId: string | null;
  saved: boolean;
  type: string;
  name1: string;
  date1: string;
  time1: string;
  place1: string;
  lat1: number;
  lon1: number;
  tz1: string;
  name2: NullableString;
  date2: NullableString;
  time2: NullableString;
  place2: NullableString;
  lat2: number | null;
  lon2: number | null;
  tz2: NullableString;
  transitDate: NullableString;
  houseSystem: string;
  createdAt: string;
  updatedAt: string | null;
}

interface ManagedCalculation extends CalculationData {
  user: { email: string; publicId: string | null; adminId: string | null; role: string } | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface GuestCalculationGroup {
  id: string;
  publicId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  calculations: ManagedCalculation[];
}

interface ManagedUser {
  id: string;
  publicId: string | null;
  adminId: string | null;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  createdAt: string;
  calculations: CalculationData[];
}

interface DeletedUser {
  id: string;
  publicId: string | null;
  adminId: string | null;
  name: string | null;
  username: string | null;
  email: string;
  role: string;
  originalCreatedAt: string;
  deletedAt: string;
  chartCount: number;
  calculationCount: number;
  calculations: CalculationData[];
}

interface DeletedCalculation {
  id: string;
  originalId: string;
  type: string;
  summary: string;
  deletedAt: string;
  userEmail: string | null;
  data: CalculationData & { userId: string | null };
}

interface ManagementData {
  currentUserId: string;
  currentUserAdminId: string | null;
  users: ManagedUser[];
  guestCalculations: ManagedCalculation[];
  guestCalculationGroups: GuestCalculationGroup[];
  deletedUsers: DeletedUser[];
  deletedCalculations: DeletedCalculation[];
}

type ModalKind = "delete-user" | "edit-user" | "edit-user-form" | "save-user" | "delete-calculation" | "edit-calculation" | "edit-calculation-form" | "save-calculation" | "cancel-edit" | "permanent-delete-users" | "permanent-delete-calculations";
interface ModalState {
  kind: ModalKind;
  user?: ManagedUser;
  calculation?: CalculationData;
}

type CalculationDraft = Omit<CalculationData, "id" | "createdAt" | "updatedAt" | "publicId" | "saved">;
type UserStatusFilter = "ALL" | "REGISTERED" | "UNREGISTERED";
type DeletedFilter = "ALL" | "ONLY";

interface ManagementFilters {
  createdFrom: string;
  createdTo: string;
  type: string;
  status: UserStatusFilter;
  deletedUsers: DeletedFilter;
  deletedCalculations: DeletedFilter;
  email: string;
  publicId: string;
  name: string;
  birthDate: string;
  time: string;
  place: string;
}

const EMPTY_FILTERS: ManagementFilters = {
  createdFrom: "",
  createdTo: "",
  type: "ALL",
  status: "ALL",
  deletedUsers: "ALL",
  deletedCalculations: "ALL",
  email: "",
  publicId: "",
  name: "",
  birthDate: "",
  time: "",
  place: "",
};

const TYPE_LABEL: Record<string, string> = {
  NATAL: "ნატალური",
  SYNASTRY: "სინასტრიული",
  TRANSIT: "ტრანზიტული",
};

const EMPTY_DRAFT: CalculationDraft = {
  type: "NATAL", name1: "", date1: "", time1: "", place1: "", lat1: 0, lon1: 0, tz1: "",
  name2: null, date2: null, time2: null, place2: null, lat2: null, lon2: null, tz2: null,
  transitDate: null, houseSystem: "placidus",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" });
}

function value(value: string | number | null | undefined) {
  return value ?? "—";
}

function draftFromCalculation(calculation: CalculationData): CalculationDraft {
  const { id, createdAt, updatedAt, publicId, saved, ...draft } = calculation;
  return draft;
}

function CalculationDetails({ calculation, onView }: { calculation: CalculationData; onView?: (calculation: CalculationData) => void }) {
  return (
    <div>
      <p className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${calculation.saved ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-300" : "border-amber-400/50 bg-amber-500/10 text-amber-300"}`}>
        {calculation.saved ? "მონაცემები შენახულია" : "შენახვის გარეშე"}
      </p>
      {calculation.updatedAt && <p className="mb-3 text-xs text-parchment-dim/70">განახლებული: {formatDate(calculation.updatedAt)}</p>}
      {onView && <button type="button" onClick={() => onView(calculation)} className="mb-3 rounded-full border border-slate-400/70 bg-slate-500/10 px-4 py-1.5 text-xs font-bold text-slate-200 shadow-[0_0_14px_rgba(148,163,184,0.18)] transition hover:border-slate-200 hover:bg-slate-400/20">რუკის ნახვა</button>}
      <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
      <p><span className="text-parchment-dim">ტიპი:</span> {TYPE_LABEL[calculation.type] ?? calculation.type}</p>
      <p><span className="text-parchment-dim">შედგენის დრო:</span> {formatDate(calculation.createdAt)}</p>
      <p><span className="text-parchment-dim">სახელი 1:</span> {calculation.name1}</p>
      <p><span className="text-parchment-dim">დაბადება 1:</span> {calculation.date1} {calculation.time1}</p>
      <p><span className="text-parchment-dim">ადგილი 1:</span> {calculation.place1}</p>
      <p><span className="text-parchment-dim">კოორდინატები 1:</span> {calculation.lat1}, {calculation.lon1}</p>
      <p><span className="text-parchment-dim">დროის სარტყელი 1:</span> {calculation.tz1}</p>
      {calculation.name2 && <p><span className="text-parchment-dim">სახელი 2:</span> {calculation.name2}</p>}
      {calculation.date2 && <p><span className="text-parchment-dim">დაბადება 2:</span> {calculation.date2} {value(calculation.time2)}</p>}
      {calculation.place2 && <p><span className="text-parchment-dim">ადგილი 2:</span> {calculation.place2}</p>}
      {calculation.lat2 !== null && <p><span className="text-parchment-dim">კოორდინატები 2:</span> {calculation.lat2}, {value(calculation.lon2)}</p>}
      {calculation.tz2 && <p><span className="text-parchment-dim">დროის სარტყელი 2:</span> {calculation.tz2}</p>}
      <p><span className="text-parchment-dim">სახლთა სისტემა:</span> {calculation.houseSystem}</p>
      {calculation.transitDate && <p><span className="text-parchment-dim">ტრანზიტის თარიღი:</span> {calculation.transitDate}</p>}
      </div>
    </div>
  );
}

function GuestCalculationHistory({
  group,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onView,
  button,
  dangerButton,
}: {
  group: GuestCalculationGroup;
  selectedId?: string;
  onSelect: (id: string) => void;
  onEdit: (calculation: CalculationData) => void;
  onDelete: (calculation: CalculationData) => void;
  onView: (calculation: CalculationData) => void;
  button: string;
  dangerButton: string;
}) {
  const active = group.calculations.find((calculation) => calculation.id === selectedId) ?? group.calculations[0];
  if (!active) return null;

  return (
    <article className="rounded-xl border border-red-500/50 bg-red-500/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
            <span>დაურეგისტრირებელი</span>
          </span>
          <span className="font-medium text-red-400">
            · აიდი: {group.publicId ?? "—"} · რუკები: {group.calculations.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button className={button} onClick={() => onEdit(active)}>რედაქტირება</button>
          <button className={dangerButton} onClick={() => onDelete(active)}>წაშლა</button>
        </div>
      </div>
      <CalculationDetails calculation={active} onView={onView} />
      {group.calculations.length > 1 && (
        <details className="mt-4 rounded-lg border border-line/70 bg-ink-2/40 p-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-parchment hover:text-blue-300">
            სხვა შედგენილი რუკები ({group.calculations.length - 1})
          </summary>
          <div className="mt-3 space-y-2">
            {group.calculations.map((calculation, index) => {
              const isActive = calculation.id === active.id;
              return (
                <button
                  key={calculation.id}
                  type="button"
                  onClick={() => onSelect(calculation.id)}
                  className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition ${isActive ? "border-line bg-ink-2 text-parchment-dim" : "border-transparent text-parchment-dim hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-200"}`}
                >
                  რუკა #{group.calculations.length - index} · {TYPE_LABEL[calculation.type] ?? calculation.type} · {formatDate(calculation.createdAt)}
                  {isActive && <span className="ml-2 text-[10px] uppercase tracking-wide">მიმდინარე</span>}
                </button>
              );
            })}
          </div>
        </details>
      )}
    </article>
  );
}

function GuestCalculationPicker({
  group,
  activeId,
  onSelect,
}: {
  group: GuestCalculationGroup;
  activeId: string;
  onSelect: (id: string) => void;
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
              რუკა #{group.calculations.length - index} · {TYPE_LABEL[calculation.type] ?? calculation.type} · {formatDate(calculation.createdAt)}
              {isActive && <span className="ml-2 text-[10px] uppercase tracking-wide">მიმდინარე</span>}
            </button>
          );
        })}
      </div>
    </details>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink p-5 shadow-2xl">{children}</div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [data, setData] = useState<ManagementData | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draft, setDraft] = useState<CalculationDraft>(EMPTY_DRAFT);
  const [emailDraft, setEmailDraft] = useState("");
  const [roleDraft, setRoleDraft] = useState("USER");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ManagementFilters>(EMPTY_FILTERS);
  const [selectedDeletedUsers, setSelectedDeletedUsers] = useState<string[]>([]);
  const [selectedDeletedCalculations, setSelectedDeletedCalculations] = useState<string[]>([]);
  const [selectedGuestCalculations, setSelectedGuestCalculations] = useState<Record<string, string>>({});
  const [viewingCalculation, setViewingCalculation] = useState<CalculationViewData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/management", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `სერვერის შეცდომა (${res.status})`);
      setData(body);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "მონაცემების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function action(url: string, options: RequestInit = {}, clearSelection?: "users" | "calculations") {
    setError(null);
    setMessage(null);
    if (options.method === "PATCH" && url.includes("/api/admin/management/user/") && typeof options.body === "string") {
      const body = JSON.parse(options.body) as Record<string, unknown>;
      options = { ...options, body: JSON.stringify({ ...body, role: roleDraft }) };
    }
    try {
      const res = await fetch(url, options);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `სერვერის შეცდომა (${res.status})`);
      if (body.selfDeleted) {
        window.location.href = "/cabinet";
        return;
      }
      setMessage(body.message || "ოპერაცია შესრულდა");
      setModal(null);
      if (clearSelection === "users") setSelectedDeletedUsers([]);
      if (clearSelection === "calculations") setSelectedDeletedCalculations([]);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ოპერაცია ვერ შესრულდა");
    }
  }

  function openEditUser(user: ManagedUser) {
    setEmailDraft(user.email);
    setRoleDraft(user.role);
    setModal({ kind: "edit-user", user });
  }

  function openEditCalculation(calculation: CalculationData) {
    setDraft(draftFromCalculation(calculation));
    setModal({ kind: "edit-calculation", calculation });
  }

  async function openCalculationView(calculation: CalculationData) {
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

  function updateDraft<K extends keyof CalculationDraft>(key: K, nextValue: CalculationDraft[K]) {
    setDraft((current) => ({ ...current, [key]: nextValue }));
  }

  function toggleSelected(list: string[], id: string, setter: (next: string[]) => void) {
    setter(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  const button = "rounded-full border border-brass/60 px-3 py-1.5 text-xs text-brass-2 hover:bg-brass/10 disabled:opacity-40";
  const dangerButton = "rounded-full border border-ember px-3 py-1.5 text-xs text-ember hover:bg-ember/10";
  const input = "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-parchment outline-none focus:border-brass";
  const includes = (values: Array<string | null | undefined>, query: string) => {
    if (!query.trim()) return true;
    const normalizedQuery = query.trim().toLocaleLowerCase("ka-GE");
    return values.some((item) => item?.toLocaleLowerCase("ka-GE").includes(normalizedQuery));
  };

  const matchesCalculation = (calculation: CalculationData, emailValues: Array<string | null | undefined> = [], dateOverride?: string) => {
    const createdDate = (dateOverride ?? calculation.createdAt).slice(0, 10);
    return (
      (!filters.createdFrom || createdDate >= filters.createdFrom) &&
      (!filters.createdTo || createdDate <= filters.createdTo) &&
      (filters.type === "ALL" || calculation.type === filters.type) &&
      includes(emailValues, filters.email) &&
      includes([calculation.publicId], filters.publicId) &&
      includes([calculation.name1, calculation.name2], filters.name) &&
      includes([calculation.date1, calculation.date2], filters.birthDate) &&
      includes([calculation.time1, calculation.time2], filters.time) &&
      includes([calculation.place1, calculation.place2], filters.place)
    );
  };

  const filteredData = useMemo(() => {
    if (!data) return null;
    const hasCalculationFilters = Boolean(filters.createdFrom || filters.createdTo || filters.type !== "ALL" || filters.name || filters.birthDate || filters.time || filters.place);
    const users = data.users
      .map((user) => ({
        ...user,
        calculations: hasCalculationFilters
          ? user.calculations.filter((calculation) => matchesCalculation(calculation, [user.email]))
          : user.calculations,
      }))
      .filter((user) => (user.adminId !== "ADMIN" || user.calculations.length > 0) && includes([user.email], filters.email) && includes([user.publicId, user.adminId], filters.publicId) && (!hasCalculationFilters || user.calculations.length > 0));

    return {
      users,
      guestCalculations: data.guestCalculations.filter((calculation) => matchesCalculation(calculation)),
      guestCalculationGroups: data.guestCalculationGroups
        .map((group) => ({
          ...group,
          calculations: group.calculations.filter((calculation) => matchesCalculation(calculation)),
        }))
        .filter((group) => group.calculations.length > 0),
      deletedUsers: data.deletedUsers.filter((user) => {
        if (!includes([user.email], filters.email) || !includes([user.publicId, user.adminId], filters.publicId)) return false;
        if (filters.createdFrom && user.deletedAt.slice(0, 10) < filters.createdFrom) return false;
        if (filters.createdTo && user.deletedAt.slice(0, 10) > filters.createdTo) return false;
        if (filters.type !== "ALL" || filters.name || filters.birthDate || filters.time || filters.place) {
          return user.calculations.some((calculation) => matchesCalculation(calculation, [user.email]));
        }
        return true;
      }),
      deletedCalculations: data.deletedCalculations.filter((calculation) => {
        const ownerAdminId = calculation.data.userId
          ? data.users.find((user) => user.id === calculation.data.userId)?.adminId ?? data.deletedUsers.find((user) => user.id === calculation.data.userId)?.adminId
          : null;
        return matchesCalculation(calculation.data, [calculation.userEmail, calculation.data.userId, ownerAdminId]);
      }),
    };
  }, [data, filters]);

  const onlyDeletedUsers = filters.deletedUsers === "ONLY";
  const onlyDeletedCalculations = filters.deletedCalculations === "ONLY";
  const showingActiveRecords = !onlyDeletedUsers && !onlyDeletedCalculations;
  const showRegistered = showingActiveRecords && (filters.status === "ALL" || filters.status === "REGISTERED");
  const showUnregistered = showingActiveRecords && (filters.status === "ALL" || filters.status === "UNREGISTERED");
  const showDeletedUsers = onlyDeletedUsers || (!onlyDeletedCalculations && filters.status === "ALL");
  const showDeletedCalculations = onlyDeletedCalculations || (!onlyDeletedUsers && filters.status === "ALL");
  const registeredCount = filteredData?.users.length ?? 0;
  const unregisteredCount = filteredData?.guestCalculationGroups.length ?? 0;
  const deletedUsersCount = filteredData?.deletedUsers.length ?? 0;
  const deletedCalculationsCount = filteredData?.deletedCalculations.length ?? 0;

  useEffect(() => {
    setSelectedDeletedUsers((current) => current.filter((id) => filteredData?.deletedUsers.some((user) => user.id === id)));
    setSelectedDeletedCalculations((current) => current.filter((id) => filteredData?.deletedCalculations.some((calculation) => calculation.id === id)));
    setSelectedGuestCalculations((current) => Object.fromEntries(Object.entries(current).filter(([groupId, calculationId]) => filteredData?.guestCalculationGroups.some((group) => group.id === groupId && group.calculations.some((calculation) => calculation.id === calculationId)))));
  }, [filteredData]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/40 pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-[0_0_18px_rgba(245,158,11,0.65)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] hover:scale-[1.01] cursor-default">
            👥 მომხმარებლების მართვა
          </h1>
          <p className="mt-1 text-xs text-parchment-dim">რედაქტირება, წაშლა და ურნებიდან აღდგენა</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#deleted-users-section"
            onClick={(e) => {
              e.preventDefault();
              if (!showDeletedUsers) {
                setFilters((current) => ({ ...current, status: "ALL", deletedUsers: "ONLY" }));
              }
              setTimeout(() => {
                document.getElementById("deleted-users-section")?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
            className="group flex items-center gap-2 rounded-2xl border-2 border-rose-500/80 bg-gradient-to-r from-slate-950 via-rose-950/60 to-slate-950 px-4 py-2 text-xs sm:text-sm font-black text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.45)] ring-1 ring-rose-500/30 transition-all duration-300 hover:scale-105 hover:border-rose-300 hover:bg-gradient-to-r hover:from-rose-900 hover:via-pink-900 hover:to-red-900 hover:text-white hover:shadow-[0_0_32px_rgba(244,63,94,0.85)] active:scale-95 cursor-pointer"
          >
            <span className="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-red-300 group-hover:text-white">
              🗑️ ურნა - წაშლილი ანგარიშები ↓
            </span>
          </a>

          <a
            href="#deleted-calculations-section"
            onClick={(e) => {
              e.preventDefault();
              if (!showDeletedCalculations) {
                setFilters((current) => ({ ...current, status: "ALL", deletedCalculations: "ONLY" }));
              }
              setTimeout(() => {
                document.getElementById("deleted-calculations-section")?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
            className="group flex items-center gap-2 rounded-2xl border-2 border-purple-400/80 bg-gradient-to-r from-slate-950 via-purple-950/60 to-slate-950 px-4 py-2 text-xs sm:text-sm font-black text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.45)] ring-1 ring-purple-400/30 transition-all duration-300 hover:scale-105 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-900 hover:via-indigo-900 hover:to-violet-900 hover:text-white hover:shadow-[0_0_32px_rgba(168,85,247,0.85)] active:scale-95 cursor-pointer"
          >
            <span className="tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-200 to-indigo-300 group-hover:text-white">
              🗑️ ურნა - წაშლილი რუკები ↓
            </span>
          </a>

          <a href="/admin" className={button}>ადმინის პანელზე დაბრუნება</a>
        </div>
      </div>

      {message && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-sm text-ember">{error}</p>}
      {loading && <p className="text-parchment-dim">იტვირთება…</p>}

      <section className="rounded-xl border border-line bg-ink-2/50 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-parchment-dim">
            აიდი
            <input value={filters.publicId} onChange={(event) => setFilters((current) => ({ ...current, publicId: event.target.value }))} placeholder="მაგ. R00001 ან 00001" className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            შედგენის თარიღიდან
            <input type="date" value={filters.createdFrom} onChange={(event) => setFilters((current) => ({ ...current, createdFrom: event.target.value }))} className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            შედგენის თარიღამდე
            <input type="date" value={filters.createdTo} onChange={(event) => setFilters((current) => ({ ...current, createdTo: event.target.value }))} className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            რუკის ტიპი
            <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className={input}>
              <option value="ALL">ყველა ტიპი</option>
              <option value="NATAL">ნატალური</option>
              <option value="SYNASTRY">სინასტრიული</option>
              <option value="TRANSIT">ტრანზიტული</option>
            </select>
          </label>
          <label className="text-xs text-parchment-dim">
            ჩანაწერის სტატუსი
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as UserStatusFilter, deletedUsers: "ALL", deletedCalculations: "ALL" }))} className={input}>
              <option value="ALL">ყველა</option>
              <option value="REGISTERED">რეგისტრირებული</option>
              <option value="UNREGISTERED">დაურეგისტრირებელი</option>
            </select>
          </label>
          <label className="text-xs text-parchment-dim">
            მეილი
            <input value={filters.email} onChange={(event) => setFilters((current) => ({ ...current, email: event.target.value }))} placeholder="მომხმარებლის მეილი" className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            სახელი
            <input value={filters.name} onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))} placeholder="ნებისმიერი პროფილი" className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            დაბადების თარიღი
            <input type="date" value={filters.birthDate} onChange={(event) => setFilters((current) => ({ ...current, birthDate: event.target.value }))} className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            დრო
            <input type="time" value={filters.time} onChange={(event) => setFilters((current) => ({ ...current, time: event.target.value }))} className={input} />
          </label>
          <label className="text-xs text-parchment-dim sm:col-span-2 lg:col-span-4">
            ადგილი
            <input value={filters.place} onChange={(event) => setFilters((current) => ({ ...current, place: event.target.value }))} placeholder="ქალაქი ან ქვეყანა" className={input} />
          </label>
          <label className="text-xs text-parchment-dim">
            წაშლილი ანგარიშები
            <select value={filters.deletedUsers} onChange={(event) => setFilters((current) => ({ ...current, status: "ALL", deletedUsers: event.target.value as DeletedFilter, deletedCalculations: "ALL" }))} className={input}>
              <option value="ALL">ყველა ანგარიში</option>
              <option value="ONLY">მხოლოდ წაშლილი ანგარიშები</option>
            </select>
          </label>
          <label className="text-xs text-parchment-dim">
            წაშლილი რუკები
            <select value={filters.deletedCalculations} onChange={(event) => setFilters((current) => ({ ...current, status: "ALL", deletedUsers: "ALL", deletedCalculations: event.target.value as DeletedFilter }))} className={input}>
              <option value="ALL">ყველა რუკა</option>
              <option value="ONLY">მხოლოდ წაშლილი რუკები</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3 text-xs">
          <span className="text-parchment-dim">
            რეგისტრირებული: {registeredCount} · დაურეგისტრირებელი: {unregisteredCount} · წაშლილი ანგარიშები: {deletedUsersCount} · წაშლილი რუკები: {deletedCalculationsCount}
          </span>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)} className="rounded-full border border-brass/60 px-3 py-1.5 text-brass-2 disabled:cursor-not-allowed disabled:opacity-40">
            ფილტრების გასუფთავება
          </button>
        </div>
      </section>

      {showRegistered && <section>
        <h2 className="font-display mb-3 text-xl text-brass-2">რეგისტრირებული მომხმარებლები</h2>
        <div className="space-y-4">
          {filteredData?.users.length === 0 && <p className="text-xs text-parchment-dim">ამ ფილტრებით რეგისტრირებული მომხმარებელი ვერ მოიძებნა.</p>}
          {filteredData?.users.map((user) => (
            <article key={user.id} className="rounded-xl border border-line bg-ink-2/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
                <div>
                  <p className="mb-1 text-xs font-semibold text-orange-400">ADMIN ID: {user.adminId ?? "—"}</p>
                  <p className="text-xs text-[#55e6e1]">@{user.username ?? "—"}</p>
                  <p className="text-lg font-semibold text-parchment">{user.email} <span className="ml-2 text-sm text-brass-2">{user.publicId ?? "—"}</span></p>
                  <p className="text-xs text-parchment-dim">შეიქმნა: {formatDate(user.createdAt)} · რუკები: {user.calculations.length}</p>
                </div>
                <div className="flex gap-2">
                  <button className={button} onClick={() => openEditUser(user)}>რედაქტირება</button>
                  {user.id !== data?.currentUserId && (user.role !== "ADMIN" || data?.currentUserAdminId === "ADMIN") && (
                    <button className={dangerButton} onClick={() => setModal({ kind: "delete-user", user })}>წაშლა</button>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {user.calculations.length === 0 && <p className="text-xs text-parchment-dim">ამ ანგარიშს გამოთვლილი რუკა არ აქვს.</p>}
                {user.calculations.map((calculation) => (
                  <div key={calculation.id} className="rounded-lg border border-line/60 p-3">
                    <CalculationDetails calculation={calculation} onView={openCalculationView} />
                    <div className="mt-3 flex gap-2">
                      <button className={button} onClick={() => openEditCalculation(calculation)}>რუკის რედაქტირება</button>
                      <button className={dangerButton} onClick={() => setModal({ kind: "delete-calculation", calculation })}>რუკის წაშლა</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>}

      {showUnregistered && <section>
        <h2 className="font-display mb-3 text-xl text-brass-2">დაურეგისტრირებელი მომხმარებლები</h2>
        <div className="space-y-3">
          {filteredData?.guestCalculations.length === 0 && <p className="text-xs text-parchment-dim">ამ ფილტრებით დაურეგისტრირებელი ჩანაწერი ვერ მოიძებნა.</p>}
          {filteredData?.guestCalculationGroups.map((group) => {
            const calculation = group.calculations.find((item) => item.id === selectedGuestCalculations[group.id]) ?? group.calculations[0];
            if (!calculation) return null;
            return (
            <article key={calculation.id} className="rounded-xl border border-red-500/50 bg-red-500/5 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                    </span>
                    <span>დაურეგისტრირებელი</span>
                  </span>
                  <span className="font-medium text-red-400">· აიდი: {calculation.publicId ?? "—"}</span>
                </div>
                <div className="flex gap-2">
                  <button className={button} onClick={() => openEditCalculation(calculation)}>რედაქტირება</button>
                  <button className={dangerButton} onClick={() => setModal({ kind: "delete-calculation", calculation })}>წაშლა</button>
                </div>
              </div>
              <CalculationDetails calculation={calculation} onView={openCalculationView} />
              <GuestCalculationPicker
                group={group}
                activeId={calculation.id}
                onSelect={(id) => setSelectedGuestCalculations((current) => ({ ...current, [group.id]: id }))}
              />
            </article>
            );
          })}
        </div>
      </section>}

      {showDeletedUsers && <section id="deleted-users-section" className="scroll-mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-300 to-red-400 drop-shadow-[0_0_18px_rgba(244,63,94,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(244,63,94,0.95)] hover:scale-[1.01] cursor-default">
            🗑️ ურნა — წაშლილი ანგარიშები
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-parchment-dim">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-brass"
                checked={Boolean(filteredData?.deletedUsers.length) && selectedDeletedUsers.length === filteredData?.deletedUsers.length}
                onChange={(event) => setSelectedDeletedUsers(event.target.checked ? (filteredData?.deletedUsers.map((user) => user.id) ?? []) : [])}
              />
              ყველას მონიშვნა
            </label>
            <button type="button" className={dangerButton} disabled={selectedDeletedUsers.length === 0} onClick={() => setModal({ kind: "permanent-delete-users" })}>
              სამუდამოდ წაშლა
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {filteredData?.deletedUsers.length === 0 && <p className="text-xs text-parchment-dim">ამ ფილტრებით წაშლილი ანგარიში ვერ მოიძებნა.</p>}
          {filteredData?.deletedUsers.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-2/40 p-4">
              <div className="flex items-start gap-3 text-sm text-parchment-dim">
                <input type="checkbox" aria-label={`${user.email} მონიშვნა`} className="mt-1 h-4 w-4 cursor-pointer accent-brass" checked={selectedDeletedUsers.includes(user.id)} onChange={() => toggleSelected(selectedDeletedUsers, user.id, setSelectedDeletedUsers)} />
                <div>
                <p className="mb-1 text-xs font-semibold text-orange-400">ADMIN ID: {user.adminId ?? "—"}</p>
                <p className="text-xs text-[#55e6e1]">@{user.username ?? "—"}</p>
                <p className="text-parchment flex flex-wrap items-center gap-2">
                  <span>{user.email} <span className="text-xs">({user.role})</span></span>
                  <span className="text-xs text-brass-2">აიდი: {user.publicId ?? "—"}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                    </span>
                    <span>რეგისტრირებული</span>
                  </span>
                </p>
                <p>წაშლილია: {formatDate(user.deletedAt)} · რუკები: {user.calculationCount}</p>
                </div>
              </div>
              <button className={button} onClick={() => action(`/api/admin/management/trash/user/${user.id}`, { method: "POST" })}>აღდგენა</button>
            </div>
          ))}
        </div>
      </section>}

      {showDeletedCalculations && <section id="deleted-calculations-section" className="scroll-mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-violet-300 to-indigo-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.95)] hover:scale-[1.01] cursor-default">
            🗑️ ურნა — წაშლილი რუკები
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-parchment-dim">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-brass"
                checked={Boolean(filteredData?.deletedCalculations.length) && selectedDeletedCalculations.length === filteredData?.deletedCalculations.length}
                onChange={(event) => setSelectedDeletedCalculations(event.target.checked ? (filteredData?.deletedCalculations.map((calculation) => calculation.id) ?? []) : [])}
              />
              ყველას მონიშვნა
            </label>
            <button type="button" className={dangerButton} disabled={selectedDeletedCalculations.length === 0} onClick={() => setModal({ kind: "permanent-delete-calculations" })}>
              სამუდამოდ წაშლა
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {filteredData?.deletedCalculations.length === 0 && <p className="text-xs text-parchment-dim">ამ ფილტრებით წაშლილი რუკა ვერ მოიძებნა.</p>}
          {filteredData?.deletedCalculations.map((calculation) => (
            <div key={calculation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-2/40 p-4">
              <div className="flex items-start gap-3 text-sm text-parchment-dim">
                <input type="checkbox" aria-label={`${calculation.summary} მონიშვნა`} className="mt-1 h-4 w-4 cursor-pointer accent-brass" checked={selectedDeletedCalculations.includes(calculation.id)} onChange={() => toggleSelected(selectedDeletedCalculations, calculation.id, setSelectedDeletedCalculations)} />
                <div>
                <p className="text-parchment flex flex-wrap items-center gap-2">
                  <span>{TYPE_LABEL[calculation.type] ?? calculation.type} · აიდი: {calculation.data.publicId ?? "—"}</span>
                  {calculation.data.userId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                      </span>
                      <span>რეგისტრირებული</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                      </span>
                      <span>დაურეგისტრირებელი</span>
                    </span>
                  )}
                </p>
                <p>{calculation.summary} · წაშლილია: {formatDate(calculation.deletedAt)}</p>
                </div>
              </div>
              <button className={button} onClick={() => action(`/api/admin/management/trash/calculation/${calculation.id}`, { method: "POST" })}>აღდგენა</button>
            </div>
          ))}
        </div>
      </section>}

      {modal?.kind === "delete-user" && modal.user && (
        <Modal>
          <h2 className="font-display text-xl text-ember">მომხმარებლის წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ მომხმარებლის წაშლა? ანგარიში და მისი რუკები ურნაში გადავა.</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><p>{modal.user.email}</p><p>რუკების რაოდენობა: {modal.user.calculations.length}</p></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action(`/api/admin/management/user/${modal.user!.id}`, { method: "DELETE" })}>თანხმობა, წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-user" && modal.user && (
        <Modal>
          <h2 className="font-display text-xl text-brass-2">რედაქტირების დაწყება</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ მომხმარებლის მონაცემების რედაქტირება?</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">{modal.user.email}</p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={button} onClick={() => setModal({ kind: "edit-user-form", user: modal.user })}>თანხმობა, გაგრძელება</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-user-form" && modal.user && (
        <Modal>
          <label className="mt-4 block text-xs text-parchment-dim">Role
            <select className={`${input} mt-1`} value={roleDraft} disabled={data?.currentUserAdminId !== "ADMIN" || modal.user.id === data?.currentUserId} onChange={(e) => setRoleDraft(e.target.value)}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <h2 className="font-display text-xl text-brass-2">მომხმარებლის რედაქტირება</h2>
          <label className="mt-4 block text-xs text-parchment-dim">ელფოსტა<input className={`${input} mt-1`} type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} /></label>
          <div className="mt-5 flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "cancel-edit", user: modal.user })}>შეწყვეტა</button><button className={button} onClick={() => setModal({ kind: "save-user", user: modal.user })}>შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "save-user" && modal.user && (
        <Modal>
          <h2 className="font-display text-xl text-brass-2">ცვლილების შენახვა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ მომხმარებლის ცვლილებების შენახვა?</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">{modal.user.email} → {emailDraft}</p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "edit-user-form", user: modal.user })}>უარყოფა</button><button className={button} onClick={() => action(`/api/admin/management/user/${modal.user!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailDraft }) })}>თანხმობა, შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "delete-calculation" && modal.calculation && (
        <Modal>
          <h2 className="font-display text-xl text-ember">რუკის ჩანაწერის წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ მომხმარებლის რუკის ჩანაწერის წაშლა? ის ურნაში გადავა.</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><CalculationDetails calculation={modal.calculation} /></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action(`/api/admin/management/calculation/${modal.calculation!.id}`, { method: "DELETE" })}>თანხმობა, წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-calculation" && modal.calculation && (
        <Modal>
          <h2 className="font-display text-xl text-brass-2">რუკის რედაქტირების დაწყება</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ რუკის ჩანაწერის რედაქტირება?</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><CalculationDetails calculation={modal.calculation} /></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={button} onClick={() => setModal({ kind: "edit-calculation-form", calculation: modal.calculation })}>თანხმობა, გაგრძელება</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-calculation-form" && modal.calculation && (
        <Modal>
          <h2 className="font-display text-xl text-brass-2">რუკის მონაცემების რედაქტირება</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-parchment-dim">ტიპი<select className={`${input} mt-1`} value={draft.type} onChange={(e) => updateDraft("type", e.target.value)}><option value="NATAL">ნატალური</option><option value="SYNASTRY">სინასტრიული</option><option value="TRANSIT">ტრანზიტული</option></select></label>
            <label className="text-xs text-parchment-dim">სახლთა სისტემა<input className={`${input} mt-1`} value={draft.houseSystem} onChange={(e) => updateDraft("houseSystem", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">სახელი 1<input className={`${input} mt-1`} value={draft.name1} onChange={(e) => updateDraft("name1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">დაბადების თარიღი 1<input className={`${input} mt-1`} type="date" value={draft.date1} onChange={(e) => updateDraft("date1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">დრო 1<input className={`${input} mt-1`} type="time" value={draft.time1} onChange={(e) => updateDraft("time1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">ადგილი 1<input className={`${input} mt-1`} value={draft.place1} onChange={(e) => updateDraft("place1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">გრძედი 1<input className={`${input} mt-1`} type="number" step="any" value={draft.lat1} onChange={(e) => updateDraft("lat1", Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">განედი 1<input className={`${input} mt-1`} type="number" step="any" value={draft.lon1} onChange={(e) => updateDraft("lon1", Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">დროის სარტყელი 1<input className={`${input} mt-1`} value={draft.tz1} onChange={(e) => updateDraft("tz1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">სახელი 2<input className={`${input} mt-1`} value={draft.name2 ?? ""} onChange={(e) => updateDraft("name2", e.target.value || null)} /></label>
            <label className="text-xs text-parchment-dim">დაბადების თარიღი 2<input className={`${input} mt-1`} type="date" value={draft.date2 ?? ""} onChange={(e) => updateDraft("date2", e.target.value || null)} /></label>
            <label className="text-xs text-parchment-dim">დრო 2<input className={`${input} mt-1`} type="time" value={draft.time2 ?? ""} onChange={(e) => updateDraft("time2", e.target.value || null)} /></label>
            <label className="text-xs text-parchment-dim">ადგილი 2<input className={`${input} mt-1`} value={draft.place2 ?? ""} onChange={(e) => updateDraft("place2", e.target.value || null)} /></label>
            <label className="text-xs text-parchment-dim">გრძედი 2<input className={`${input} mt-1`} type="number" step="any" value={draft.lat2 ?? ""} onChange={(e) => updateDraft("lat2", e.target.value === "" ? null : Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">განედი 2<input className={`${input} mt-1`} type="number" step="any" value={draft.lon2 ?? ""} onChange={(e) => updateDraft("lon2", e.target.value === "" ? null : Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">დროის სარტყელი 2<input className={`${input} mt-1`} value={draft.tz2 ?? ""} onChange={(e) => updateDraft("tz2", e.target.value || null)} /></label>
            <label className="text-xs text-parchment-dim">ტრანზიტის თარიღი<input className={`${input} mt-1`} type="date" value={draft.transitDate ?? ""} onChange={(e) => updateDraft("transitDate", e.target.value || null)} /></label>
          </div>
          <div className="mt-5 flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "cancel-edit", calculation: modal.calculation })}>შეწყვეტა</button><button className={button} onClick={() => setModal({ kind: "save-calculation", calculation: modal.calculation })}>შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "save-calculation" && modal.calculation && (
        <Modal>
          <h2 className="font-display text-xl text-brass-2">ცვლილების შენახვა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ რუკის ცვლილებების შენახვა?</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><p>{modal.calculation.name1} → {draft.name1}</p><p>{modal.calculation.date1} → {draft.date1}</p><p>{modal.calculation.place1} → {draft.place1}</p></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "edit-calculation-form", calculation: modal.calculation })}>უარყოფა</button><button className={button} onClick={() => action(`/api/admin/management/calculation/${modal.calculation!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) })}>თანხმობა, შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "permanent-delete-users" && (
        <Modal>
          <h2 className="font-display text-xl text-ember">ანგარიშების სამუდამოდ წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ მონიშნული ანგარიშების სამუდამოდ წაშლა? ეს მოქმედება საბოლოოა და მათი აღდგენა ვეღარ მოხდება.</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">მონიშნულია: {selectedDeletedUsers.length} ანგარიში</p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action("/api/admin/management/trash/users/permanent", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedDeletedUsers }) }, "users")}>თანხმობა, სამუდამოდ წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "permanent-delete-calculations" && (
        <Modal>
          <h2 className="font-display text-xl text-ember">რუკების სამუდამოდ წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ მონიშნული რუკების სამუდამოდ წაშლა? ეს მოქმედება საბოლოოა და მათი აღდგენა ვეღარ მოხდება.</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">მონიშნულია: {selectedDeletedCalculations.length} რუკა</p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action("/api/admin/management/trash/calculations/permanent", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedDeletedCalculations }) }, "calculations")}>თანხმობა, სამუდამოდ წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "cancel-edit" && (
        <Modal>
          <h2 className="font-display text-xl text-ember">რედაქტირების შეწყვეტა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ შეწყვეტა? შეყვანილი ცვლილებები დაიკარგება.</p>
          <div className="mt-5 flex justify-end gap-3"><button className={button} onClick={() => setModal(modal.calculation ? { kind: "edit-calculation-form", calculation: modal.calculation } : { kind: "edit-user-form", user: modal.user })}>გაგრძელება</button><button className={dangerButton} onClick={() => setModal(null)}>დიახ, შეწყვეტა</button></div>
        </Modal>
      )}

      {viewLoading && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 text-sm text-slate-200">იტვირთება...</div>}
      {viewingCalculation && <AdminCalculationViewer calculation={viewingCalculation} onClose={() => setViewingCalculation(null)} />}
    </div>
  );
}
