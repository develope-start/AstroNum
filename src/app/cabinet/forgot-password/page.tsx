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
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="font-display mb-2 text-center text-2xl text-brass-2">პაროლის აღდგენა</h1>
      <p className="mb-6 text-center text-xs text-parchment-dim">შეიყვანეთ რეგისტრაციისას გამოყენებული ელფოსტა.</p>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ელფოსტა" className="w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-parchment outline-none focus:border-brass" />
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-ember">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-brass py-2.5 font-medium text-ink disabled:opacity-50">{loading ? "…" : "აღდგენის ბმულის გაგზავნა"}</button>
        <a href="/cabinet" className="block text-center text-sm text-parchment-dim underline">უკან შესვლაზე</a>
      </form>
    </div>
  );
}
