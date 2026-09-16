"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readApiResponse } from "@/lib/apiResponse";

export default function CabinetSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({ user: null }));
        if (active && (!res.ok || !data.user)) router.replace("/cabinet");
      })
      .catch(() => {
        if (active) router.replace("/cabinet");
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function submitRequest(path: string, body: Record<string, string>) {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readApiResponse<{ message?: string; error?: string }>(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setMessage(data.message || "მოთხოვნა შესრულდა");
      setEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setLoading(false);
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    await submitRequest("/api/account/email/request", { email, currentPassword });
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    await submitRequest("/api/account/password/request", { currentPassword, newPassword, confirmPassword });
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!window.confirm("ნამდვილად გსურთ კაბინეტის წაშლა? ეს მოქმედება შეუქცევადია.")) return;
    await submitRequest("/api/account/delete/request", { currentPassword });
  }

  const inputClass =
    "w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]";

  return (
    <div className="mx-auto max-w-2xl space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="glass-panel flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-amber-500/25 bg-gradient-to-r from-[#130a35]/90 via-[#0e0728]/95 to-[#130a35]/90 backdrop-blur-2xl shadow-xl">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">კაბინეტის პარამეტრები</h1>
          <p className="mt-1 text-xs text-slate-300">ანგარიშის უსაფრთხოება და მონაცემთა განახლება</p>
        </div>
        <button
          onClick={() => router.push("/cabinet/dashboard")}
          className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-400/20 shrink-0"
        >
          ჩემი რუკები
        </button>
      </div>

      {message && (
        <p className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-300 text-center shadow-lg">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300 text-center shadow-lg">
          {error}
        </p>
      )}

      <section className="glass-panel rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-amber-500/25 bg-[#120833]/90 shadow-xl space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-amber-300">ელფოსტის შეცვლა</h2>
          <p className="mt-0.5 text-xs text-slate-300">ახალ მისამართზე გამოგეგზავნებათ დადასტურების ბმული.</p>
        </div>
        <form onSubmit={changeEmail} className="space-y-3.5">
          <input className={inputClass} type="email" required placeholder="ახალი ელფოსტა" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputClass} type="password" required placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <button
            disabled={loading}
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-105 disabled:opacity-50"
          >
            დადასტურების წერილის გაგზავნა
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-amber-500/25 bg-[#120833]/90 shadow-xl space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-amber-300">პაროლის შეცვლა</h2>
          <p className="mt-0.5 text-xs text-slate-300">ცვლილება ძალაში შევა ელფოსტაზე მიღებული დადასტურების შემდეგ.</p>
        </div>
        <form onSubmit={changePassword} className="space-y-3.5">
          <input className={inputClass} type="password" required placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <input className={inputClass} type="password" required minLength={8} placeholder="ახალი პაროლი (მინ. 8 სიმბოლო)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input className={inputClass} type="password" required minLength={8} placeholder="გაიმეორეთ ახალი პაროლი" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button
            disabled={loading}
            className="w-full sm:w-auto rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-3 text-xs font-extrabold text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all hover:scale-105 disabled:opacity-50"
          >
            პაროლის შეცვლის მოთხოვნა
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-2xl sm:rounded-[28px] p-5 sm:p-7 border-rose-500/30 bg-rose-950/20 shadow-xl space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-rose-400">კაბინეტის წაშლა</h2>
          <p className="mt-0.5 text-xs text-slate-300">ყველა შენახული რუკა წაიშლება. საბოლოო დადასტურების ბმული ელფოსტაზე გამოგეგზავნებათ.</p>
        </div>
        <form onSubmit={deleteAccount} className="space-y-3.5">
          <input className={inputClass} type="password" required placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <button
            disabled={loading}
            className="w-full sm:w-auto rounded-full border border-rose-500/50 bg-rose-950/50 px-6 py-3 text-xs font-bold text-rose-300 transition-all hover:bg-rose-900/60 disabled:opacity-50"
          >
            წაშლის დადასტურების გაგზავნა
          </button>
        </form>
      </section>
    </div>
  );
}
