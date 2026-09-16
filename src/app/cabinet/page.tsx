"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, LogIn, UserPlus, Loader2, Sparkles, AtSign } from "lucide-react";

export default function CabinetPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "signup" ? { name, username, email, password } : { identifier: email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "შეცდომა");
        return;
      }
      router.push("/cabinet/dashboard");
      router.refresh();
    } catch {
      setError("ქსელის შეცდომა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md pt-6 sm:pt-10">
      <div className="glass-panel rounded-[32px] p-7 sm:p-9 border-amber-500/25 bg-gradient-to-b from-[#130a35]/90 via-[#0e0728]/95 to-[#080417]/95 backdrop-blur-2xl shadow-2xl">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.3)]">
            <Sparkles className="h-6 w-6 text-amber-300 animate-pulse" />
          </div>
          <h1 className="font-display text-2xl font-bold text-amber-300 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">პირადი კაბინეტი</h1>
          <p className="mt-1 text-xs font-medium text-slate-300">შენახული რუკების მართვა და ასტროლოგიური არქივი</p>
        </div>

        <div className="mb-7 flex rounded-full border border-amber-500/25 bg-[#080418] p-1.5 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-all ${
              mode === "login"
                ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                : "text-slate-300 hover:text-amber-300"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>შესვლა</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-bold transition-all ${
              mode === "signup"
                ? "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                : "text-slate-300 hover:text-amber-300"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>რეგისტრაცია</span>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                  <User className="h-3.5 w-3.5 text-amber-400" />
                  <span>სახელი</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                  <AtSign className="h-3.5 w-3.5 text-amber-400" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="მაგ. astro_user"
                  className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all placeholder:text-slate-500 focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                />
              </div>
            </>
          )}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Mail className="h-3.5 w-3.5 text-amber-400" />
              <span>{mode === "login" ? "Username ან ელფოსტა" : "ელფოსტა"}</span>
            </label>
            <input
              type={mode === "login" ? "text" : "email"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>პაროლი</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-amber-500/25 bg-[#080418] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition-all focus:border-amber-400 focus:shadow-[0_0_24px_rgba(245,158,11,0.25)]"
            />
          </div>
          {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 font-extrabold text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : mode === "login" ? (
              "შესვლა"
            ) : (
              "ანგარიშის შექმნა"
            )}
          </button>
          {mode === "login" && (
            <a href="/cabinet/forgot-password" className="block text-center text-xs font-medium text-amber-300 underline decoration-amber-400/40 hover:text-amber-200">
              დაგავიწყდათ პაროლი?
            </a>
          )}
        </form>
      </div>
    </div>
  );
}


