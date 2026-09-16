"use client";

import { useState } from "react";
import { readApiResponse } from "@/lib/apiResponse";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readApiResponse<{ message?: string; error?: string }>(res);
      if (!res.ok) setError(data.error || `სერვერის შეცდომა (${res.status})`);
      else setMessage(data.message || "თუ ანგარიში არსებობს, აღდგენის ბმული ელფოსტაზე გაიგზავნა.");
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-4 sm:pt-8 w-full max-w-full sm:max-w-md">
      <div className="glass-panel rounded-2xl sm:rounded-[32px] p-6 sm:p-9 border-amber-500/25 bg-gradient-to-b from-[#130a35]/90 via-[#0e0728]/95 to-[#080417]/95 backdrop-blur-2xl shadow-2xl w-full text-center space-y-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">პაროლის აღდგენა</h1>
        <p className="text-xs font-medium text-slate-300">შეიყვანეთ რეგისტრაციისას გამოყენებული ელფოსტა.</p>
        <form onSubmit={submit} className="space-y-4 text-left">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ელფოსტა"
            className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
          />
          {message && <p className="text-xs font-semibold text-emerald-400 text-center">{message}</p>}
          {error && <p className="text-xs font-semibold text-rose-400 text-center">{error}</p>}
          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all hover:scale-105 disabled:opacity-50"
          >
            {loading ? "…" : "აღდგენის ბმულის გაგზავნა"}
          </button>
          <a href="/cabinet" className="block text-center text-xs font-medium text-amber-300 underline decoration-amber-400/40 hover:text-amber-200">
            უკან შესვლაზე
          </a>
        </form>
      </div>
    </div>
  );
}
