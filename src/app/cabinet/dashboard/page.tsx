"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterpretationText from "@/components/InterpretationText";
import ChartExportButton from "@/components/ChartExportButton";
import ChartMapSection from "@/components/ChartMapSection";
import type { WheelFixedStar, WheelPlanet } from "@/components/ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import ElementBalanceGuide from "@/components/ElementBalanceGuide";
import { X, Trash2, Eye, Compass, User, Clock, Calendar, Sparkles } from "lucide-react";
import { readApiResponse } from "@/lib/apiResponse";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";

interface AccountSummary {
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
  expiresAt: string | null;
}

interface ChartSummary {
  id: string;
  mapNumber: string | null;
  type: "NATAL" | "SYNASTRY" | "TRANSIT";
  label: string;
  name1: string;
  name2: string | null;
  date1: string;
  transitDate: string | null;
  createdAt: string;
}

interface WheelResult {
  ascendant: number;
  mc: number;
  houseCusps: number[];
  planets: WheelPlanet[];
  aspects: AspectHit[];
  fixedStars: WheelFixedStar[];
  planetHouses: Record<string, number>;
}

interface SelectedChart {
  id: string;
  mapNumber: string | null;
  label: string;
  type: string;
  name1: string;
  name2: string | null;
  date1: string;
  time1: string;
  place1: string;
  date2: string | null;
  time2: string | null;
  place2: string | null;
  transitDate: string | null;
  houseSystem: string;
  createdAt: string;
  interpretation: string;
  lastViewedAt: string | null;
  result?: WheelResult;
}

const TYPE_LABEL_KA: Record<string, string> = {
  NATAL: "ნატალური რუკა",
  SYNASTRY: "სინასტრიული რუკა",
  TRANSIT: "ტრანზიტული რუკა",
};

function chartDisplayTitle(type: string, name1: string, name2?: string | null) {
  const names = [name1, name2].filter(Boolean).join(" & ");
  return `${TYPE_LABEL_KA[type] ?? `${type} რუკა`} — ${names || "უსახელო"}`;
}

function wheelFromResult(result: unknown): WheelResult | undefined {
  if (!result || typeof result !== "object") return undefined;
  const candidate = result as Record<string, unknown>;
  const source = candidate.ascendant !== undefined
    ? candidate
    : candidate.natalChart && typeof candidate.natalChart === "object"
      ? candidate.natalChart as Record<string, unknown>
      : candidate.chartA && typeof candidate.chartA === "object"
        ? candidate.chartA as Record<string, unknown>
        : null;

  if (
    !source ||
    typeof source.ascendant !== "number" ||
    !Array.isArray(source.planets) ||
    !Array.isArray(source.houseCusps)
  ) {
    return undefined;
  }

  return {
    ascendant: source.ascendant,
    mc: typeof source.mc === "number" ? source.mc : 0,
    houseCusps: source.houseCusps as number[],
    planets: source.planets as WheelPlanet[],
    aspects: Array.isArray(source.aspects) ? source.aspects as AspectHit[] : [],
    fixedStars: source.advanced && typeof source.advanced === "object" && Array.isArray((source.advanced as Record<string, unknown>).fixedStarContacts)
      ? (source.advanced as Record<string, unknown>).fixedStarContacts as WheelFixedStar[]
      : [],
    planetHouses: source.planetHouses && typeof source.planetHouses === "object" ? source.planetHouses as Record<string, number> : {},
  };
}

