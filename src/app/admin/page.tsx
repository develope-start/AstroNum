"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminCalculationViewer, { CalculationViewData } from "@/components/AdminCalculationViewer";
import DateSelect from "@/components/DateSelect";
import TimeSelect from "@/components/TimeSelect";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";
import { readApiResponse } from "@/lib/apiResponse";
import { formatWideDateDisplay } from "@/lib/astro/wideDate";

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
  mapNumber: string | null;
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
  user: { email: string; username?: string | null; publicId: string | null; adminId: string | null; createdAt: string } | null;
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
  user: {
    id?: string | null;
    name?: string | null;
    publicId?: string | null;
    email: string;
    username?: string | null;
    role: string;
    adminId: string | null;
  } | null;
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

interface RegisteredUserCalculationGroup {
  id: string;
  user: { name?: string | null; email: string; username?: string | null; publicId: string | null; adminId: string | null; createdAt: string };
  calculations: CalculationRow[];
}

interface HistorySection {
  id: string;
  label: string;
  tone: "registered" | "before-registration" | "guest-after-registration";
  calculations: CalculationRow[];
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" });
}

function HighlightText({ value, query }: { value: string | number | null | undefined; query: string }) {
  const text = String(value ?? "—");
  const needle = query.trim().toLocaleLowerCase("ka-GE");
  if (!needle || !text) return <>{text}</>;

  const lowerText = text.toLocaleLowerCase("ka-GE");
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = lowerText.indexOf(needle, cursor);
  while (matchIndex !== -1) {
    if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex));
    parts.push(
      <mark key={`${matchIndex}-${needle}`} className="admin-filter-match">
        {text.slice(matchIndex, matchIndex + needle.length)}
      </mark>,
    );
    cursor = matchIndex + needle.length;
    matchIndex = lowerText.indexOf(needle, cursor);
  }
  if (cursor === 0) return <>{text}</>;
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function buildHistorySections(group: RegisteredUserCalculationGroup): HistorySection[] {
  const registrationAt = new Date(group.user.createdAt).getTime();
  const registered = group.calculations.filter((calculation) => Boolean(calculation.user) && new Date(calculation.createdAt).getTime() >= registrationAt);
  const beforeRegistration = group.calculations.filter((calculation) => new Date(calculation.createdAt).getTime() < registrationAt);
  const guestAfterRegistration = group.calculations.filter((calculation) => !calculation.user && new Date(calculation.createdAt).getTime() >= registrationAt);

  return [
    { id: "registered", label: "რეგისტრირებული მომხმარებლის სტატუსით შექმნილი რუკები", tone: "registered" as const, calculations: registered },
    { id: "before-registration", label: "დარეგისტრირებამდე შექმნილი რუკები", tone: "before-registration" as const, calculations: beforeRegistration },
    { id: "guest-after-registration", label: "დაურეგისტრირებელი სტატუსით შექმნილი რუკები", tone: "guest-after-registration" as const, calculations: guestAfterRegistration },
  ]
    .map((section) => ({ ...section, calculations: [...section.calculations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) }))
    .filter((section) => section.calculations.length > 0);
}

