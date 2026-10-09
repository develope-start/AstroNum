"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { readApiResponse } from "@/lib/apiResponse";
import { X, Shield, Lock, Mail, Trash2, ArrowLeft } from "lucide-react";
import PasswordField from "@/components/PasswordField";

export default function CabinetSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [canDeleteAccount, setCanDeleteAccount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({ user: null }));
        if (active && (!res.ok || !data.user)) {
          router.replace("/cabinet");
          return;
        }
        if (active && data.user) {
          setCanDeleteAccount(!(data.user.role === "ADMIN" && data.user.adminId === "ADMIN"));
        }
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

  function openDeleteModal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!deletePassword.trim()) {
      setError("კაბინეტის წასაშლელად ჩაწერეთ მიმდინარე პაროლი");
      return;
    }
    setShowDeleteModal(true);
  }

  async function confirmDeleteAccount() {
    setShowDeleteModal(false);
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/account/delete/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const data = await readApiResponse<{ message?: string; error?: string; ok?: boolean }>(res);
      if (!res.ok) {
        setError(data.error || `სერვერის შეცდომა (${res.status})`);
        return;
      }
      setMessage(data.message || "კაბინეტი წაიშალა");
      setDeletePassword("");
      setTimeout(() => {
        window.location.href = "/cabinet";
      }, 800);
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-[#070914] px-4 py-3 text-sm font-semibold text-white outline-none transition-all placeholder:text-slate-500 focus:border-sky-400 focus:shadow-[0_0_24px_rgba(56,189,248,0.25)]";

  return (
    <div className="cabinet-page mx-auto max-w-2xl space-y-6 w-full max-w-full overflow-x-hidden px-2 sm:px-4 py-4">
      {/* Header */}
      <div className="prism-card flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl p-6 sm:p-8">
        <div>
          <div className="telemetry-badge inline-flex items-center gap-2 mb-2">
            <span className="live-beacon"></span>
            <span className="telemetry-badge-text">უსაფრთხოება</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">კაბინეტის პარამეტრები</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300/80">ანგარიშის უსაფრთხოება და მონაცემთა განახლება</p>
        </div>
        <button
          onClick={() => router.push("/cabinet/dashboard")}
          className="flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2.5 text-xs font-bold text-sky-200 transition-all hover:bg-sky-400/20 hover:border-sky-400/50 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          ჩემი რუკები
        </button>
      </div>

      {message && (
        <p className="rounded-2xl border border-emerald-400/30 bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-300 text-center shadow-lg backdrop-blur-md">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300 text-center shadow-lg backdrop-blur-md">
          {error}
        </p>
      )}

      {/* Change Email */}
      <section className="prism-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-400/20">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-white">ელფოსტის შეცვლა</h2>
            <p className="text-xs text-slate-400">ახალ მისამართზე გამოგეგზავნებათ დადასტურების ბმული.</p>
          </div>
        </div>
        <form onSubmit={changeEmail} className="space-y-4 pt-2">
          <input className={inputClass} type="email" required placeholder="ახალი ელფოსტა" value={email} onChange={(e) => setEmail(e.target.value)} />
          <PasswordField className={inputClass} required autoComplete="current-password" placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <button
            disabled={loading}
            className="prism-btn-primary w-full sm:w-auto px-6 py-3 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
          >
            დადასტურების წერილის გაგზავნა
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="prism-card rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-400/20">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-white">პაროლის შეცვლა</h2>
            <p className="text-xs text-slate-400">ცვლილება ძალაში შევა ელფოსტაზე მიღებული დადასტურების შემდეგ.</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-4 pt-2">
          <PasswordField className={inputClass} required autoComplete="current-password" placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <PasswordField className={inputClass} required minLength={8} autoComplete="new-password" placeholder="ახალი პაროლი (მინ. 8 სიმბოლო)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <PasswordField className={inputClass} required minLength={8} autoComplete="new-password" placeholder="გაიმეორეთ ახალი პაროლი" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button
            disabled={loading}
            className="prism-btn-primary w-full sm:w-auto px-6 py-3 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
          >
            პაროლის შეცვლის მოთხოვნა
          </button>
        </form>
      </section>

      {/* Delete Account */}
      {canDeleteAccount && (
        <section className="prism-card rounded-3xl p-6 sm:p-8 space-y-4 border border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <Trash2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-rose-300">კაბინეტის წაშლა</h2>
              <p className="text-xs text-slate-400">
                ჩაწერეთ მიმდინარე პაროლი. ღილაკზე დაჭერისას ამოხტება დადასტურების ფანჯარა.
              </p>
            </div>
          </div>
          <form onSubmit={openDeleteModal} className="space-y-4 pt-2">
            <PasswordField
              className={inputClass}
              required
              autoComplete="current-password"
              placeholder="მიმდინარე პაროლი"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-xl border border-rose-500/60 bg-rose-950/60 px-6 py-3 text-xs font-bold text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all hover:bg-rose-900 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              კაბინეტის წაშლა
            </button>
          </form>
        </section>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="prism-card relative max-w-md w-full rounded-3xl p-6 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.3)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 text-rose-400">
                <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <Shield className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-white">კაბინეტის წაშლა</h3>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                type="button"
                className="text-slate-400 hover:text-white p-1"
                aria-label="დახურვა"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ნამდვილად თანახმა ხართ თუ არა წაშალოთ თქვენი ანგარიში და მასთან დაკავშირებული მონაცემები?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                გაუქმება
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmDeleteAccount}
                className="rounded-xl border border-rose-500 bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "იშლება..." : "თანხმობა, წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