function formatRemaining(seconds: number) {
  if (seconds <= 0) return "სესია დასრულდა";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${days} დღე ${String(hours).padStart(2, "0")} სთ ${String(minutes).padStart(2, "0")} წთ ${String(secs).padStart(2, "0")} წმ`;
}

function SessionCountdown({ expiresAt, onExpired }: { expiresAt: string | null; onExpired: () => void }) {
  const calculate = () => expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0;
  const [remaining, setRemaining] = useState(calculate);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const next = calculate();
      setRemaining(next);
      if (next === 0) onExpired();
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, onExpired]);

  return <span>{expiresAt ? formatRemaining(remaining) : "—"}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [charts, setCharts] = useState<ChartSummary[] | null>(null);
  const [selected, setSelected] = useState<SelectedChart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingChart, setLoadingChart] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChartSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selected) return;

    const previousOverflow = document.body.style.overflow;
    document.documentElement.classList.add("chart-reader-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.classList.remove("chart-reader-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const handleSessionExpired = useCallback(() => {
    router.replace("/cabinet");
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        const data = await readApiResponse<{ user?: AccountSummary }>(res);
        if (!res.ok || !data.user) {
          router.replace("/cabinet");
          return;
        }
        if (active) setAccount(data.user);
      })
      .catch(() => {
        if (active) router.replace("/cabinet");
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/charts", { cache: "no-store" }).then(async (res) => {
      const data = await readApiResponse<{ charts?: ChartSummary[]; error?: string }>(res);
      if (res.status === 401) {
        router.push("/cabinet");
        return;
      }
      if (!res.ok) {
        if (active) setError(data.error || "რუკების ჩატვირთვა ვერ მოხერხდა");
        return;
      }
      if (active) setCharts(data.charts ?? []);
    }).catch(() => {
      if (active) setError("რუკების ჩატვირთვა ვერ მოხერხდა");
    });
    return () => { active = false; };
  }, [router]);

  async function openChart(id: string) {
    setLoadingChart(id);
    setError(null);
    try {
      const res = await fetch(`/api/charts/${id}`);
      const data = await readApiResponse<{
        id?: string;
        mapNumber?: string | null;
        label?: string;
        type?: string;
        name1?: string;
        name2?: string | null;
        date1?: string;
        time1?: string;
        place1?: string;
        date2?: string | null;
        time2?: string | null;
        place2?: string | null;
        transitDate?: string | null;
        houseSystem?: string;
        createdAt?: string;
        lastViewedAt?: string | null;
        interpretation?: string | null;
        result?: unknown;
        error?: string;
      }>(res);
      if (!res.ok) {
        setError(data.error || "რუკის ჩატვირთვა ვერ მოხერხდა");
        return;
      }

      setSelected({
        id: data.id ?? id,
        mapNumber: data.mapNumber ?? null,
        label: data.label ?? "რუკა",
        type: data.type ?? "NATAL",
        name1: data.name1 ?? "—",
        name2: data.name2 ?? null,
        date1: data.date1 ?? "—",
        time1: data.time1 ?? "—",
        place1: data.place1 ?? "—",
        date2: data.date2 ?? null,
        time2: data.time2 ?? null,
        place2: data.place2 ?? null,
        transitDate: data.transitDate ?? null,
        houseSystem: data.houseSystem ?? "—",
        createdAt: data.createdAt ?? new Date().toISOString(),
        interpretation: data.interpretation ?? "",
        lastViewedAt: data.lastViewedAt ?? null,
        result: wheelFromResult(data.result),
      });
    } catch {
      setError("სერვერთან კავშირი შეწყდა");
    } finally {
      setLoadingChart(null);
    }
  }

  async function removeChart(id: string): Promise<boolean> {
    setError(null);
    try {
      const response = await fetch(`/api/charts/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "რუკის წაშლა ვერ შესრულდა");
      setCharts((prev) => prev?.filter((c) => c.id !== id) ?? null);
      if (selected?.id === id) {
        setSelected(null);
      }
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "რუკის წაშლა ვერ შესრულდა");
      return false;
    }
  }

  async function confirmRemoveChart() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      if (await removeChart(deleteTarget.id)) setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="cabinet-page mx-auto max-w-5xl space-y-6 w-full max-w-full overflow-x-hidden px-2 sm:px-4 py-4">
      {/* Dashboard Top Navigation & Status Bar */}
      <div className="prism-card flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl p-6 sm:p-8">
        <div>
          <div className="telemetry-badge inline-flex items-center gap-2 mb-2">
            <span className="live-beacon"></span>
            <span className="telemetry-badge-text">პირადი კაბინეტი</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            შენახული <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">ასტროლოგიური რუკები</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300/80">თქვენი პირადი კოსმიური არქივი, გამოთვლები და ანალიტიკა</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold w-full sm:w-auto justify-end">
          <a
            href="/cabinet/settings"
            className="flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-sky-200 transition-all hover:bg-sky-400/20 hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            <Compass className="h-4 w-4 text-sky-400" />
            კაბინეტის მართვა
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-slate-300 transition-all hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-200 cursor-pointer"
          >
            გასვლა
          </button>
        </div>
      </div>

      {account && (
        <div className="prism-card grid gap-4 rounded-3xl p-5 text-xs sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
            <p className="text-slate-400 flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-sky-400" /> სახელი</p>
            <p className="mt-1 font-bold text-white text-sm">{account.name || "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
            <p className="text-slate-400">მეილი</p>
            <p className="mt-1 break-all font-bold text-sky-200 text-sm">{account.email}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
            <p className="text-slate-400">მომხმარებელი</p>
            <p className="mt-1 break-all font-bold text-purple-200 text-sm">{account.username ? `@${account.username}` : "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3.5">
            <p className="text-slate-400 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-purple-400" /> შექმნის დრო</p>
            <p className="mt-1 font-semibold text-slate-200">{new Date(account.createdAt).toLocaleDateString("ka-GE")}</p>
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/[0.06] p-3.5">
            <p className="text-sky-300 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-sky-400" /> სესიის დრო</p>
            <p className="mt-1 font-bold tabular-nums text-sky-200 text-xs">
              <SessionCountdown expiresAt={account.expiresAt} onExpired={handleSessionExpired} />
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300 text-center backdrop-blur-md">
          {error}
        </p>
      )}

      {charts === null && (
        <div className="prism-card rounded-3xl p-12 text-center text-xs font-semibold text-sky-300 flex flex-col items-center justify-center gap-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
          <span>იტვირთება შენახული რუკები…</span>
        </div>
      )}

      {charts?.length === 0 && (
        <div className="prism-card rounded-3xl p-10 text-center space-y-4">
          <Sparkles className="h-10 w-10 text-sky-400/60 mx-auto" />
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            ჯერ არ გაქვთ შენახული რუკები. გადადით <a href="/#calculator" className="font-bold text-sky-300 underline hover:text-sky-200">გამომთვლელზე</a>{" "}
            და დააჭირეთ „შენახვა კაბინეტში".
          </p>
        </div>
      )}

      {/* Grid of Saved Charts */}
      <div className="grid gap-5 sm:grid-cols-2">
        {charts?.map((c) => {
          const isSelected = selected?.id === c.id;
          return (
            <div
              key={c.id}
              className={`prism-card group rounded-3xl p-6 transition-all duration-300 hover:border-sky-400/40 hover:shadow-[0_0_30px_rgba(56,189,248,0.15)] flex flex-col justify-between space-y-4 ${
                isSelected ? "border-sky-400 shadow-[0_0_35px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/50" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-sky-300">
                    {TYPE_LABEL_KA[c.type] ?? c.type}
                  </span>
                  <span className="text-[0.7rem] font-medium text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString("ka-GE")}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[0.7rem] font-bold tracking-wider uppercase text-purple-300 bg-purple-500/10 border border-purple-400/20 px-2 py-0.5 rounded-md">
                    № {c.mapNumber ?? "—"}
                  </span>
                </div>
                <h3 className="font-display mt-2 text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                  {c.label}
                </h3>
                <p className="mt-1 text-xs text-slate-300/80">
                  {c.name1}
                  {c.name2 ? ` & ${c.name2}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelected(null);
                    } else {
                      openChart(c.id);
                    }
                  }}
                  disabled={loadingChart === c.id}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-all cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-bold shadow-[0_0_20px_rgba(56,189,248,0.5)]"
                      : "bg-white/10 text-sky-200 hover:bg-sky-500/20 hover:text-white border border-white/10 hover:border-sky-400/40"
                  }`}
                >
                  <Eye className={`h-4 w-4 ${isSelected ? "text-white" : "text-sky-400"}`} />
                  <span>{loadingChart === c.id ? "იტვირთება..." : "ნახვა"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-rose-300 transition-all hover:bg-rose-500/20 hover:border-rose-400/40 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>წაშლა</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deleteTarget && (
        <div
          className="chart-delete-modal fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="prism-card w-full max-w-md rounded-3xl p-6 border border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.2)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chart-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30" aria-hidden="true">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="delete-chart-title" className="font-display text-lg font-bold text-white">რუკის წაშლა</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">ეს მოქმედება წაშლის შენახულ რუკას თქვენი კაბინეტიდან.</p>
                </div>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="text-slate-400 hover:text-white p-1" aria-label="ფანჯრის დახურვა">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">არჩეული რუკა</span>
              <strong className="mt-1 block truncate text-sm text-white">{deleteTarget.label}</strong>
              <span className="mt-1 block text-xs text-sky-300">№ {deleteTarget.mapNumber ?? "მიუთითებელია"}</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">ნამდვილად გსურთ ამ რუკის წაშლა?</p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10">
                გაუქმება
              </button>
              <button type="button" onClick={confirmRemoveChart} disabled={deleting} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-4 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] hover:brightness-110">
                <Trash2 className="h-4 w-4" />
                {deleting ? "იშლება…" : "დიახ, წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Opened Chart View Modal / Card */}
      {selected && (
        <div id="chart-view" data-chart-export-root="true" className="chart-view-panel fixed inset-0 z-[100] h-[100dvh] min-w-0 overflow-y-auto overscroll-contain bg-[#060813]/95 p-3 sm:p-8 backdrop-blur-2xl transition-all">
          
          {/* Top-Right Close Button */}
          <div className="interpretation-close-row">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="interpretation-close-button pointer-events-auto group"
              title="ფანჯრის დახურვა"
            >
              <span className="interpretation-close-icon"><X className="h-4 w-4" /></span>
              <span className="interpretation-close-label">
                დახურვა
              </span>
            </button>
          </div>

          <div className="max-w-5xl mx-auto space-y-6 pt-12 pb-16">
            {/* Header Row */}
            <div className="flex min-w-0 flex-col items-center gap-2 border-b border-white/10 pb-5 text-center">
              <div className="telemetry-badge inline-flex items-center gap-2">
                <span className="live-beacon"></span>
                <span className="telemetry-badge-text">{TYPE_LABEL_KA[selected.type] ?? selected.type}</span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                {chartDisplayTitle(selected.type, selected.name1, selected.name2)}
              </h2>
              <span className="text-xs font-bold tracking-wider uppercase text-sky-300 bg-sky-500/10 border border-sky-400/25 px-3 py-1 rounded-full">
                რუკის ნომერი: {selected.mapNumber ?? "—"}
              </span>
            </div>

            {/* Full chart input details */}
            <div className="grid min-w-0 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-200 sm:grid-cols-2 sm:p-5 backdrop-blur-md">
              <p><span className="text-slate-400">პირველი პროფილი:</span> <strong className="text-white ml-1">{selected.name1}</strong></p>
              <p><span className="text-slate-400">დაბადება:</span> <strong className="text-sky-300 ml-1">{formatWideDateDisplay(selected.date1)} {selected.time1}</strong></p>
              <p><span className="text-slate-400">ადგილი:</span> <strong className="text-slate-200 ml-1">{selected.place1}</strong></p>
              {selected.name2 && <p><span className="text-slate-400">მეორე პროფილი:</span> <strong className="text-white ml-1">{selected.name2}</strong></p>}
              {selected.date2 && <p><span className="text-slate-400">მეორე დაბადება:</span> <strong className="text-sky-300 ml-1">{formatWideDateDisplay(selected.date2)} {selected.time2 ?? ""}</strong></p>}
              {selected.place2 && <p><span className="text-slate-400">მეორე ადგილი:</span> <strong className="text-slate-200 ml-1">{selected.place2}</strong></p>}
              {selected.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი:</span> <strong className="text-purple-300 ml-1">{formatWideDateDisplay(selected.transitDate)}</strong></p>}
              <p><span className="text-slate-400">სახლთა სისტემა:</span> <strong className="text-slate-200 ml-1">{selected.houseSystem}</strong></p>
              <p><span className="text-slate-400">შედგენის დრო:</span> <span className="text-slate-400 ml-1">{new Date(selected.createdAt).toLocaleString("ka-GE")}</span></p>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-col items-stretch gap-3 bg-white/[0.02] p-3.5 rounded-2xl border border-white/10 sm:flex-row sm:flex-wrap sm:items-center">
              <ChartExportButton className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-5 py-2.5 text-center text-xs sm:w-auto sm:text-sm font-bold text-sky-200 hover:bg-sky-400 hover:text-slate-950 transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.2)]" />
            </div>

            {/* Large Zodiac Chart Wheel Display */}
            {selected.result && (
              <ChartMapSection
                title="ზოდიაქალური წრე"
                className="chart-view-wheel mx-auto my-4 w-full max-w-3xl"
                ascendant={selected.result.ascendant}
                mc={selected.result.mc}
                houseCusps={selected.result.houseCusps}
                planets={selected.result.planets}
                aspects={selected.result.aspects}
                fixedStars={selected.result.fixedStars}
                planetHouses={selected.result.planetHouses}
              />
            )}

            {selected.result && (
              <ElementBalanceGuide
                planets={selected.result.planets}
                ascendant={selected.result.ascendant}
              />
            )}

            {/* Full Interpretation Text Section */}
            <div className="chart-view-interpretation min-w-0 pt-4">
              <h3 className="font-display mb-4 border-b border-white/10 pb-3 text-center text-xl font-bold text-white sm:text-2xl">
                ასტროლოგიური <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">ინტერპრეტაცია & ანალიზი</span>
              </h3>
              {selected.interpretation ? (
                <InterpretationText
                  text={selected.interpretation}
                  viewMetadata={{ mode: "USER", viewedAt: selected.lastViewedAt }}
                />
              ) : (
                <p className="text-sm text-slate-400 text-center py-6">ამ ჩანაწერისთვის ინტერპრეტაცია ვერ მოიძებნა.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
