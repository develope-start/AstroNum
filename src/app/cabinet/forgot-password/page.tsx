"use client";

import { useState } from "react";
import Link from "next/link";
import { readApiResponse } from "@/lib/apiResponse";
import { Mail, KeyRound, ArrowLeft, Loader2 } from "lucide-react";

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
    <div className="mx-auto max-w-md pt-4 sm:pt-8 w-full max-w-full sm:max-w-md px-2">
      <div className="prism-card rounded-3xl p-6 sm:p-9 w-full text-center space-y-5 shadow-[0_25px_60px_rgba(0,0,0,0.75)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
          <KeyRound className="h-6 w-6 text-sky-400" />
        </div>
        <div>
          <div className="telemetry-badge inline-flex items-center gap-2 mb-2">
            <span className="live-beacon"></span>
            <span className="telemetry-badge-text">პაროლის აღდგენა</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">პაროლის აღდგენა</h1>
          <p className="mt-1 text-xs text-slate-300/80">შეიყვანეთ რეგისტრაციისას გამოყენებული ელფოსტა.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 text-left">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-300">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              <span>ელ. ფოსტა</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-400 focus:shadow-[0_0_24px_rgba(56,189,248,0.25)]"
            />
          </div>

          {message && (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-3 text-xs font-semibold text-emerald-300 text-center backdrop-blur-md">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300 text-center backdrop-blur-md">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            className="prism-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-xs sm:text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "აღდგენის ბმულის გაგზავნა"}
          </button>

          <Link
            href="/cabinet"
            className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-sky-300 hover:text-sky-200 transition-colors pt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            უკან შესვლაზე
          </Link>
        </form>
      </div>
    </div>
  );
}
