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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-brass-2">ჩემი რუკები</h1>
        <div className="flex items-center gap-4 text-sm">
          <a href="/cabinet/settings" className="text-brass-2 underline decoration-brass/50">კაბინეტის მართვა</a>
          <button onClick={logout} className="text-parchment-dim underline decoration-line hover:text-parchment">გასვლა</button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-ember">{error}</p>}

      {charts === null && <p className="text-parchment-dim">იტვირთება…</p>}
      {charts?.length === 0 && (
        <p className="text-parchment-dim">
          ჯერ არაფერი შენახულა. გადადით <a href="/#calculator" className="underline decoration-brass/50">გამომთვლელზე</a>{" "}
          და დააჭირეთ „შენახვა კაბინეტში".
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {charts?.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-ink-2/60 p-4">
            <p className="text-xs uppercase tracking-wide text-brass/80">{TYPE_LABEL_KA[c.type]}</p>
            <p className="font-display mt-1 text-parchment">{c.label}</p>
            <p className="mt-1 text-xs text-parchment-dim">
              {c.name1}
              {c.name2 ? ` & ${c.name2}` : ""} · {new Date(c.createdAt).toLocaleDateString("ka-GE")}
            </p>
            <div className="mt-3 flex gap-3 text-sm">
              <button onClick={() => openChart(c.id)} className="text-brass-2 hover:underline">
                ნახვა
              </button>
              <button onClick={() => removeChart(c.id)} className="text-ember hover:underline">
                წაშლა
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-8 rounded-xl border border-line bg-ink-2/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-brass-2">{selected.label}</h2>
            <button onClick={() => setSelected(null)} className="text-sm text-parchment-dim hover:text-parchment">
              დახურვა
            </button>
          </div>
          <InterpretationText text={selected.interpretation} />
        </div>
      )}
    </div>
  );
}
