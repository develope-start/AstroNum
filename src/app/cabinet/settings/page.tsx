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

  const inputClass = "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-parchment outline-none focus:border-brass";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brass-2">კაბინეტის მართვა</h1>
        <button onClick={() => router.push("/cabinet/dashboard")} className="text-sm text-parchment-dim underline">ჩემი რუკები</button>
      </div>

      {message && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-sm text-ember">{error}</p>}

      <section className="rounded-xl border border-line bg-ink-2/60 p-5">
        <h2 className="font-display mb-1 text-lg text-brass-2">ელფოსტის შეცვლა</h2>
        <p className="mb-4 text-xs text-parchment-dim">ახალ მისამართზე გამოგეგზავნებათ დადასტურების ბმული.</p>
        <form onSubmit={changeEmail} className="space-y-3">
          <input className={inputClass} type="email" required placeholder="ახალი ელფოსტა" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputClass} type="password" required placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <button disabled={loading} className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-50">დადასტურების წერილის გაგზავნა</button>
        </form>
      </section>

      <section className="rounded-xl border border-line bg-ink-2/60 p-5">
        <h2 className="font-display mb-1 text-lg text-brass-2">პაროლის შეცვლა</h2>
        <p className="mb-4 text-xs text-parchment-dim">ცვლილება ძალაში შევა ელფოსტაზე მიღებული დადასტურების შემდეგ.</p>
        <form onSubmit={changePassword} className="space-y-3">
          <input className={inputClass} type="password" required placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <input className={inputClass} type="password" required minLength={8} placeholder="ახალი პაროლი (მინ. 8 სიმბოლო)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input className={inputClass} type="password" required minLength={8} placeholder="გაიმეორეთ ახალი პაროლი" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button disabled={loading} className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-50">პაროლის შეცვლის მოთხოვნა</button>
        </form>
      </section>

      <section className="rounded-xl border border-ember/40 bg-ember/5 p-5">
        <h2 className="font-display mb-1 text-lg text-ember">კაბინეტის წაშლა</h2>
        <p className="mb-4 text-xs text-parchment-dim">ყველა შენახული რუკა წაიშლება. საბოლოო დადასტურების ბმული ელფოსტაზე გამოგეგზავნებათ.</p>
        <form onSubmit={deleteAccount} className="space-y-3">
          <input className={inputClass} type="password" required placeholder="მიმდინარე პაროლი" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <button disabled={loading} className="rounded-full border border-ember px-4 py-2 text-sm text-ember disabled:opacity-50">წაშლის დადასტურების გაგზავნა</button>
        </form>
      </section>
    </div>
  );
}
