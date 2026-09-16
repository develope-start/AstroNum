"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterpretationText from "@/components/InterpretationText";

interface ChartSummary {
  id: string;
  type: "NATAL" | "SYNASTRY" | "TRANSIT";
  label: string;
  name1: string;
  name2: string | null;
  date1: string;
  transitDate: string | null;
  createdAt: string;
}

const TYPE_LABEL_KA: Record<string, string> = {
  NATAL: "ნატალური",
  SYNASTRY: "სინასტრია",
  TRANSIT: "ტრანზიტი",
};

export default function DashboardPage() {
  const router = useRouter();
  const [charts, setCharts] = useState<ChartSummary[] | null>(null);
  const [selected, setSelected] = useState<{ interpretation: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/charts").then(async (res) => {
      if (res.status === 401) {
        router.push("/cabinet");
        return;
      }
      const data = await res.json();
      setCharts(data.charts);
    });
  }, [router]);

  async function openChart(id: string) {
    const res = await fetch(`/api/charts/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setSelected({ interpretation: data.interpretation, label: data.label });
  }

  async function removeChart(id: string) {
    await fetch(`/api/charts/${id}`, { method: "DELETE" });
    setCharts((prev) => prev?.filter((c) => c.id !== id) ?? null);
    setSelected(null);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="glass-panel flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-amber-500/25 bg-gradient-to-r from-[#130a35]/90 via-[#0e0728]/95 to-[#130a35]/90 backdrop-blur-2xl shadow-xl">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">ჩემი შენახული რუკები</h1>
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
            className="flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-950/50 px-4 py-2 text-purple-300 transition-all hover:bg-purple-900/50"
          >
            გასვლა
          </button>
        </div>
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        {charts?.map((c) => (
          <div
            key={c.id}
            className="glass-panel group rounded-2xl p-5 border-amber-500/25 bg-gradient-to-b from-[#130a35]/85 to-[#080417]/95 transition-all hover:border-amber-400/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col justify-between space-y-3"
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
                onClick={() => openChart(c.id)}
                className="flex items-center gap-1 rounded-full bg-amber-500/20 px-4 py-1.5 text-amber-300 transition-all hover:bg-amber-400 hover:text-slate-950"
              >
                ნახვა
              </button>
              <button
                onClick={() => removeChart(c.id)}
                className="flex items-center gap-1 rounded-full bg-rose-950/40 border border-rose-500/30 px-4 py-1.5 text-rose-300 transition-all hover:bg-rose-900/60"
              >
                წაშლა
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="glass-panel mt-8 rounded-2xl sm:rounded-[28px] p-6 sm:p-8 border-amber-500/25 bg-[#120833]/95 backdrop-blur-2xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <h2 className="font-display text-xl font-bold text-amber-300">{selected.label}</h2>
            <button
              onClick={() => setSelected(null)}
              className="rounded-full border border-amber-400/30 px-3.5 py-1 text-xs font-bold text-slate-300 hover:text-amber-300 hover:bg-amber-400/10"
            >
              დახურვა
            </button>
          </div>
          <InterpretationText text={selected.interpretation} />
        </div>
      )}
    </div>
  );
}
