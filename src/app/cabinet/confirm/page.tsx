"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readApiResponse } from "@/lib/apiResponse";

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
    <div className="mx-auto max-w-sm pt-10">
      <h1 className="font-display mb-4 text-center text-2xl text-brass-2">{title}</h1>
      {!token && <p className="text-center text-sm text-ember">დადასტურების ბმული არასწორია.</p>}
      {token && (
        <form onSubmit={submit} className="space-y-4">
          {isReset && (
            <>
              <input type="password" required minLength={8} placeholder="ახალი პაროლი (მინ. 8 სიმბოლო)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-parchment outline-none focus:border-brass" />
              <input type="password" required minLength={8} placeholder="გაიმეორეთ ახალი პაროლი" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-parchment outline-none focus:border-brass" />
            </>
          )}
          {message && <p className="text-sm text-emerald-400">{message}</p>}
          {error && <p className="text-sm text-ember">{error}</p>}
          <button disabled={loading} className="w-full rounded-full bg-brass py-2.5 font-medium text-ink disabled:opacity-50">{loading ? "…" : isReset ? "პაროლის აღდგენა" : "დადასტურება"}</button>
        </form>
      )}
    </div>
  );
}
