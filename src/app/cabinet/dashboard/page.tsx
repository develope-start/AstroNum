"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterpretationText from "@/components/InterpretationText";
import ChartMapSection from "@/components/ChartMapSection";
import type { WheelFixedStar, WheelPlanet } from "@/components/ChartWheel";
import type { AspectHit } from "@/lib/astro/aspects";
import ElementBalanceGuide from "@/components/ElementBalanceGuide";
import { Copy, Check, X, Trash2, Eye } from "lucide-react";
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingChart, setLoadingChart] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChartSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selected) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
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
      setCopied(false);
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

  function handleCopy() {
    if (!selected) return;
    navigator.clipboard.writeText(`${selected.label}\n\n${selected.interpretation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="cabinet-page mx-auto max-w-5xl space-y-6 w-full max-w-full overflow-x-hidden px-1">
      {/* Dashboard Top Navigation & Status Bar */}
      <div className="glass-panel flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-amber-500/25 bg-gradient-to-r from-[#130a35]/90 via-[#0e0728]/95 to-[#130a35]/90 backdrop-blur-2xl shadow-xl">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            ჩემი შენახული რუკები
          </h1>
          <p className="mt-1 text-xs text-slate-300">თქვენი პირადი ასტროლოგიური არქივი და გამოთვლები</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold w-full sm:w-auto justify-end">
          <a
            href="/cabinet/settings"
            className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-amber-300 transition-all hover:bg-amber-400/20"
          >
            კაბინეტის მართვა
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-950/50 px-4 py-2 text-purple-300 transition-all hover:bg-purple-900/50 cursor-pointer"
          >
            გასვლა
          </button>
        </div>
      </div>

      {account && (
        <div className="glass-panel grid gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-950/20 p-4 text-xs sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-slate-400">სახელი</p>
            <p className="mt-1 font-bold text-emerald-200">{account.name || "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">მეილი</p>
            <p className="mt-1 break-all font-bold text-emerald-200">{account.email}</p>
          </div>
          <div>
            <p className="text-slate-400">Username</p>
            <p className="mt-1 break-all font-bold text-emerald-200">{account.username ? `@${account.username}` : "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">კაბინეტის შექმნის დრო</p>
            <p className="mt-1 font-bold text-emerald-200">{new Date(account.createdAt).toLocaleString("ka-GE")}</p>
          </div>
          <div>
            <p className="text-slate-400">ბოლო შესვლის სესიის დარჩენილი დრო</p>
            <p className="mt-1 font-bold tabular-nums text-amber-300">
              <SessionCountdown expiresAt={account.expiresAt} onExpired={handleSessionExpired} />
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300 text-center">
          {error}
        </p>
      )}

      {charts === null && (
        <div className="glass-panel rounded-2xl p-8 text-center text-xs font-semibold text-amber-300">
          იტვირთება შენახული რუკები…
        </div>
      )}

      {charts?.length === 0 && (
        <div className="glass-panel rounded-2xl sm:rounded-[28px] p-8 text-center space-y-3 border-amber-500/25 bg-[#120833]/90">
          <p className="text-sm text-slate-300">
            ჯერ არაფერი შენახულა. გადადით <a href="/#calculator" className="font-bold text-amber-300 underline decoration-amber-400/50">გამომთვლელზე</a>{" "}
            და დააჭირეთ „შენახვა კაბინეტში".
          </p>
        </div>
      )}

      {/* Grid of Saved Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        {charts?.map((c) => {
          const isSelected = selected?.id === c.id;
          return (
            <div
              key={c.id}
              className={`glass-panel group rounded-2xl p-5 border-amber-500/25 bg-gradient-to-b from-[#130a35]/85 to-[#080417]/95 transition-all hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col justify-between space-y-3 ${
                isSelected ? "border-amber-400/70 shadow-[0_0_30px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-300">
                    {TYPE_LABEL_KA[c.type]}
                  </span>
                  <span className="text-[0.68rem] font-medium text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString("ka-GE")}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold tracking-wide text-amber-300">რუკის ნომერი: {c.mapNumber ?? "—"}</p>
                <h3 className="font-display mt-2.5 text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                  {c.label}
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  {c.name1}
                  {c.name2 ? ` & ${c.name2}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-amber-500/15 text-xs font-bold">
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
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.65)] ring-2 ring-amber-300 hover:bg-amber-300"
                      : "bg-amber-500/20 text-amber-300 hover:bg-amber-400 hover:text-slate-950 font-bold"
                  }`}
                >
                  <Eye className={`h-3.5 w-3.5 ${isSelected ? "text-slate-950 stroke-[2.5]" : ""}`} />
                  <span>{loadingChart === c.id ? "იტვირთება..." : "ნახვა"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="flex items-center gap-1.5 rounded-full bg-rose-950/40 border border-rose-500/30 px-4 py-1.5 text-rose-300 transition-all hover:bg-rose-900/60 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>წაშლა</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {deleteTarget && (
        <div
          className="chart-delete-modal fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div
            className="chart-delete-dialog w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chart-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="chart-delete-icon" aria-hidden="true"><Trash2 className="h-5 w-5" /></span>
                <div>
                  <h2 id="delete-chart-title" className="font-display text-lg font-semibold text-slate-100">რუკის წაშლა</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">ეს მოქმედება წაშლის შენახულ რუკას თქვენი კაბინეტიდან.</p>
                </div>
              </div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="chart-dialog-close" aria-label="ფანჯრის დახურვა">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="chart-delete-summary">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-500">არჩეული რუკა</span>
              <strong className="mt-1 block truncate text-sm text-slate-200">{deleteTarget.label}</strong>
              <span className="mt-1 block text-xs text-slate-500">{deleteTarget.mapNumber ?? "რუკის ნომერი მიუთითებელი არ არის"}</span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">ნამდვილად გსურთ ამ რუკის წაშლა?</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="chart-dialog-secondary">გაუქმება</button>
              <button type="button" onClick={confirmRemoveChart} disabled={deleting} className="chart-dialog-danger">
                <Trash2 className="h-4 w-4" />
                {deleting ? "იშლება…" : "დიახ, წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Opened Chart View Modal / Card */}
      {selected && (
        <div id="chart-view" className="chart-view-panel fixed inset-0 z-[100] h-[100dvh] min-w-0 overflow-y-auto overscroll-contain bg-[#05020f]/95 p-3.5 backdrop-blur-md space-y-5 transition-all sm:p-8">
          
          {/* Premium Fixed Top-Right Close Button */}
          <div className="sticky top-2 sm:top-4 z-50 flex justify-end float-right -mt-2 -mr-2 sm:-mt-4 sm:-mr-4 mb-2 pointer-events-none">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="pointer-events-auto group inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-gradient-to-r from-slate-900/95 via-[#181c38]/95 to-slate-900/95 px-4 py-2 text-xs font-bold text-slate-200 shadow-[0_8px_24px_-6px_rgba(99,102,241,0.35)] backdrop-blur-xl ring-1 ring-white/10 transition-all duration-250 hover:scale-105 hover:border-violet-300/70 hover:text-white hover:shadow-[0_0_28px_rgba(129,140,248,0.55)] active:scale-95 cursor-pointer"
              title="ფანჯრის დახურვა"
            >
              <X className="h-4 w-4 text-violet-300 group-hover:text-white transition-colors shrink-0" />
              <span className="font-bold tracking-wider text-slate-200 group-hover:text-white transition-colors">
                დახურვა
              </span>
            </button>
          </div>

          {/* Header Row */}
          <div className="flex min-w-0 flex-col items-center gap-2 border-b border-amber-500/20 pb-4 text-center">
            <h2 className="font-display text-2xl font-bold text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] sm:text-3xl">
              {chartDisplayTitle(selected.type, selected.name1, selected.name2)}
            </h2>
            <span className="text-sm font-bold tracking-wide text-amber-300">რუკის ნომერი: {selected.mapNumber ?? "—"}</span>
          </div>

          {/* Full chart input details, matching the administrator's chart view */}
          <div className="chart-view-details grid min-w-0 gap-2 rounded-xl border border-slate-500/30 bg-slate-500/5 p-3 text-sm text-slate-200 sm:grid-cols-2 sm:p-4">
            <p className="text-center sm:col-span-2"><span className="text-slate-400">რუკის ნომერი:</span> {selected.mapNumber ?? "—"}</p>
            <p><span className="text-slate-400">პირველი პროფილი:</span> {selected.name1}</p>
            <p><span className="text-slate-400">დაბადება:</span> {formatWideDateDisplay(selected.date1)} {selected.time1}</p>
            <p><span className="text-slate-400">ადგილი:</span> {selected.place1}</p>
            {selected.name2 && <p><span className="text-slate-400">მეორე პროფილი:</span> {selected.name2}</p>}
            {selected.date2 && <p><span className="text-slate-400">მეორე დაბადება:</span> {formatWideDateDisplay(selected.date2)} {selected.time2 ?? ""}</p>}
            {selected.place2 && <p><span className="text-slate-400">მეორე ადგილი:</span> {selected.place2}</p>}
            {selected.transitDate && <p><span className="text-slate-400">ტრანზიტის თარიღი:</span> {formatWideDateDisplay(selected.transitDate)}</p>}
            <p><span className="text-slate-400">სახლთა სისტემა:</span> {selected.houseSystem}</p>
            <p><span className="text-slate-400">შედგენის დრო:</span> {new Date(selected.createdAt).toLocaleString("ka-GE")}</p>
          </div>

          {/* Action Toolbar: Light Moss Green Glow Button (ღია ჭაობისფერი გლოუ) & Copy Button */}
          <div className="chart-view-actions flex flex-col items-stretch gap-2.5 bg-purple-950/40 p-3 rounded-2xl border border-amber-500/20 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/40 bg-purple-950/60 px-4 py-2 text-center text-xs sm:w-auto sm:text-sm font-bold text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "კოპირებულია!" : "ტექსტის კოპირება"}</span>
            </button>
          </div>

          {/* Large Zodiac Chart Wheel Display (Visible right before interpretations when toggled) */}
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
          <div className="chart-view-interpretation min-w-0 pt-2">
            <h3 className="font-display mb-4 border-b border-slate-300/25 pb-3 text-center text-xl font-bold text-amber-300 sm:text-2xl">
              ასტროლოგიური ინტერპრეტაცია & ანალიზი
            </h3>
            {selected.interpretation ? (
              <InterpretationText
                text={selected.interpretation}
                viewMetadata={{ mode: "USER", viewedAt: selected.lastViewedAt }}
              />
            ) : (
              <p className="text-sm text-slate-400">ამ ჩანაწერისთვის ინტერპრეტაცია ვერ მოიძებნა.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
