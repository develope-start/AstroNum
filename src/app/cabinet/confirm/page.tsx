"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readApiResponse } from "@/lib/apiResponse";
import PasswordField from "@/components/PasswordField";

export default function ConfirmActionPage() {
  return (
    <Suspense fallback={<p className="pt-10 text-center text-parchment-dim">იტვირთება…</p>}>
      <ConfirmActionContent />
    </Suspense>
  );
}

function ConfirmActionContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const action = params.get("action") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isReset = action === "reset";
      const endpoint = isReset ? "/api/auth/reset-password" : "/api/auth/confirm";
      const body = isReset ? { token, password, confirmPassword } : { token };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await readApiResponse<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setMessage(data.message || "ოპერაცია წარმატებით დასრულდა");
      if (action === "delete") setTimeout(() => router.push("/cabinet"), 1200);
      else if (isReset) setTimeout(() => router.push("/cabinet"), 1200);
      else setTimeout(() => router.push("/cabinet/settings"), 1200);
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setLoading(false);
    }
  }

  const isReset = action === "reset";
  const title = action === "email" ? "ელფოსტის ცვლილების დადასტურება" : action === "password" ? "პაროლის ცვლილების დადასტურება" : action === "delete" ? "კაბინეტის წაშლის დადასტურება" : "პაროლის აღდგენა";

  return (
    <div className="mx-auto max-w-md pt-4 sm:pt-8 w-full max-w-full sm:max-w-md">
      <div className="glass-panel rounded-2xl sm:rounded-[32px] p-6 sm:p-9 border-amber-500/25 bg-gradient-to-b from-[#130a35]/90 via-[#0e0728]/95 to-[#080417]/95 backdrop-blur-2xl shadow-2xl w-full text-center space-y-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">{title}</h1>
        {!token && <p className="text-center text-xs font-semibold text-rose-400">დადასტურების ბმული არასწორია.</p>}
        {token && (
          <form onSubmit={submit} className="space-y-4 text-left">
            {isReset && (
              <>
                <PasswordField
                  required
                  minLength={8}
                  placeholder="ახალი პაროლი (მინ. 8 სიმბოლო)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                />
                <PasswordField
                  required
                  minLength={8}
                  placeholder="გაიმეორეთ ახალი პაროლი"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                />
              </>
            )}
            {message && <p className="text-xs font-semibold text-emerald-400 text-center">{message}</p>}
            {error && <p className="text-xs font-semibold text-rose-400 text-center">{error}</p>}
            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all hover:scale-105 disabled:opacity-50"
            >
              {loading ? "…" : isReset ? "პაროლის აღდგენა" : "დადასტურება"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
