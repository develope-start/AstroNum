"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readApiResponse } from "@/lib/apiResponse";
import PasswordField from "@/components/PasswordField";
import { User, Mail, LogIn, UserPlus, Loader2, Sparkles, AtSign, KeyRound } from "lucide-react";

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
      const data = await readApiResponse<{ error?: string; role?: "USER" | "ADMIN" }>(res);
      if (!res.ok) {
        setError(data.error || "შეცდომა");
        return;
      }
      router.replace(data.role === "ADMIN" ? "/admin" : "/cabinet/dashboard");
      router.refresh();
    } catch {
      setError("ქსელის შეცდომა");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cabinet-page mx-auto max-w-md pt-3 sm:pt-8 w-full max-w-full sm:max-w-md px-2">
      <div className="prism-card rounded-3xl p-6 sm:p-9 w-full shadow-[0_25px_60px_rgba(0,0,0,0.75)]">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-500/10 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
            <Sparkles className="h-6 w-6 text-sky-400 animate-pulse" />
          </div>
          <div className="telemetry-badge inline-flex items-center gap-2 mb-2">
            <span className="live-beacon"></span>
            <span className="telemetry-badge-text">პირადი კაბინეტი</span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">
            {mode === "login" ? "ავტორიზაცია" : "რეგისტრაცია"}
          </h1>
          <p className="mt-1 text-xs text-slate-300/80">შენახული რუკების მართვა და ასტროლოგიური არქივი</p>
        </div>

        <div className="mb-6 flex rounded-2xl border border-white/10 bg-[#060813] p-1.5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              mode === "login"
                ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>შესვლა</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-white shadow-[0_0_18px_rgba(56,189,248,0.35)]"
                : "text-slate-400 hover:text-slate-200"
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
                <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-300">
                  <User className="h-3.5 w-3.5 text-sky-400" />
                  <span>სახელი</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-sky-400 focus:shadow-[0_0_24px_rgba(56,189,248,0.25)]"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-300">
                  <AtSign className="h-3.5 w-3.5 text-purple-400" />
                  <span>Username</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-purple-400 focus:shadow-[0_0_24px_rgba(168,85,247,0.25)]"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-300">
              <Mail className="h-3.5 w-3.5 text-sky-400" />
              <span>{mode === "signup" ? "ელ. ფოსტა" : "ელ. ფოსტა ან Username"}</span>
            </label>
            <input
              type={mode === "signup" ? "email" : "text"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-sky-400 focus:shadow-[0_0_24px_rgba(56,189,248,0.25)]"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-sky-400" />
                <span>პაროლი</span>
              </span>
              {mode === "login" && (
                <Link
                  href="/cabinet/forgot-password"
                  className="text-[0.72rem] font-semibold text-sky-400 hover:text-sky-300 underline"
                >
                  დაგავიწყდათ?
                </Link>
              )}
            </label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-sm font-semibold text-white outline-none transition-all focus:border-sky-400 focus:shadow-[0_0_24px_rgba(56,189,248,0.25)]"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs font-semibold text-rose-300 text-center backdrop-blur-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="prism-btn-primary w-full py-3.5 text-xs sm:text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin text-white" />
            ) : mode === "login" ? (
              "შესვლა კაბინეტში"
            ) : (
              "ანგარიშის შექმნა"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