function GroupedCalculationHistory({
  sections,
  activeId,
  onSelect,
  typeLabel,
  highlightQuery,
}: {
  sections: HistorySection[];
  activeId: string;
  onSelect: (id: string) => void;
  typeLabel: Record<string, string>;
  highlightQuery: string;
}) {
  const total = sections.reduce((count, section) => count + section.calculations.length, 0);
  if (total <= 1) return null;

  return (
    <div className="mt-4 space-y-2">
      {sections.map((section) => (
        <details
          key={section.id}
          className={`admin-history-section rounded-xl border p-3 ${
            section.tone === "registered" ? "border-emerald-500/35 bg-emerald-950/15" : "border-dashed border-rose-500/60 bg-rose-950/10"
          }`}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-bold marker:hidden sm:text-sm">
            <span className="min-w-0 break-words">{section.label}</span>
            <span className="shrink-0 rounded-full border border-line/60 px-2 py-1 text-[10px] text-parchment-dim">{section.calculations.length} რუკა</span>
          </summary>
          <div className="mt-3 grid gap-2">
            {section.calculations.map((calculation, index) => (
              <button
                key={calculation.id}
                type="button"
                onClick={() => onSelect(calculation.id)}
                className={`flex min-w-0 flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition sm:flex-row sm:items-center sm:justify-between ${
                  calculation.id === activeId ? "border-sky-400/70 bg-sky-950/50 text-white" : "border-line/60 bg-ink/40 text-parchment-dim hover:border-cyan-400/60"
                }`}
              >
                <span className="min-w-0 break-words font-semibold">#{index + 1} · <HighlightText value={typeLabel[calculation.type] ?? calculation.type} query={highlightQuery} /> · <HighlightText value={calculation.name1} query={highlightQuery} /></span>
                <span className="shrink-0 text-[11px] text-parchment-dim"><HighlightText value={formatDateTime(calculation.createdAt)} query={highlightQuery} /></span>
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function displayValue(value: string | number | null | undefined) {
  return value ?? "—";
}

function CalculationHistoryPicker({
  calculations,
  activeId,
  latestId,
  onSelect,
  typeLabel,
  user,
  guestPublicId,
  highlightQuery,
}: {
  calculations: CalculationRow[];
  activeId: string;
  latestId: string;
  onSelect: (id: string) => void;
  typeLabel: Record<string, string>;
  user?: { email: string; username?: string | null; publicId: string | null; adminId: string | null } | null;
  guestPublicId?: string | null;
  highlightQuery: string;
}) {
  if (calculations.length <= 1) return null;

  return (
    <details className="mt-4 rounded-xl border border-line/70 bg-ink-2/50 p-3 backdrop-blur-sm transition-all">
      <summary className="cursor-pointer select-none text-xs sm:text-sm font-bold text-sky-300 hover:text-cyan-200 transition-colors flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span>📜 წინა შედგენილი რუკები ({calculations.length - 1})</span>
          <span className="text-[10px] text-parchment-dim italic font-normal hidden sm:inline">(დააწკაპუნეთ ჩამოსაშლელად)</span>
        </span>
        <span className="text-xs font-semibold text-brass-2">▼ ჩამოშლა</span>
      </summary>

      <div className="mt-3 space-y-2">
        {calculations.map((calculation, index) => {
          const isActive = calculation.id === activeId;
          const isLatest = calculation.id === latestId;
          const names = calculation.name2 ? `${calculation.name1} & ${calculation.name2}` : calculation.name1;
          const displayPublicId = calculation.publicId ?? user?.publicId ?? guestPublicId ?? "—";

          return (
            <button
              key={calculation.id}
              type="button"
              onClick={() => onSelect(calculation.id)}
              className={`w-full rounded-xl border p-3 text-left text-xs transition-all duration-200 flex flex-wrap items-center justify-between gap-2 cursor-pointer ${
                isActive
                  ? "border-sky-400/80 bg-sky-950/60 text-white shadow-[0_0_15px_rgba(56,189,248,0.35)] ring-1 ring-sky-400/40"
                  : "border-line/60 bg-ink/60 text-parchment-dim hover:border-cyan-400/60 hover:bg-cyan-950/30 hover:text-cyan-200"
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-parchment">
                    #{calculations.length - index} · <HighlightText value={typeLabel[calculation.type] ?? calculation.type} query={highlightQuery} />
                  </span>
                  {isLatest && (
                    <span className="rounded-full border border-emerald-400/60 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                      ✦ ბოლო შედგენილი
                    </span>
                  )}
                  {isActive && !isLatest && (
                    <span className="rounded-full border border-amber-400/60 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      ✓ არჩეულია
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-parchment-dim">
                  <span>👤 <strong>სახელი:</strong> <HighlightText value={names} query={highlightQuery} /></span>
                  <span>🆔 <strong className="admin-id-label">აიდი:</strong> <span className="admin-id-value-guest"><HighlightText value={displayPublicId} query={highlightQuery} /></span></span>
                  <span>რუკის ნომერი: <strong className="text-amber-300"><HighlightText value={calculation.mapNumber} query={highlightQuery} /></strong></span>
                  {user?.username && (
                    <span className="text-cyan-300 font-medium">
                      <strong>Username:</strong> @{user.username}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right text-[11px] text-parchment-dim/80">
                <p className="font-medium">📅 <HighlightText value={formatDateTime(calculation.createdAt)} query={highlightQuery} /></p>
                <div className="mt-1">
                  {calculation.saved ? (
                    <span className="inline-block rounded-full border border-fuchsia-400/50 bg-fuchsia-950/50 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300">
                      💾 შენახულია
                    </span>
                  ) : (
                    <span className="inline-block rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-300/80">
                      შეუნახავი
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </details>
  );
}

function RegisteredUserCalculationCard({
  group,
  selectedId,
  onSelect,
  onResetToLatest,
  typeLabel,
  onView,
  highlightQuery,
}: {
  group: RegisteredUserCalculationGroup;
  selectedId?: string;
  onSelect: (id: string) => void;
  onResetToLatest: () => void;
  typeLabel: Record<string, string>;
  onView: (calculation: CalculationRow) => void;
  highlightQuery: string;
}) {
  const historySections = buildHistorySections(group);
  const latestCalculation = historySections.find((section) => section.id === "registered")?.calculations[0] ?? group.calculations[0];
  const isCustomSelected = Boolean(selectedId && selectedId !== latestCalculation.id);
  const calculation = group.calculations.find((item) => item.id === selectedId) ?? latestCalculation;

  if (!calculation) return null;

  const mapNum = calculation.mapNumber ?? calculation.publicId ?? group.user.publicId ?? "—";
  const userAccountLabel = group.user.name || (group.user.username ? `@${group.user.username}` : group.user.email);
  const displayName = calculation.name1 ? `${calculation.name1} (${userAccountLabel})` : userAccountLabel;
  const calcTime = formatDateTime(calculation.createdAt);

  return (
    <details data-map-count={group.calculations.length} className="group rounded-xl border border-line bg-ink-2/60 p-4 text-sm transition-all duration-300 hover:border-emerald-500/40 shadow-lg">
      <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            <span>რეგისტრირებული</span>
          </span>

          <span><strong className="admin-id-label">აიდი:</strong> <span className="admin-id-value-registered"><HighlightText value={calculation.publicId ?? group.user.publicId} query={highlightQuery} /></span></span>
          <span className="font-semibold text-parchment">👤 <HighlightText value={displayName} query={highlightQuery} /></span>
          <span className="text-cyan-300 font-medium">📧 <HighlightText value={group.user.email} query={highlightQuery} /></span>
          <span className="rounded-md border border-purple-400/50 bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-200">
            🗺️ რუკის #: <HighlightText value={mapNum} query={highlightQuery} />
          </span>
          <span className="text-parchment-dim text-xs">🕒 <HighlightText value={calcTime} query={highlightQuery} /></span>
          {isCustomSelected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-950/70 px-2.5 py-0.5 text-xs font-bold text-amber-300 animate-pulse">
              <span>🕒 არჩეულია წინა რუკა</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brass-2 transition-transform duration-200 group-open:rotate-180">▼ ჩამოშლა</span>
        </div>
      </summary>

      <div className="mt-4 border-t border-line/60 pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-orange-400">ADMIN ID: <HighlightText value={group.user.adminId} query={highlightQuery} /></span>
            </div>
            <span className="mt-1 block"><strong className="admin-id-label">აიდი:</strong> <span className={calculation.user ? "admin-id-value-registered" : "admin-id-value-guest"}><HighlightText value={calculation.publicId ?? group.user.publicId} query={highlightQuery} /></span></span>
            <span className="block text-amber-300">რუკის ნომერი: <HighlightText value={calculation.mapNumber} query={highlightQuery} /></span>
            <span className="block text-parchment-dim">იუზერი: <HighlightText value={group.user.email} query={highlightQuery} /></span>
            <span className="mt-0.5 block text-xs font-semibold text-[#55e6e1]">
              Username: {group.user.username ? <HighlightText value={`@${group.user.username}`} query={highlightQuery} /> : <span className="text-amber-400/80 italic font-normal">არ აქვს მითითებული</span>}
            </span>
            <p className="mt-1 text-xs text-parchment-dim">სულ შედგენილი რუკები: <strong className="text-emerald-400 font-bold">{group.calculations.length}</strong></p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-parchment-dim">გამოთვლილია: <HighlightText value={formatDateTime(calculation.createdAt)} query={highlightQuery} /></p>

            {isCustomSelected && (
              <button
                type="button"
                onClick={onResetToLatest}
                className="flex items-center gap-1.5 rounded-lg border border-rose-400/60 bg-rose-950/60 px-2.5 py-1 text-xs font-bold text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-all hover:bg-rose-900 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                title="დახურვა და ბოლო შეყვანილ მონაცემებზე დაბრუნება"
              >
                <span className="text-sm font-black">✕</span>
                <span>ბოლო რუკაზე დაბრუნება</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="my-3 flex justify-center border-y border-line/50 py-2.5">
          <button
            type="button"
            onClick={() => onView(calculation)}
            className="group flex items-center justify-center gap-2 rounded-full border-2 border-slate-300/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-100 shadow-[0_0_22px_rgba(148,163,184,0.45)] ring-2 ring-slate-400/30 transition-all hover:scale-105 hover:border-white hover:text-white hover:shadow-[0_0_32px_rgba(148,163,184,0.7)] active:scale-95 cursor-pointer"
          >
            <span className="tracking-wide text-slate-100 font-extrabold">✦ რუკის ნახვა ({typeLabel[calculation.type] ?? calculation.type})</span>
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">პირველი პროფილი</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-parchment-dim">სახელი</dt><dd><HighlightText value={calculation.name1} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">თარიღი</dt><dd><HighlightText value={formatWideDateDisplay(calculation.date1)} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">დრო</dt><dd><HighlightText value={calculation.time1} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">ადგილი</dt><dd><HighlightText value={calculation.place1} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">კოორდინატები</dt><dd>{calculation.lat1}, {calculation.lon1}</dd>
              <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{calculation.tz1}</dd>
            </dl>
          </div>
          {(calculation.type === "SYNASTRY" || calculation.name2) && (
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">მეორე პროფილი</h4>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-parchment-dim">სახელი</dt><dd><HighlightText value={calculation.name2} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">თარიღი</dt><dd><HighlightText value={formatWideDateDisplay(calculation.date2)} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">დრო</dt><dd><HighlightText value={calculation.time2} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">ადგილი</dt><dd><HighlightText value={calculation.place2} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">კოორდინატები</dt><dd>{displayValue(calculation.lat2)}, {displayValue(calculation.lon2)}</dd>
                <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{displayValue(calculation.tz2)}</dd>
              </dl>
            </div>
          )}
        </div>

        <dl className="mt-4 grid gap-x-3 gap-y-1 border-t border-line/60 pt-3 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
          <dt className="text-parchment-dim">სახლთა სისტემა</dt><dd>{calculation.houseSystem}</dd>
          <dt className="text-parchment-dim">ტრანზიტის თარიღი</dt><dd>{formatWideDateDisplay(calculation.transitDate)}</dd>
        </dl>

        {/* Previous Calculation List Picker */}
        <GroupedCalculationHistory
          sections={historySections}
          activeId={calculation.id}
          onSelect={onSelect}
          typeLabel={typeLabel}
          highlightQuery={highlightQuery}
        />
      </div>
    </details>
  );
}

function GuestCalculationCard({
  group,
  selectedId,
  onSelect,
  onResetToLatest,
  typeLabel,
  onView,
  highlightQuery,
}: {
  group: GuestCalculationGroup;
  selectedId?: string;
  onSelect: (id: string) => void;
  onResetToLatest: () => void;
  typeLabel: Record<string, string>;
  onView: (calculation: CalculationRow) => void;
  highlightQuery: string;
}) {
  const latestCalculation = group.calculations[0];
  const isCustomSelected = Boolean(selectedId && selectedId !== latestCalculation.id);
  const calculation = group.calculations.find((item) => item.id === selectedId) ?? latestCalculation;

  if (!calculation) return null;

  const mapNum = calculation.mapNumber ?? calculation.publicId ?? group.publicId ?? "—";
  const displayName = calculation.name1 || "—";
  const calcTime = formatDateTime(calculation.createdAt);

  return (
    <details data-map-count={group.calculations.length} className="group rounded-xl border border-red-500/50 bg-red-500/5 p-4 text-sm transition-all duration-300 hover:border-rose-500/70 shadow-lg">
      <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/60 bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
            <span>დაურეგისტრირებელი</span>
          </span>

          <span className="font-bold text-red-400">აიდი: <HighlightText value={calculation.publicId ?? group.publicId} query={highlightQuery} /></span>
          <span className="font-semibold text-parchment">👤 <HighlightText value={displayName} query={highlightQuery} /></span>
          <span className="text-rose-300/70 italic text-xs">📧 მეილი: არ აქვს</span>
          <span className="rounded-md border border-purple-400/50 bg-purple-950/40 px-2 py-0.5 text-xs font-bold text-purple-200">
            🗺️ რუკის #: <HighlightText value={mapNum} query={highlightQuery} />
          </span>
          <span className="text-parchment-dim text-xs">🕒 <HighlightText value={calcTime} query={highlightQuery} /></span>
          {isCustomSelected && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-950/70 px-2.5 py-0.5 text-xs font-bold text-amber-300 animate-pulse">
              <span>🕒 არჩეულია წინა რუკა</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brass-2 transition-transform duration-200 group-open:rotate-180">▼ ჩამოშლა</span>
        </div>
      </summary>

      <div className="mt-4 border-t border-red-500/30 pt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
          <div>
            <h3 className="font-medium flex flex-wrap items-center gap-2">
              <span className="font-bold"><span className="admin-id-label">· აიდი:</span> <span className="admin-id-value-guest"><HighlightText value={calculation.publicId ?? group.publicId} query={highlightQuery} /></span></span>
              <span className="text-amber-300 font-bold">· რუკის ნომერი: <HighlightText value={calculation.mapNumber} query={highlightQuery} /></span>
            </h3>
            {calculation.updatedAt && <p className="text-xs text-parchment-dim/70">განახლებული: {formatDateTime(calculation.createdAt)}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold ${calculation.saved ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-300" : "border-amber-400/50 bg-amber-500/10 text-amber-300"}`}>
                {calculation.saved ? "მონაცემები შენახულია" : "შენახვის გარეშე"}
              </span>
              <span className="text-xs text-parchment-dim">სულ შედგენილი რუკები: <strong className="text-rose-400 font-bold">{group.calculations.length}</strong></span>
            </div>
            <p className="mt-1 text-xs text-parchment-dim">IP: <HighlightText value={group.ipAddress} query={highlightQuery} /></p>
            <p className="max-w-3xl break-words text-xs text-parchment-dim">მოწყობილობა: <HighlightText value={group.userAgent} query={highlightQuery} /></p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-parchment-dim">გამოთვლილია: <HighlightText value={formatDateTime(calculation.createdAt)} query={highlightQuery} /></p>

            {isCustomSelected && (
              <button
                type="button"
                onClick={onResetToLatest}
                className="flex items-center gap-1.5 rounded-lg border border-rose-400/60 bg-rose-950/60 px-2.5 py-1 text-xs font-bold text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-all hover:bg-rose-900 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                title="დახურვა და ბოლო შეყვანილ მონაცემებზე დაბრუნება"
              >
                <span className="text-sm font-black">✕</span>
                <span>ბოლო რუკაზე დაბრუნება</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="my-3 flex justify-center border-y border-line/50 py-2.5">
          <button
            type="button"
            onClick={() => onView(calculation)}
            className="group flex items-center justify-center gap-2 rounded-full border-2 border-slate-300/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-2.5 text-xs sm:text-sm font-black text-slate-100 shadow-[0_0_22px_rgba(148,163,184,0.45)] ring-2 ring-slate-400/30 transition-all hover:scale-105 hover:border-white hover:text-white hover:shadow-[0_0_32px_rgba(148,163,184,0.7)] active:scale-95 cursor-pointer"
          >
            <span className="tracking-wide text-slate-100 font-extrabold">✦ რუკის ნახვა ({typeLabel[calculation.type] ?? calculation.type})</span>
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">პირველი პროფილი</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-parchment-dim">სახელი</dt><dd><HighlightText value={calculation.name1} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">თარიღი</dt><dd><HighlightText value={formatWideDateDisplay(calculation.date1)} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">დრო</dt><dd><HighlightText value={calculation.time1} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">ადგილი</dt><dd><HighlightText value={calculation.place1} query={highlightQuery} /></dd>
              <dt className="text-parchment-dim">კოორდინატები</dt><dd>{calculation.lat1}, {calculation.lon1}</dd>
              <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{calculation.tz1}</dd>
            </dl>
          </div>
          {(calculation.type === "SYNASTRY" || calculation.name2) && (
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-brass/80">მეორე პროფილი</h4>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="text-parchment-dim">სახელი</dt><dd><HighlightText value={calculation.name2} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">თარიღი</dt><dd><HighlightText value={formatWideDateDisplay(calculation.date2)} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">დრო</dt><dd><HighlightText value={calculation.time2} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">ადგილი</dt><dd><HighlightText value={calculation.place2} query={highlightQuery} /></dd>
                <dt className="text-parchment-dim">კოორდინატები</dt><dd>{displayValue(calculation.lat2)}, {displayValue(calculation.lon2)}</dd>
                <dt className="text-parchment-dim">დროის სარტყელი</dt><dd>{displayValue(calculation.tz2)}</dd>
              </dl>
            </div>
          )}
        </div>

        <dl className="mt-4 grid gap-x-3 gap-y-1 border-t border-line/60 pt-3 text-xs sm:grid-cols-[auto_1fr_auto_1fr]">
          <dt className="text-parchment-dim">სახლთა სისტემა</dt><dd>{calculation.houseSystem}</dd>
          <dt className="text-parchment-dim">ტრანზიტის თარიღი</dt><dd>{formatWideDateDisplay(calculation.transitDate)}</dd>
        </dl>

        {/* Calculation History Picker */}
        <CalculationHistoryPicker
          calculations={group.calculations}
          activeId={calculation.id}
          latestId={latestCalculation.id}
          onSelect={onSelect}
          typeLabel={typeLabel}
          guestPublicId={group.publicId}
          highlightQuery={highlightQuery}
        />
      </div>
    </details>
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
  mapNumber: string;
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
  mapNumber: "",
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
  const [selectedRegisteredCalculations, setSelectedRegisteredCalculations] = useState<Record<string, string>>({});
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
          includes([calculation.mapNumber], filters.mapNumber) &&
          includes([calculation.name1, calculation.name2], filters.name) &&
          includes([calculation.date1, calculation.date2], filters.birthDate) &&
          includes([calculation.time1, calculation.time2], filters.time) &&
          includes([calculation.place1, calculation.place2], filters.place)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [calculations, filters]);

  const filteredRegisteredGroups = useMemo(() => {
    if (!filteredCalculations) return [];

    const groupMap = new Map<string, RegisteredUserCalculationGroup>();

    for (const calculation of filteredCalculations) {
      if (!calculation.user) continue;
      const userKey = calculation.user.email.toLowerCase();

      if (!groupMap.has(userKey)) {
        groupMap.set(userKey, {
          id: userKey,
          user: calculation.user,
          calculations: [],
        });
      }
      groupMap.get(userKey)!.calculations.push(calculation);
    }

    const registeredGroups = Array.from(groupMap.values());
    if (filters.status !== "ALL") return registeredGroups;

    const includes = (values: Array<string | null | undefined>, query: string) => {
      if (!query.trim()) return true;
      const normalizedQuery = query.trim().toLocaleLowerCase("ka-GE");
      return values.some((value) => value?.toLocaleLowerCase("ka-GE").includes(normalizedQuery));
    };
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const attachedGuestIds = new Set<string>();

    for (const guestGroup of guestCalculationGroups) {
      for (const guestCalculation of guestGroup.calculations) {
        const createdDate = guestCalculation.createdAt.slice(0, 10);
        const matchesFilters =
          (!filters.createdFrom || createdDate >= filters.createdFrom) &&
          (!filters.createdTo || createdDate <= filters.createdTo) &&
          (filters.type === "ALL" || guestCalculation.type === filters.type) &&
          includes([], filters.email) &&
          includes([guestCalculation.mapNumber], filters.mapNumber) &&
          includes([guestCalculation.publicId, guestGroup.publicId], filters.publicId) &&
          includes([guestCalculation.name1, guestCalculation.name2], filters.name) &&
          includes([guestCalculation.date1, guestCalculation.date2], filters.birthDate) &&
          includes([guestCalculation.time1, guestCalculation.time2], filters.time) &&
          includes([guestCalculation.place1, guestCalculation.place2], filters.place);
        if (!matchesFilters || attachedGuestIds.has(guestCalculation.id)) continue;

        const guestAt = new Date(guestCalculation.createdAt).getTime();
        const target = registeredGroups
          .filter((group) => {
            const registeredAt = new Date(group.user.createdAt).getTime();
            if (guestAt < registeredAt || guestAt - registeredAt > twelveHoursMs) return false;
            return group.calculations.some(
              (calculation) =>
                calculation.ipAddress &&
                calculation.userAgent &&
                calculation.ipAddress === guestCalculation.ipAddress &&
                calculation.userAgent === guestCalculation.userAgent
            );
          })
          .sort((left, right) => new Date(right.user.createdAt).getTime() - new Date(left.user.createdAt).getTime())[0];

        if (!target) continue;
        target.calculations.push(guestCalculation);
        attachedGuestIds.add(guestCalculation.id);
      }
    }

    return registeredGroups.map((group) => ({
      ...group,
      calculations: [...group.calculations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
  }, [filteredCalculations, guestCalculationGroups, filters]);

  const filteredGuestCalculationGroups = useMemo(() => {
    const linkedGuestIds = new Set(
      filteredRegisteredGroups.flatMap((group) => group.calculations.filter((calculation) => !calculation.user).map((calculation) => calculation.id))
    );
    const includes = (values: Array<string | null | undefined>, query: string) => {
      if (!query.trim()) return true;
      const normalizedQuery = query.trim().toLocaleLowerCase("ka-GE");
      return values.some((value) => value?.toLocaleLowerCase("ka-GE").includes(normalizedQuery));
    };

    return guestCalculationGroups
      .map((group) => ({
        ...group,
        calculations: group.calculations.filter((calculation) => {
          if (linkedGuestIds.has(calculation.id)) return false;
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
  }, [guestCalculationGroups, filteredRegisteredGroups, filters]);

  // The filtered rows are rendered in both registered and unregistered
  // sections. Keep the summary count aligned with those visible sections.
  const filteredCalculationCount =
    filteredRegisteredGroups.reduce((total, group) => total + group.calculations.length, 0) +
    filteredGuestCalculationGroups.reduce((total, group) => total + group.calculations.length, 0);
  const totalCalculationCount =
    (calculations?.length ?? 0) + guestCalculationGroups.reduce((total, group) => total + group.calculations.length, 0);
  const filteredRegisteredMapCount = filteredRegisteredGroups.reduce((total, group) => total + group.calculations.length, 0);
  const filteredGuestMapCount = filteredGuestCalculationGroups.reduce((total, group) => total + group.calculations.length, 0);

  const stats = useMemo(() => {
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    const d7 = 7 * 24 * 60 * 60 * 1000;
    const d30 = 30 * 24 * 60 * 60 * 1000;

    let charts24h = 0;
    let charts7d = 0;
    let charts30d = 0;

    const registeredUsers24h = new Set<string>();
    const registeredUsers7d = new Set<string>();
    const registeredUsers30d = new Set<string>();

    // 1. Registered calculations
    if (calculations) {
      for (const c of calculations) {
        const time = new Date(c.createdAt).getTime();
        const diff = now - time;
        const emailKey = c.user?.email ? c.user.email.trim().toLowerCase() : null;

        if (diff <= h24) {
          charts24h++;
          if (emailKey) registeredUsers24h.add(emailKey);
        }
        if (diff <= d7) {
          charts7d++;
          if (emailKey) registeredUsers7d.add(emailKey);
        }
        if (diff <= d30) {
          charts30d++;
          if (emailKey) registeredUsers30d.add(emailKey);
        }
      }
    }

    // 2. Guest / Unregistered calculations & unique guest user groups
    let guestUsers24h = 0;
    let guestUsers7d = 0;
    let guestUsers30d = 0;

    if (guestCalculationGroups) {
      for (const group of guestCalculationGroups) {
        let has24h = false;
        let has7d = false;
        let has30d = false;

        for (const gc of group.calculations) {
          const time = new Date(gc.createdAt).getTime();
          const diff = now - time;

          if (diff <= h24) {
            charts24h++;
            has24h = true;
          }
          if (diff <= d7) {
            charts7d++;
            has7d = true;
          }
          if (diff <= d30) {
            charts30d++;
            has30d = true;
          }
        }

        if (has24h) guestUsers24h++;
        if (has7d) guestUsers7d++;
        if (has30d) guestUsers30d++;
      }
    }

    // 3. Registered user registrations (accounts created in timeframe)
    if (users) {
      for (const u of users) {
        const time = new Date(u.createdAt).getTime();
        const diff = now - time;
        const emailKey = u.email ? u.email.trim().toLowerCase() : null;

        if (diff <= h24 && emailKey) registeredUsers24h.add(emailKey);
        if (diff <= d7 && emailKey) registeredUsers7d.add(emailKey);
        if (diff <= d30 && emailKey) registeredUsers30d.add(emailKey);
      }
    }

    const users24h = registeredUsers24h.size + guestUsers24h;
    const users7d = registeredUsers7d.size + guestUsers7d;
    const users30d = registeredUsers30d.size + guestUsers30d;
    const totalCharts = (calculations?.length ?? 0) + guestCalculationGroups.reduce((total, group) => total + group.calculations.length, 0);
    const totalUsers = (users?.length ?? 0) + guestCalculationGroups.length;

    return { charts24h, users24h, charts7d, users7d, charts30d, users30d, totalCharts, totalUsers };
  }, [calculations, guestCalculationGroups, users]);

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
    ADMIN_ROLE_CHANGED: "ადმინის როლი შეიცვალა",
    ADMIN_CREATED: "ახალი ადმინი შეიქმნა",
    ADMIN_PROFILE_CHANGED: "ადმინის პროფილი შეიცვალა",
    PRIMARY_ADMIN_RECOVERED: "მთავარი ადმინი შეიქმნა/აღდგა",
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
  const eventIsRestored = (type: string) => ["ACCOUNT_RESTORED", "CALCULATION_RESTORED", "ACCOUNT_CREATED", "ADMIN_CREATED", "PRIMARY_ADMIN_RECOVERED"].includes(eventBaseType(type));

  const filteredAccountEvents = useMemo(() => {
    if (!accountEvents) return null;

    const hasUnsupportedFilter = Boolean(filters.mapNumber || filters.birthDate || filters.time || filters.place) || filters.type !== "ALL" || filters.status !== "ALL";
    if (hasUnsupportedFilter) return [];

    const includes = (values: Array<string | null | undefined>, query: string) => {
      if (!query.trim()) return true;
      const normalizedQuery = query.trim().toLocaleLowerCase("ka-GE");
      return values.some((value) => value?.toLocaleLowerCase("ka-GE").includes(normalizedQuery));
    };

    return accountEvents.filter((event) => {
      const createdDate = event.createdAt.slice(0, 10);
      const typeText = eventLabel[eventBaseType(event.type)] ?? eventStatusLabel[eventBaseType(event.type)] ?? event.type;
      return (
        (!filters.createdFrom || createdDate >= filters.createdFrom) &&
        (!filters.createdTo || createdDate <= filters.createdTo) &&
        includes([event.emailSnapshot, event.oldEmail, event.newEmail, event.user?.email], filters.email) &&
        includes([event.user?.publicId, event.user?.adminId], filters.publicId) &&
        includes([event.user?.name, event.user?.username, typeText], filters.name)
      );
    });
  }, [accountEvents, filters, eventLabel]);

  const highlightQuery = filters.email || filters.publicId || filters.mapNumber || filters.name || filters.birthDate || filters.time || filters.place || "";

  const hasFilters =
    Boolean(filters.createdFrom || filters.createdTo || filters.email || filters.publicId || filters.mapNumber || filters.name || filters.birthDate || filters.time || filters.place) ||
    filters.type !== "ALL" ||
    filters.status !== "ALL";
  const visibleAccountEvents = filteredAccountEvents ?? [];

  return (
    <div className="admin-page">
      <div className="admin-page-header mb-6 flex flex-col items-stretch gap-4 border-b border-line/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-black text-brass-2 drop-shadow">ადმინის პანელი — ყველა მომხმარებელი</h1>
        <div className="admin-header-actions flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
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
      <div className="admin-account-info mb-8 rounded-2xl border border-emerald-400/35 bg-emerald-950/15 p-5 shadow-[0_0_28px_rgba(52,211,153,0.12)] sm:p-6">
        <div className="admin-account-info-content mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
          <p className="w-full text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200/70">მთავარი ადმინისტრატორი</p>
          <span className="text-base font-semibold tracking-wide text-cyan-200 sm:text-lg">{adminEmail ?? "იტვირთება…"}</span>
          <span className="rounded-full border border-orange-400/30 bg-orange-950/20 px-3 py-1 text-sm font-bold text-orange-300">{adminId ?? "ADMIN"}</span>
          <span className="text-xl font-black tracking-wide text-emerald-200 sm:text-2xl">ადმინი</span>
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
        <div className="admin-stats-card mb-4 rounded-xl border border-line/50 bg-ink-2/40 px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-2.5">
          <div className="admin-live-stats grid gap-2 text-xs italic text-parchment-dim/85 sm:grid-cols-2 lg:grid-cols-4">
            {/* Live Beep / Pulse Indicator Dot */}
            <div className="admin-stat-item flex items-center gap-2 not-italic">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">სტატისტიკა:</span>
            </div>

            {/* 24 Hours */}
            <div className="admin-stat-item flex items-center gap-1.5">
              <span>⚡ ბოლო 24 საათში:</span>
              <span className="font-semibold text-amber-300 not-italic">{stats.charts24h}</span>
              <span>რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-semibold text-cyan-300 not-italic">{stats.users24h}</span>
              <span>მომხმარებელი</span>
            </div>

            {/* 1 Week */}
            <div className="admin-stat-item flex items-center gap-1.5">
              <span>📅 ბოლო 1 კვირაში:</span>
              <span className="font-semibold text-amber-300 not-italic">{stats.charts7d}</span>
              <span>რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-semibold text-cyan-300 not-italic">{stats.users7d}</span>
              <span>მომხმარებელი</span>
            </div>

            {/* 1 Month */}
            <div className="admin-stat-item flex items-center gap-1.5">
              <span>🗓️ ბოლო 1 თვეში:</span>
              <span className="font-semibold text-amber-300 not-italic">{stats.charts30d}</span>
              <span>რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-semibold text-cyan-300 not-italic">{stats.users30d}</span>
              <span>მომხმარებელი</span>
            </div>

            {/* All-time totals */}
            <div className="admin-stat-item flex items-center justify-center gap-1.5 border-emerald-400/25 bg-emerald-950/10 not-italic sm:col-span-2 lg:col-span-4">
              <span className="font-semibold uppercase tracking-wide text-emerald-200/80">Σ სულ:</span>
              <span className="font-bold text-amber-200">{stats.totalCharts}</span>
              <span className="text-amber-100/80">რუკა</span>
              <span className="text-line/60">|</span>
              <span className="font-bold text-cyan-200">{stats.totalUsers}</span>
              <span className="text-cyan-100/80">მომხმარებელი</span>
            </div>
          </div>
        </div>
        <div className="mb-4 rounded-xl border border-line bg-ink-2/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-parchment-dim">
              რუკის ნომერი
              <input value={filters.mapNumber} onChange={(e) => setFilters((current) => ({ ...current, mapNumber: e.target.value }))} placeholder="მაგ. Z-00001" className="mt-1 w-full rounded-lg border border-line bg-ink px-2 py-2 text-parchment outline-none focus:border-brass" />
            </label>
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
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3 text-xs">
            <span className="text-parchment-dim">
              ნაჩვენებია {filteredCalculationCount} ჩანაწერი / სულ {totalCalculationCount}
            </span>
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasFilters} className="rounded-full border border-brass/60 px-3 py-1.5 text-brass-2 disabled:cursor-not-allowed disabled:opacity-40">
              ფილტრების გასუფთავება
            </button>
          </div>
        </div>
      </section>

      {/* Registered Users Section */}
      <section id="registered-calculations-section" className="mb-8 scroll-mt-6">
         <details className="group/section rounded-2xl border border-sky-500/30 bg-sky-950/10 p-5 backdrop-blur-sm transition-all">
          <summary className="flex cursor-pointer select-none items-center justify-between gap-3">
            <h3 className="font-display text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-300 to-blue-400 drop-shadow-[0_0_15px_rgba(56,189,248,0.55)]">
              ✅ რეგისტრირებული მომხმარებლების რუკების ისტორია ({filteredRegisteredGroups.length})
             </h3>
             <span className="admin-section-total">რუკები სულ [{filteredRegisteredMapCount}]</span>
            <div className="flex items-center gap-3">
              {filteredGuestCalculationGroups.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("guest-calculations-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/40 px-3.5 py-1.5 text-xs sm:text-sm font-black text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.4)] ring-1 ring-rose-500/30 transition-all hover:scale-105 hover:border-rose-400 hover:bg-rose-900/60 hover:text-white cursor-pointer"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                  </span>
                  <span>დაურეგისტრირებელი ↓</span>
                </button>
              )}
              <span className="text-xs sm:text-sm font-bold text-sky-300 group-open/section:rotate-180 transition-transform">▼ ჩამოშლა</span>
            </div>
          </summary>

          <div className="mt-5 space-y-4 border-t border-sky-500/20 pt-4">
            {calculations?.length === 0 && (
              <p className="text-xs text-parchment-dim">ჯერ არცერთი რუკა არ გამოთვლილა.</p>
            )}
            {calculations && calculations.length > 0 && filteredRegisteredGroups.length === 0 && (
              <p className="text-xs text-parchment-dim">ამ ფილტრებით ჩანაწერი ვერ მოიძებნა.</p>
            )}
            {filteredRegisteredGroups.map((group) => (
              <RegisteredUserCalculationCard
                key={group.id}
                group={group}
                selectedId={selectedRegisteredCalculations[group.id]}
                onSelect={(id) => setSelectedRegisteredCalculations((current) => ({ ...current, [group.id]: id }))}
                onResetToLatest={() =>
                  setSelectedRegisteredCalculations((current) => {
                    const updated = { ...current };
                    delete updated[group.id];
                    return updated;
                  })
                }
                typeLabel={typeLabel}
                onView={openCalculationView}
                highlightQuery={highlightQuery}
              />
            ))}
          </div>
        </details>
      </section>

      {/* Unregistered Users Section */}
      {filteredGuestCalculationGroups.length > 0 && (
        <section id="guest-calculations-section" className="mb-8 scroll-mt-6">
           <details className="group/section rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 backdrop-blur-sm transition-all">
            <summary className="flex cursor-pointer select-none items-center justify-between gap-3">
            <h2 className="font-display text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-red-400 to-rose-500 drop-shadow-[0_0_14px_rgba(244,63,94,0.45)]">
                ⚠️ დაურეგისტრირებელი მომხმარებლების რუკების ისტორია ({filteredGuestCalculationGroups.length})
               </h2>
               <span className="admin-section-total">რუკები სულ [{filteredGuestMapCount}]</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById("registered-calculations-section")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex items-center gap-2 rounded-xl border border-sky-400/50 bg-cyan-950/40 px-3.5 py-1.5 text-xs sm:text-sm font-black text-cyan-300 shadow-[0_0_14px_rgba(56,189,248,0.4)] ring-1 ring-sky-400/30 transition-all hover:scale-105 hover:border-cyan-300 hover:bg-cyan-900/60 hover:text-white cursor-pointer"
                >
                  <span>↑ რეგისტრირებული</span>
                </button>
                <span className="text-xs sm:text-sm font-bold text-rose-300 group-open/section:rotate-180 transition-transform">▼ ჩამოშლა</span>
              </div>
            </summary>
            <div className="mt-5 space-y-4 border-t border-rose-500/20 pt-4">
              {filteredGuestCalculationGroups.map((group) => (
                <GuestCalculationCard
                  key={group.id}
                  group={group}
                  selectedId={selectedGuestCalculations[group.id]}
                  onSelect={(id) => setSelectedGuestCalculations((current) => ({ ...current, [group.id]: id }))}
                  onResetToLatest={() =>
                    setSelectedGuestCalculations((current) => {
                      const updated = { ...current };
                      delete updated[group.id];
                      return updated;
                    })
                  }
                  typeLabel={typeLabel}
                  onView={openCalculationView}
                  highlightQuery={highlightQuery}
                />
              ))}
            </div>
          </details>
        </section>
      )}

      {/* Account Events History Section */}
      {(accountEvents === null || !hasFilters || visibleAccountEvents.length > 0) && <section id="account-events-section" className="mb-8 scroll-mt-6">
        <details className="group/section rounded-2xl border border-cyan-500/30 bg-cyan-950/10 p-5 backdrop-blur-sm transition-all">
          <summary className="flex cursor-pointer select-none items-center justify-between gap-3">
            <h2 className="font-display text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-indigo-400 drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]">
              🔑 კაბინეტების ცვლილებების ისტორია ({visibleAccountEvents.length})
            </h2>
            <span className="text-sm font-bold text-cyan-300 group-open/section:rotate-180 transition-transform">▼ ჩამოშლა</span>
          </summary>

          <div className="mt-5 space-y-3 border-t border-cyan-500/20 pt-4">
            {visibleAccountEvents.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/30 px-3 py-2 text-xs font-bold text-cyan-200">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-cyan-400"
                    checked={selectedAccountEvents.length === visibleAccountEvents.length}
                    onChange={(event) => setSelectedAccountEvents(event.target.checked ? visibleAccountEvents.map((item) => item.id) : [])}
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
            {visibleAccountEvents.length === 0 && <p className="text-xs text-parchment-dim">ცვლილებების ისტორია ჯერ ცარიელია.</p>}
            <div className="space-y-2">
          {visibleAccountEvents.map((event) => (
            <div key={event.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-ink-2/60 p-3 text-xs ${event.user?.role === "ADMIN" ? "border-cyan-400/35 bg-cyan-950/20" : "border-line"}`}>
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
                  <HighlightText value={eventStatusLabel[eventBaseType(event.type)] ?? eventLabel[eventBaseType(event.type)] ?? event.type} query={highlightQuery} />
                </span>
                <span className="ml-3 font-bold text-parchment-dim">იუზერი:</span>
                {event.user ? (
                  <span className="ml-2 inline-flex flex-wrap items-center gap-2">
                    {event.user.name && (
                      <span className="font-extrabold text-parchment-bright bg-parchment/10 px-2 py-0.5 rounded border border-parchment/20">
                        <HighlightText value={event.user.name} query={highlightQuery} />
                      </span>
                    )}
                    {event.user.publicId && (
                      <span className="admin-id-value-registered rounded bg-indigo-950/70 px-2 py-0.5 font-mono text-[11px] font-black border border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                        <HighlightText value={event.user.publicId} query={highlightQuery} />
                      </span>
                    )}
                    <span className="font-bold text-[#55e6e1]"><HighlightText value={event.user.email} query={highlightQuery} /></span>
                    <span className="text-xs font-semibold text-[#55e6e1]">
                      (Username: {event.user.username ? <HighlightText value={`@${event.user.username}`} query={highlightQuery} /> : <span className="text-amber-400/80 italic font-normal">არ აქვს</span>})
                    </span>
                    {event.user.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-orange-500/60 bg-orange-950/50 px-2 py-0.5 font-black text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.3)]">
                        <span><HighlightText value={event.user.adminId ?? "ADMIN"} query={highlightQuery} /></span>
                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">ადმინი</span>
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="ml-2 inline-flex flex-wrap items-center gap-2 text-parchment-dim">
                    <span><HighlightText value={event.emailSnapshot} query={highlightQuery} /></span>
                  </span>
                )}
                {event.oldEmail && event.newEmail && <span className="ml-3 text-parchment-dim"><HighlightText value={`${event.oldEmail} → ${event.newEmail}`} query={highlightQuery} /></span>}
              </div>
               <span className="text-parchment-dim"><HighlightText value={showDateTime(event.createdAt)} query={highlightQuery} /></span>
             </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  </section>}

      {showDeleteEventsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md space-y-4 rounded-2xl border border-rose-500/50 bg-[#120826] p-6 shadow-[0_0_50px_rgba(244,63,94,0.4)]">
            <button
              onClick={() => setShowDeleteEventsModal(false)}
              type="button"
              className="sticky top-1 right-1 z-50 float-right mb-2 flex items-center gap-1.5 rounded-full border border-rose-500/70 bg-gradient-to-r from-rose-950/95 via-red-950/95 to-rose-950/95 px-3 py-1.5 text-xs font-black text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.6)] transition-all hover:scale-105 hover:border-rose-400 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.9)] active:scale-95"
              title="დახურვა"
            >
              <span className="text-sm leading-none text-red-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">✕</span>
              <span className="tracking-tight">დახურვა</span>
            </button>
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
