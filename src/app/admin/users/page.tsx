"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import AdminCalculationViewer, { CalculationViewData } from "@/components/AdminCalculationViewer";
import DateSelect from "@/components/DateSelect";
import TimeSelect from "@/components/TimeSelect";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";

type NullableString = string | null;

interface CalculationData {
  id: string;
  publicId: string | null;
  mapNumber: string | null;
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

type ModalKind = "delete-user" | "edit-user" | "edit-user-form" | "save-user" | "delete-calculation" | "edit-calculation" | "edit-calculation-form" | "save-calculation" | "restore-calculation" | "cancel-edit" | "permanent-delete-users" | "permanent-delete-calculations";
interface ModalState {
  kind: ModalKind;
  user?: ManagedUser;
  calculation?: CalculationData;
  deletedCalculation?: DeletedCalculation;
}

type CalculationDraft = Omit<CalculationData, "id" | "createdAt" | "updatedAt" | "publicId" | "mapNumber" | "saved">;
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
  mapNumber: string;
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
  mapNumber: "",
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
  const { id, createdAt, updatedAt, publicId, mapNumber, saved, ...draft } = calculation;
  return draft;
}

function CalculationDetails({ calculation, onView }: { calculation: CalculationData; onView?: (calculation: CalculationData) => void }) {
  return (
    <div>
      <p className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${calculation.saved ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-300" : "border-amber-400/50 bg-amber-500/10 text-amber-300"}`}>
        {calculation.saved ? "მონაცემები შენახულია" : "შენახვის გარეშე"}
      </p>
      {calculation.updatedAt && <p className="mb-3 text-xs text-parchment-dim/70">განახლებული: {formatDate(calculation.updatedAt)}</p>}
      {onView && <button type="button" onClick={() => onView(calculation)} className="admin-control-button admin-control-button-secondary mb-3 rounded-full border border-slate-400/70 bg-slate-500/10 px-4 py-1.5 text-xs font-bold text-slate-200 shadow-[0_0_14px_rgba(148,163,184,0.18)] transition hover:border-slate-200 hover:bg-slate-400/20">რუკის ნახვა</button>}
      <div className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
      <p><span className="text-parchment-dim">რუკის ნომერი:</span> <strong className="text-amber-300">{value(calculation.mapNumber)}</strong></p>
      <p><span className="text-parchment-dim">ტიპი:</span> {TYPE_LABEL[calculation.type] ?? calculation.type}</p>
      <p><span className="text-parchment-dim">შედგენის დრო:</span> {formatDate(calculation.createdAt)}</p>
      <p><span className="text-parchment-dim">სახელი 1:</span> {calculation.name1}</p>
      <p><span className="text-parchment-dim">დაბადება 1:</span> {formatWideDateDisplay(calculation.date1)} {calculation.time1}</p>
      <p><span className="text-parchment-dim">ადგილი 1:</span> {calculation.place1}</p>
      <p><span className="text-parchment-dim">კოორდინატები 1:</span> {calculation.lat1}, {calculation.lon1}</p>
      <p><span className="text-parchment-dim">დროის სარტყელი 1:</span> {calculation.tz1}</p>
      {calculation.name2 && <p><span className="text-parchment-dim">სახელი 2:</span> {calculation.name2}</p>}
      {calculation.date2 && <p><span className="text-parchment-dim">დაბადება 2:</span> {formatWideDateDisplay(calculation.date2)} {value(calculation.time2)}</p>}
      {calculation.place2 && <p><span className="text-parchment-dim">ადგილი 2:</span> {calculation.place2}</p>}
      {calculation.lat2 !== null && <p><span className="text-parchment-dim">კოორდინატები 2:</span> {calculation.lat2}, {value(calculation.lon2)}</p>}
      {calculation.tz2 && <p><span className="text-parchment-dim">დროის სარტყელი 2:</span> {calculation.tz2}</p>}
      <p><span className="text-parchment-dim">სახლთა სისტემა:</span> {calculation.houseSystem}</p>
      {calculation.transitDate && <p><span className="text-parchment-dim">ტრანზიტის თარიღი:</span> {formatWideDateDisplay(calculation.transitDate)}</p>}
      </div>
    </div>
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

function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-ink p-5 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="sticky top-1 right-1 z-50 float-right mb-2 group inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-gradient-to-r from-slate-900/95 via-[#181c38]/95 to-slate-900/95 px-3.5 py-1.5 text-xs font-bold text-slate-200 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.35)] backdrop-blur-xl transition-all hover:scale-105 hover:border-violet-300/70 hover:text-white hover:shadow-[0_0_24px_rgba(129,140,248,0.55)] active:scale-95 cursor-pointer"
            title="დახურვა"
          >
            <X className="h-3.5 w-3.5 text-violet-300 group-hover:text-white transition-colors shrink-0" />
            <span className="font-bold tracking-wider text-slate-200 group-hover:text-white transition-colors">დახურვა</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [data, setData] = useState<ManagementData | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draft, setDraft] = useState<CalculationDraft>(EMPTY_DRAFT);
  const [nameDraft, setNameDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
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
      const body = await res.json().catch(() => ({}));
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
    setNameDraft(user.name ?? "");
    setUsernameDraft(user.username ?? "");
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

  async function openDeletedCalculationView(deletedCalculation: DeletedCalculation) {
    setViewLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/management/trash/calculation/${deletedCalculation.id}`, { cache: "no-store" });
      const rawBody = await response.text();
      let body: { error?: string; result?: unknown; interpretation?: string | null } = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        body = {};
      }
      if (!response.ok) throw new Error(body.error || `ბѓ бѓЈбѓ™бѓбѓЎ бѓ’бѓђбѓ®бѓЎбѓњбѓђ бѓ•бѓ”бѓ  бѓ›бѓќбѓ®бѓ”бѓ бѓ®бѓ“бѓђ (${response.status})`);
      if (!body.result) throw new Error(body.error || "ბѓ бѓЈбѓ™бѓбѓЎ бѓ›бѓќбѓњбѓђбѓЄбѓ”бѓ›бѓ бѓ•бѓ”бѓ  бѓ›бѓќбѓбѓ«бѓ”бѓ‘бѓњбѓђ");
      setViewingCalculation({ ...deletedCalculation.data, result: body.result, interpretation: body.interpretation ?? null });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ბѓ бѓЈбѓ™бѓбѓЎ бѓ’бѓђбѓ®бѓЎбѓњбѓђ бѓ•бѓ”бѓ  бѓ›бѓќбѓ®бѓ”бѓ бѓ®бѓ“бѓђ");
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

  const button = "admin-control-button rounded-full border border-brass/60 px-3 py-1.5 text-xs text-brass-2 hover:bg-brass/10 disabled:opacity-40";
  const dangerButton = "admin-control-button admin-control-button-danger rounded-full border border-ember px-3 py-1.5 text-xs text-ember hover:bg-ember/10";
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
      includes([calculation.mapNumber], filters.mapNumber) &&
      includes([calculation.name1, calculation.name2], filters.name) &&
      includes([calculation.date1, calculation.date2], filters.birthDate) &&
      includes([calculation.time1, calculation.time2], filters.time) &&
      includes([calculation.place1, calculation.place2], filters.place)
    );
  };

  const filteredData = useMemo(() => {
    if (!data) return null;
    const hasCalculationFilters = Boolean(filters.createdFrom || filters.createdTo || filters.type !== "ALL" || filters.mapNumber || filters.name || filters.birthDate || filters.time || filters.place);
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
        if (filters.type !== "ALL" || filters.mapNumber || filters.name || filters.birthDate || filters.time || filters.place) {
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
  const registeredMapCount = filteredData?.users.reduce((total, user) => total + user.calculations.length, 0) ?? 0;
  const unregisteredMapCount = filteredData?.guestCalculationGroups.reduce((total, group) => total + group.calculations.length, 0) ?? 0;
  const deletedUserMapCount = filteredData?.deletedUsers.reduce((total, user) => total + user.calculationCount, 0) ?? 0;
  const deletedCalculationMapCount = filteredData?.deletedCalculations.length ?? 0;

  useEffect(() => {
    setSelectedDeletedUsers((current) => current.filter((id) => filteredData?.deletedUsers.some((user) => user.id === id)));
    setSelectedDeletedCalculations((current) => current.filter((id) => filteredData?.deletedCalculations.some((calculation) => calculation.id === id)));
    setSelectedGuestCalculations((current) => Object.fromEntries(Object.entries(current).filter(([groupId, calculationId]) => filteredData?.guestCalculationGroups.some((group) => group.id === groupId && group.calculations.some((calculation) => calculation.id === calculationId)))));
  }, [filteredData]);

  return (
    <div className="admin-page space-y-8">
      <div className="admin-page-header flex flex-col items-stretch gap-4 border-b border-line/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
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
            რუკის ნომერი
            <input value={filters.mapNumber} onChange={(event) => setFilters((current) => ({ ...current, mapNumber: event.target.value }))} placeholder="მაგ. Z-00001" className={input} />
          </label>
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
          <label className="text-xs text-parchment-dim sm:col-span-2 lg:col-span-2">
            დაბადების თარიღი
            <div className="mt-1">
              <DateSelect
                value={filters.birthDate}
                onChange={(birthDate) => setFilters((current) => ({ ...current, birthDate }))}
                onDraftChange={(birthDate) => setFilters((current) => ({ ...current, birthDate }))}
              />
            </div>
          </label>
          <label className="text-xs text-parchment-dim sm:col-span-2 lg:col-span-2">
            დრო
            <div className="mt-1">
              <TimeSelect
                value={filters.time}
                onChange={(time) => setFilters((current) => ({ ...current, time }))}
                onDraftChange={(time) => setFilters((current) => ({ ...current, time }))}
              />
            </div>
          </label>
          <label className="text-xs text-parchment-dim sm:col-span-2 lg:col-span-4">
            ადგილი
            <div className="mt-1">
              <PlaceAutocomplete
                value={{ place: filters.place, lat: null, lon: null, timezone: null }}
                onChange={(place) => setFilters((current) => ({ ...current, place: place.place }))}
              />
            </div>
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
            <span className="font-medium">
              <span className="text-emerald-400 font-bold">რეგისტრირებული: {registeredCount}</span> · <span className="text-rose-400 font-bold">დაურეგისტრირებელი: {unregisteredCount}</span> · წაშლილი ანგარიშები: {deletedUsersCount} · წაშლილი რუკები: {deletedCalculationsCount}
            </span>
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)} className="rounded-full border border-brass/60 px-3 py-1.5 text-brass-2 disabled:cursor-not-allowed disabled:opacity-40">
            ფილტრების გასუფთავება
          </button>
        </div>
      </section>

      {showRegistered && <section className="mb-8">
        <details className="admin-collapsible-section group/managed">
          <summary className="admin-collapsible-summary">
        <h2 className="font-display mb-4 text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-green-400 drop-shadow-[0_0_18px_rgba(52,211,153,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(52,211,153,0.95)] hover:scale-[1.01] cursor-default">
          ✅ რეგისტრირებული მომხმარებლები
        </h2>
          <span className="admin-section-total">მომხმარებლები [{registeredCount}] · რუკები სულ [{registeredMapCount}]</span>
          </summary>
        <div className="space-y-4 admin-collapsible-content">
          {filteredData?.users.length === 0 && <p className="text-xs text-parchment-dim">ამ ფილტრებით რეგისტრირებული მომხმარებელი ვერ მოიძებნა.</p>}
          {filteredData?.users.map((user) => {
            const latestCalc = user.calculations[0];
            const mapNum = latestCalc?.mapNumber ?? latestCalc?.publicId ?? user.publicId ?? "—";
            const displayName = latestCalc?.name1 ? `${latestCalc.name1} (${user.name || (user.username ? `@${user.username}` : user.email)})` : (user.name || (user.username ? `@${user.username}` : user.email));
            const calcTime = latestCalc ? formatDate(latestCalc.createdAt) : formatDate(user.createdAt);

            return (
              <details key={user.id} data-map-count={user.calculations.length} className="group rounded-xl border border-line/80 bg-ink-2/60 p-4 transition-all duration-200">
                <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                      </span>
                      <span>რეგისტრირებული</span>
                    </span>

                    <span><strong className="admin-id-label">აიდი:</strong> <span className="admin-id-value-registered">{user.publicId ?? user.adminId ?? "—"}</span></span>
                    <span className="font-semibold text-parchment">👤 {displayName}</span>
                    <span className="text-cyan-300 font-medium">📧 {user.email}</span>
                    <span className="rounded-md border border-purple-400/50 bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-200">
                      🗺️ რუკის #: {mapNum}
                    </span>
                    <span className="text-parchment-dim text-xs">🕒 {calcTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-brass-2 transition-transform duration-200 group-open:rotate-180">▼ ჩამოშლა</span>
                  </div>
                </summary>

                <div className="mt-4 border-t border-line/60 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-orange-400">ADMIN ID: {user.adminId ?? "—"}</p>
                      <p className="text-xs font-bold text-[#55e6e1]">
                        Username: {user.username ? `@${user.username}` : <span className="text-amber-400/80 italic font-normal">არ აქვს მითითებული</span>}
                      </p>
                      <p className="text-lg font-semibold text-parchment">{user.email} <span className="ml-2 text-sm admin-id-value-registered">{user.publicId ?? "—"}</span></p>
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
                    {user.calculations.map((calculation) => {
                      const isCreatedAfterRegistration = new Date(calculation.createdAt).getTime() >= new Date(user.createdAt).getTime();
                      const calcMapNum = calculation.mapNumber ?? calculation.publicId ?? "—";
                      return (
                        <details key={calculation.id} className="group/calc rounded-lg border border-line/60 bg-ink/40 p-3 transition-all duration-200">
                          <summary className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-purple-300">🗺️ #{calcMapNum}</span>
                              <span className="font-semibold text-parchment">👤 {calculation.name1}</span>
                              <span className="text-parchment-dim">({TYPE_LABEL[calculation.type] ?? calculation.type})</span>
                              {isCreatedAfterRegistration ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/60 bg-sky-950/60 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                                  <span>რეგისტრირების შემდეგ</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/60 bg-rose-950/60 px-2 py-0.5 text-[11px] font-bold text-rose-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                  <span>დარეგისტრირებამდე</span>
                                </span>
                              )}
                              <span className="text-parchment-dim text-[11px]">🕒 {formatDate(calculation.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-brass-2 transition-transform duration-200 group-open/calc:rotate-180">▼ ჩამოშლა</span>
                            </div>
                          </summary>

                          <div className="mt-3 border-t border-line/40 pt-3">
                            <CalculationDetails calculation={calculation} onView={openCalculationView} />
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/40 pt-2.5">
                              <div className="flex items-center">
                                {isCreatedAfterRegistration ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/60 bg-sky-950/60 px-3 py-1 text-xs font-bold text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                                    <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                                    <span>რეგისტრირების შემდეგ შექმნილია</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-3 py-1 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                                    <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                                    <span>დარეგისტრირებამდე შექმნილია</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button className={button} onClick={() => openEditCalculation(calculation)}>რუკის რედაქტირება</button>
                                <button className={dangerButton} onClick={() => setModal({ kind: "delete-calculation", calculation })}>რუკის წაშლა</button>
                              </div>
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        </details>
      </section>}

      {showUnregistered && <section className="mb-8">
        <details className="admin-collapsible-section group/managed">
          <summary className="admin-collapsible-summary">
        <h2 className="font-display mb-4 text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-rose-500 drop-shadow-[0_0_18px_rgba(244,63,94,0.6)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(244,63,94,0.95)] hover:scale-[1.01] cursor-default">
          ⚠️ დაურეგისტრირებელი მომხმარებლები
        </h2>
          <span className="admin-section-total">მომხმარებლები [{unregisteredCount}] · რუკები სულ [{unregisteredMapCount}]</span>
          </summary>
        <div className="space-y-3 admin-collapsible-content">
          {filteredData?.guestCalculations.length === 0 && <p className="text-xs text-parchment-dim">ამ ფილტრებით დაურეგისტრირებელი ჩანაწერი ვერ მოიძებნა.</p>}
          {filteredData?.guestCalculationGroups.map((group) => {
            const calculation = group.calculations.find((item) => item.id === selectedGuestCalculations[group.id]) ?? group.calculations[0];
            if (!calculation) return null;
            const mapNum = calculation.mapNumber ?? calculation.publicId ?? group.publicId ?? "—";
            const displayName = calculation.name1 || "—";
            const calcTime = formatDate(calculation.createdAt);

            return (
              <details key={calculation.id} data-map-count={group.calculations.length} className="group rounded-xl border border-red-500/50 bg-red-500/5 p-4 transition-all duration-200">
                <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                      </span>
                      <span>დაურეგისტრირებელი</span>
                    </span>

                    <span><strong className="admin-id-label">აიდი:</strong> <span className="admin-id-value-guest">{calculation.publicId ?? group.publicId ?? "—"}</span></span>
                    <span className="font-semibold text-parchment">👤 {displayName}</span>
                    <span className="text-rose-300/70 italic text-xs">📧 მეილი: არ აქვს</span>
                    <span className="rounded-md border border-purple-400/50 bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-200">
                      🗺️ რუკის #: {mapNum}
                    </span>
                    <span className="text-parchment-dim text-xs">🕒 {calcTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-brass-2 transition-transform duration-200 group-open:rotate-180">▼ ჩამოშლა</span>
                  </div>
                </summary>

                <div className="mt-4 border-t border-red-500/30 pt-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium"><span className="admin-id-label">· აიდი:</span> <span className="admin-id-value-guest">{calculation.publicId ?? "—"}</span></span>
                      {group.ipAddress && <span className="text-xs text-parchment-dim">IP: {group.ipAddress}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button className={button} onClick={() => openEditCalculation(calculation)}>რუკის რედაქტირება</button>
                      <button className={dangerButton} onClick={() => setModal({ kind: "delete-calculation", calculation })}>რუკის წაშლა</button>
                    </div>
                  </div>
                  <CalculationDetails calculation={calculation} onView={openCalculationView} />
                  <GuestCalculationPicker
                    group={group}
                    activeId={calculation.id}
                    onSelect={(id) => setSelectedGuestCalculations((current) => ({ ...current, [group.id]: id }))}
                  />
                </div>
              </details>
            );
          })}
        </div>
        </details>
      </section>}

      {showDeletedUsers && <section id="deleted-users-section" className="scroll-mt-6">
        <details className="admin-trash-section">
          <summary className="admin-trash-summary">
            <span>🗑️ წაშლილი ანგარიშები ({deletedUsersCount}) · რუკები სულ [{deletedUserMapCount}]</span>
            <span className="admin-summary-caret">▾</span>
          </summary>
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
            <details key={user.id} data-map-count={user.calculationCount} className="group rounded-xl border border-line/70 bg-ink-2/40 p-4 transition-all duration-200">
              <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    aria-label={`${user.email} მონიშვნა`}
                    className="h-4 w-4 cursor-pointer accent-brass"
                    checked={selectedDeletedUsers.includes(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelected(selectedDeletedUsers, user.id, setSelectedDeletedUsers)}
                  />
                  <span className="inline-flex rounded-full border border-rose-400/70 bg-rose-950/50 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                    🗑️ წაშლილი ანგარიში
                  </span>
                  <span><strong className="admin-id-label">აიდი:</strong> <span className="admin-id-value-registered">{user.publicId ?? user.adminId ?? "—"}</span></span>
                  <span className="font-semibold text-parchment">👤 {user.name || (user.username ? `@${user.username}` : user.email)}</span>
                  <span className="text-cyan-300 font-medium">📧 {user.email}</span>
                  <span className="rounded-md border border-purple-400/50 bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-200">
                    🗺️ რუკები: {user.calculationCount}
                  </span>
                  <span className="text-parchment-dim text-xs">🕒 წაშლილია: {formatDate(user.deletedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brass-2 transition-transform duration-200 group-open:rotate-180">▼ ჩამოშლა</span>
                </div>
              </summary>

              <div className="mt-4 border-t border-line/60 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 text-sm text-parchment-dim">
                  <p className="text-xs font-semibold text-orange-400">ADMIN ID: {user.adminId ?? "—"}</p>
                  <p className="text-xs font-bold text-[#55e6e1]">
                    Username: {user.username ? `@${user.username}` : <span className="text-amber-400/80 italic font-normal">არ აქვს მითითებული</span>}
                  </p>
                  <p className="text-parchment flex flex-wrap items-center gap-2">
                    <span>{user.email} <span className="text-xs">({user.role})</span></span>
                    <span className="text-xs"><strong className="admin-id-label">აიდი:</strong> <span className="admin-id-value-registered">{user.publicId ?? "—"}</span></span>
                  </p>
                  <p className="text-xs">შეიქმნა: {formatDate(user.originalCreatedAt)} · წაშლილია: {formatDate(user.deletedAt)} · რუკები: {user.calculationCount}</p>
                </div>
                <div>
                  {user.role === "ADMIN" && user.adminId === "ADMIN" ? (
                    <span className="rounded-full border border-amber-400/40 px-4 py-2 text-xs font-semibold text-amber-300">მთავარი კაბინეტი ვერ აღდგება</span>
                  ) : (
                    <button className={button} onClick={() => action(`/api/admin/management/trash/user/${user.id}`, { method: "POST" })}>აღდგენა</button>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>
        </details>
      </section>}

      {showDeletedCalculations && <section id="deleted-calculations-section" className="scroll-mt-6">
        <details className="admin-trash-section">
          <summary className="admin-trash-summary">
            <span>🗑️ წაშლილი რუკები ({deletedCalculationsCount}) · რუკები სულ [{deletedCalculationMapCount}]</span>
            <span className="admin-summary-caret">▾</span>
          </summary>
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
            <details key={calculation.id} data-map-count="1" className="group rounded-xl border border-line/70 bg-ink-2/40 p-4 transition-all duration-200">
              <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    aria-label={`${calculation.summary} მონიშვნა`}
                    className="h-4 w-4 cursor-pointer accent-brass"
                    checked={selectedDeletedCalculations.includes(calculation.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelected(selectedDeletedCalculations, calculation.id, setSelectedDeletedCalculations)}
                  />
                  <span className="inline-flex rounded-full border border-rose-400/70 bg-rose-950/50 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                    🗑️ წაშლილი რუკა
                  </span>
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
                  <span className="font-bold text-purple-300">🗺️ #{calculation.data.mapNumber ?? calculation.data.publicId ?? "—"}</span>
                  <span className="font-semibold text-parchment">👤 {calculation.data.name1}</span>
                  <span className="text-cyan-300 font-medium">📧 {calculation.userEmail ?? "დაურეგისტრირებელი"}</span>
                  <span className="text-parchment-dim text-xs">🕒 წაშლილია: {formatDate(calculation.deletedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-brass-2 transition-transform duration-200 group-open:rotate-180">▼ ჩამოშლა</span>
                </div>
              </summary>

              <div className="mt-4 border-t border-line/60 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2 w-full sm:w-auto">
                  <p className="text-xs text-parchment-dim">{calculation.summary} · წაშლილია: {formatDate(calculation.deletedAt)}</p>
                  <CalculationDetails calculation={calculation.data} onView={() => openDeletedCalculationView(calculation)} />
                </div>
                <div className="flex justify-end w-full sm:w-auto mt-2 sm:mt-0">
                  <button className={button} onClick={() => setModal({ kind: "restore-calculation", deletedCalculation: calculation })}>აღდგენა</button>
                </div>
              </div>
            </details>
          ))}
        </div>
        </details>
      </section>}

      {modal?.kind === "delete-user" && modal.user && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-ember">მომხმარებლის წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ მომხმარებლის წაშლა? ანგარიში და მისი რუკები ურნაში გადავა.</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><p>{modal.user.email}</p><p>რუკების რაოდენობა: {modal.user.calculations.length}</p></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action(`/api/admin/management/user/${modal.user!.id}`, { method: "DELETE" })}>თანხმობა, წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-user" && modal.user && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-brass-2">რედაქტირების დაწყება</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ მომხმარებლის მონაცემების რედაქტირება?</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><span>{modal.user.name || "—"}</span><br /><span>@{modal.user.username || "—"}</span><br /><span>{modal.user.email}</span></p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={button} onClick={() => setModal({ kind: "edit-user-form", user: modal.user })}>თანხმობა, გაგრძელება</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-user-form" && modal.user && (
        <Modal onClose={() => setModal(null)}>
          <label className="mt-4 block text-xs text-parchment-dim">Role
            <select className={`${input} mt-1`} value={roleDraft} disabled={data?.currentUserAdminId !== "ADMIN" || modal.user.id === data?.currentUserId} onChange={(e) => setRoleDraft(e.target.value)}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <h2 className="font-display text-xl text-brass-2">მომხმარებლის რედაქტირება</h2>
          <label className="mt-4 block text-xs text-parchment-dim">სახელი<input className={`${input} mt-1`} type="text" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} /></label>
          <label className="mt-4 block text-xs text-parchment-dim">Username<input className={`${input} mt-1`} type="text" value={usernameDraft} onChange={(e) => setUsernameDraft(e.target.value)} placeholder="არ არის მითითებული" autoCapitalize="none" autoCorrect="off" /></label>
          <label className="mt-4 block text-xs text-parchment-dim">ელფოსტა<input className={`${input} mt-1`} type="email" value={emailDraft} onChange={(e) => setEmailDraft(e.target.value)} /></label>
          <div className="mt-5 flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "cancel-edit", user: modal.user })}>შეწყვეტა</button><button className={button} onClick={() => setModal({ kind: "save-user", user: modal.user })}>შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "save-user" && modal.user && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-brass-2">ცვლილების შენახვა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ მომხმარებლის ცვლილებების შენახვა?</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><span>სახელი: {modal.user.name || "—"} → {nameDraft || "—"}</span><br /><span>Username: @{modal.user.username || "—"} → @{usernameDraft || "—"}</span><br /><span>მეილი: {modal.user.email} → {emailDraft}</span></p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "edit-user-form", user: modal.user })}>უარყოფა</button><button className={button} onClick={() => action(`/api/admin/management/user/${modal.user!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nameDraft, username: usernameDraft, email: emailDraft }) })}>თანხმობა, შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "delete-calculation" && modal.calculation && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-ember">რუკის ჩანაწერის წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ მომხმარებლის რუკის ჩანაწერის წაშლა? ის ურნაში გადავა.</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><CalculationDetails calculation={modal.calculation} /></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action(`/api/admin/management/calculation/${modal.calculation!.id}`, { method: "DELETE" })}>თანხმობა, წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "restore-calculation" && modal.deletedCalculation && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-brass-2">რუკის აღდგენის დადასტურება</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ წაშლილი რუკის აღდგენა? თანხმობის შემდეგ ჩანაწერი ურნიდან დაბრუნდება აქტიურ რუკებში.</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">
            <p><span className="text-parchment-dim">რუკის ნომერი:</span> {modal.deletedCalculation.data.mapNumber ?? modal.deletedCalculation.data.publicId ?? "—"}</p>
            <p><span className="text-parchment-dim">სახელი:</span> {modal.deletedCalculation.data.name1}</p>
            <p><span className="text-parchment-dim">ტიპი:</span> {TYPE_LABEL[modal.deletedCalculation.data.type] ?? modal.deletedCalculation.data.type}</p>
          </div>
          <div className="flex justify-end gap-3">
            <button className={button} onClick={() => setModal(null)}>უარყოფა</button>
            <button className={button} onClick={() => action(`/api/admin/management/trash/calculation/${modal.deletedCalculation!.id}`, { method: "POST" }, "calculations")}>თანხმობა, აღდგენა</button>
          </div>
        </Modal>
      )}

      {modal?.kind === "edit-calculation" && modal.calculation && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-brass-2">რუკის რედაქტირების დაწყება</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ ამ რუკის ჩანაწერის რედაქტირება?</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><CalculationDetails calculation={modal.calculation} /></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={button} onClick={() => setModal({ kind: "edit-calculation-form", calculation: modal.calculation })}>თანხმობა, გაგრძელება</button></div>
        </Modal>
      )}

      {modal?.kind === "edit-calculation-form" && modal.calculation && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-brass-2">რუკის მონაცემების რედაქტირება</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-parchment-dim">ტიპი<select className={`${input} mt-1`} value={draft.type} onChange={(e) => updateDraft("type", e.target.value)}><option value="NATAL">ნატალური</option><option value="SYNASTRY">სინასტრიული</option><option value="TRANSIT">ტრანზიტული</option></select></label>
            <label className="text-xs text-parchment-dim">სახლთა სისტემა<input className={`${input} mt-1`} value={draft.houseSystem} onChange={(e) => updateDraft("houseSystem", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">სახელი 1<input className={`${input} mt-1`} value={draft.name1} onChange={(e) => updateDraft("name1", e.target.value)} /></label>
            <div className="text-xs text-parchment-dim"><span className="mb-1 block">დაბადების თარიღი 1</span><DateSelect value={draft.date1} onChange={(next) => updateDraft("date1", next)} onDraftChange={(next) => updateDraft("date1", next)} /></div>
            <div className="text-xs text-parchment-dim"><span className="mb-1 block">დრო 1</span><TimeSelect value={draft.time1} onChange={(next) => updateDraft("time1", next)} onDraftChange={(next) => updateDraft("time1", next)} /></div>
            <label className="text-xs text-parchment-dim">ადგილი 1<input className={`${input} mt-1`} value={draft.place1} onChange={(e) => updateDraft("place1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">განედი 1<input className={`${input} mt-1`} type="number" step="any" value={draft.lat1} onChange={(e) => updateDraft("lat1", Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">გრძედი 1<input className={`${input} mt-1`} type="number" step="any" value={draft.lon1} onChange={(e) => updateDraft("lon1", Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">დროის სარტყელი 1<input className={`${input} mt-1`} value={draft.tz1} onChange={(e) => updateDraft("tz1", e.target.value)} /></label>
            <label className="text-xs text-parchment-dim">სახელი 2<input className={`${input} mt-1`} value={draft.name2 ?? ""} onChange={(e) => updateDraft("name2", e.target.value || null)} /></label>
            <div className="text-xs text-parchment-dim"><span className="mb-1 block">დაბადების თარიღი 2</span><DateSelect value={draft.date2 ?? ""} onChange={(next) => updateDraft("date2", next || null)} onDraftChange={(next) => updateDraft("date2", next || null)} /></div>
            <div className="text-xs text-parchment-dim"><span className="mb-1 block">დრო 2</span><TimeSelect value={draft.time2 ?? ""} onChange={(next) => updateDraft("time2", next || null)} onDraftChange={(next) => updateDraft("time2", next || null)} /></div>
            <label className="text-xs text-parchment-dim">ადგილი 2<input className={`${input} mt-1`} value={draft.place2 ?? ""} onChange={(e) => updateDraft("place2", e.target.value || null)} /></label>
            <label className="text-xs text-parchment-dim">განედი 2<input className={`${input} mt-1`} type="number" step="any" value={draft.lat2 ?? ""} onChange={(e) => updateDraft("lat2", e.target.value === "" ? null : Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">გრძედი 2<input className={`${input} mt-1`} type="number" step="any" value={draft.lon2 ?? ""} onChange={(e) => updateDraft("lon2", e.target.value === "" ? null : Number(e.target.value))} /></label>
            <label className="text-xs text-parchment-dim">დროის სარტყელი 2<input className={`${input} mt-1`} value={draft.tz2 ?? ""} onChange={(e) => updateDraft("tz2", e.target.value || null)} /></label>
            <div className="text-xs text-parchment-dim"><span className="mb-1 block">ტრანზიტის თარიღი</span><DateSelect value={draft.transitDate ?? ""} onChange={(next) => updateDraft("transitDate", next || null)} onDraftChange={(next) => updateDraft("transitDate", next || null)} /></div>
          </div>
          <div className="mt-5 flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "cancel-edit", calculation: modal.calculation })}>შეწყვეტა</button><button className={button} onClick={() => setModal({ kind: "save-calculation", calculation: modal.calculation })}>შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "save-calculation" && modal.calculation && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-brass-2">ცვლილების შენახვა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ რუკის ცვლილებების შენახვა?</p>
          <div className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim"><p>{modal.calculation.name1} → {draft.name1}</p><p>{formatWideDateDisplay(modal.calculation.date1)} → {formatWideDateDisplay(draft.date1)}</p><p>{modal.calculation.place1} → {draft.place1}</p></div>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal({ kind: "edit-calculation-form", calculation: modal.calculation })}>უარყოფა</button><button className={button} onClick={() => action(`/api/admin/management/calculation/${modal.calculation!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) })}>თანხმობა, შენახვა</button></div>
        </Modal>
      )}

      {modal?.kind === "permanent-delete-users" && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-ember">ანგარიშების სამუდამოდ წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ მონიშნული ანგარიშების სამუდამოდ წაშლა? ეს მოქმედება საბოლოოა და მათი აღდგენა ვეღარ მოხდება.</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">მონიშნულია: {selectedDeletedUsers.length} ანგარიში</p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action("/api/admin/management/trash/users/permanent", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedDeletedUsers }) }, "users")}>თანხმობა, სამუდამოდ წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "permanent-delete-calculations" && (
        <Modal onClose={() => setModal(null)}>
          <h2 className="font-display text-xl text-ember">რუკების სამუდამოდ წაშლა</h2>
          <p className="mt-2 text-sm text-parchment-dim">ნამდვილად გსურთ მონიშნული რუკების სამუდამოდ წაშლა? ეს მოქმედება საბოლოოა და მათი აღდგენა ვეღარ მოხდება.</p>
          <p className="my-4 rounded-lg bg-ink-2/70 p-4 text-sm text-parchment-dim">მონიშნულია: {selectedDeletedCalculations.length} რუკა</p>
          <div className="flex justify-end gap-3"><button className={button} onClick={() => setModal(null)}>უარყოფა</button><button className={dangerButton} onClick={() => action("/api/admin/management/trash/calculations/permanent", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedDeletedCalculations }) }, "calculations")}>თანხმობა, სამუდამოდ წაშლა</button></div>
        </Modal>
      )}

      {modal?.kind === "cancel-edit" && (
        <Modal onClose={() => setModal(null)}>
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
