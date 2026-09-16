"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/lib/apiResponse";
import PasswordField from "@/components/PasswordField";

interface AdminRow {
  id: string;
  adminId: string | null;
  name: string | null;
  username: string | null;
  email: string;
  createdAt: string;
  calculationCount: number;
}

const emptyForm = { name: "", username: "", email: "", password: "" };

function formatDate(value: string) {
  return new Date(value).toLocaleString("ka-GE", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", username: "", email: "", password: "" });
  const [filters, setFilters] = useState({ id: "", name: "", username: "", email: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/admins", { cache: "no-store" });
      const data = await readApiResponse<{ admins?: AdminRow[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error || "ადმინისტრატორების ჩატვირთვა ვერ მოხერხდა");
      setAdmins(data.admins ?? []);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "სერვერის შეცდომა");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function request(url: string, options: RequestInit) {
    setError(null);
    setMessage(null);
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "ოპერაცია ვერ შესრულდა");
    setMessage(data.message || "ცვლილება შენახულია");
    await load();
  }

  async function addAdmin(event: FormEvent) {
    event.preventDefault();
    try {
      await request("/api/admin/admins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ადმინისტრატორის დამატება ვერ მოხერხდა");
    }
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const body = Object.fromEntries(Object.entries(editForm).filter(([, value]) => value.trim()));
    try {
      await request(`/api/admin/admins/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setEditing(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ადმინისტრატორის შეცვლა ვერ მოხერხდა");
    }
  }

  async function deleteAdmin(admin: AdminRow) {
    if (!window.confirm(`ნამდვილად გსურთ ${admin.name || admin.email}-ის წაშლა? ანგარიში გადავა ურნაში.`)) return;
    try {
      await request(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "ადმინისტრატორის წაშლა ვერ მოხერხდა");
    }
  }

  const filteredAdmins = useMemo(() => admins.filter((admin) => {
    const created = admin.createdAt.slice(0, 10);
    const includes = (value: string | null, query: string) => !query.trim() || value?.toLocaleLowerCase("ka-GE").includes(query.trim().toLocaleLowerCase("ka-GE"));
    return includes(admin.adminId, filters.id) && includes(admin.name, filters.name) && includes(admin.username, filters.username) && includes(admin.email, filters.email) &&
      (!filters.from || created >= filters.from) && (!filters.to || created <= filters.to);
  }), [admins, filters]);

  const input = "w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-parchment outline-none focus:border-brass";
  const button = "rounded-full border border-brass/60 px-4 py-2 text-sm text-brass-2 hover:bg-brass/10 disabled:opacity-40";
  const danger = "rounded-full border border-ember px-4 py-2 text-sm text-ember hover:bg-ember/10";

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-brass-2">ადმინისტრატორების მართვა</h1>
          <p className="mt-1 text-sm text-parchment-dim">მთავარი ადმინისტრატორი: ADMIN · დამატებითი: ADMIN1, ADMIN2...</p>
        </div>
        <a href="/admin" className={button}>ადმინის პანელი</a>
      </div>

      {message && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-400">{message}</p>}
      {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-sm text-ember">{error}</p>}

      <section className="rounded-2xl border border-brass/40 bg-ink-2/60 p-5">
        <h2 className="font-display mb-4 text-xl text-brass-2">ახალი ადმინისტრატორის დამატება</h2>
        <form onSubmit={addAdmin} className="grid gap-3 sm:grid-cols-4">
          <input className={input} required placeholder="სახელი" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={input} required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className={input} required type="email" placeholder="ელფოსტა" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <PasswordField className={input} required minLength={8} autoComplete="new-password" placeholder="პაროლი (მინ. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className={`${button} sm:col-span-3 sm:justify-self-end`} type="submit">ადმინისტრატორის დამატება</button>
        </form>
      </section>

      <section>
        <h2 className="font-display mb-3 text-xl text-brass-2">ადმინისტრატორების სია</h2>
        <div className="mb-4 grid gap-3 rounded-xl border border-line bg-ink-2/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <input className={input} placeholder="ID: ADMIN1" value={filters.id} onChange={(e) => setFilters({ ...filters, id: e.target.value })} />
          <input className={input} placeholder="სახელი" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
          <input className={input} placeholder="Username" value={filters.username} onChange={(e) => setFilters({ ...filters, username: e.target.value })} />
          <input className={input} placeholder="ელფოსტა" value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
          <input className={input} type="date" title="დამატების თარიღიდან" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <input className={input} type="date" title="დამატების თარიღამდე" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        {loading && <p className="text-sm text-parchment-dim">იტვირთება...</p>}
        {!loading && filteredAdmins.length === 0 && <p className="text-sm text-parchment-dim">შესაბამისი ადმინისტრატორი ვერ მოიძებნა.</p>}
        <div className="space-y-3">
          {filteredAdmins.map((admin) => (
            <article key={admin.id} className="rounded-xl border border-line bg-ink-2/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-parchment"><span className="mr-3 text-orange-400">{admin.adminId}</span>{admin.name || "სახელი მიუთითებელი არ არის"}</p>
                  <p className="text-sm text-[#55e6e1]">@{admin.username} · {admin.email}</p>
                  <p className="text-xs text-parchment-dim">დამატდა: {formatDate(admin.createdAt)} · რუკები: {admin.calculationCount}</p>
                </div>
                {admin.adminId !== "ADMIN" && <div className="flex gap-2"><button className={button} onClick={() => { setEditing(admin); setEditForm({ name: admin.name || "", username: admin.username || "", email: admin.email, password: "" }); }}>რედაქტირება</button><button className={danger} onClick={() => deleteAdmin(admin)}>წაშლა</button></div>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <form onSubmit={saveEdit} className="w-full max-w-md space-y-4 rounded-2xl border border-line bg-ink p-5">
            <h2 className="font-display text-xl text-brass-2">{editing.adminId}-ის რედაქტირება</h2>
            <input className={input} required placeholder="სახელი" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <input className={input} required placeholder="Username" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
            <input className={input} required type="email" placeholder="ელფოსტა" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <PasswordField className={input} minLength={8} autoComplete="new-password" placeholder="ახალი პაროლი (არასავალდებულო)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            <div className="flex justify-end gap-2"><button type="button" className={button} onClick={() => setEditing(null)}>გაუქმება</button><button className={button} type="submit">შენახვა</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
