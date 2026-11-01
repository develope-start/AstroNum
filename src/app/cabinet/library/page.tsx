"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, BookOpen, FileText, Languages, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";

interface LibraryDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  sourceLanguage: "en" | "ru";
  translatedText: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FullDocument extends LibraryDocument {
  sourceText: string;
}

interface ApiError {
  error?: string;
}

async function responseJson<T>(response: Response): Promise<T & ApiError> {
  return response.json().catch(() => ({} as T & ApiError));
}

function languageName(language: "en" | "ru") {
  return language === "ru" ? "რუსული" : "ინგლისური";
}

export default function DocumentLibraryPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [selected, setSelected] = useState<FullDocument | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<"en" | "ru">("en");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    const response = await fetch("/api/library/documents", { cache: "no-store" });
    const data = await responseJson<{ documents?: LibraryDocument[] }>(response);
    if (response.status === 401) {
      router.replace("/cabinet");
      return;
    }
    if (!response.ok) throw new Error(data.error || "ბიბლიოთეკის ჩატვირთვა ვერ მოხერხდა.");
    setDocuments(data.documents ?? []);
  }, [router]);

  useEffect(() => {
    let active = true;
    refreshDocuments()
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "ბიბლიოთეკის ჩატვირთვა ვერ მოხერხდა.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [refreshDocuments]);

  const selectedIsTranslated = Boolean(selected?.translatedText);
  const translationLabel = useMemo(() => selected?.translatedText
    ? "თარგმანი მზადაა"
    : selected ? "ჯერ ნათარგმნი არ არის" : "", [selected]);

  async function openDocument(documentId: string) {
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/library/documents/${documentId}`, { cache: "no-store" });
    const data = await responseJson<{ document?: FullDocument }>(response);
    if (!response.ok || !data.document) throw new Error(data.error || "დოკუმენტი ვერ გაიხსნა.");
    setSelected(data.document);
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("აირჩიეთ PDF, DOCX ან TXT ფაილი.");
      return;
    }
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("sourceLanguage", sourceLanguage);
      const response = await fetch("/api/library/documents", { method: "POST", body: formData });
      const data = await responseJson<{ document?: LibraryDocument; characterCount?: number }>(response);
      if (!response.ok || !data.document) throw new Error(data.error || "ატვირთვა ვერ მოხერხდა.");
      await refreshDocuments();
      await openDocument(data.document.id);
      setNotice(`დოკუმენტიდან ამოღებულია ${data.characterCount?.toLocaleString("ka-GE") ?? ""} სიმბოლო.`);
      if (fileInput.current) fileInput.current.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ატვირთვა ვერ მოხერხდა.");
    } finally {
      setUploading(false);
    }
  }

  async function translateSelected() {
    if (!selected) return;
    setTranslating(true);
    setError(null);
    setNotice(null);
    setProgress({ done: 0, total: 0 });
    try {
      for (let chunkIndex = 0; chunkIndex < 100; chunkIndex += 1) {
        const response = await fetch(`/api/library/documents/${selected.id}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chunkIndex }),
        });
        const data = await responseJson<{
          chunkIndex?: number;
          totalChunks?: number;
          completedChunks?: number;
          translatedText?: string | null;
          error?: string;
        }>(response);
        if (!response.ok) throw new Error(data.error || "თარგმნა ვერ მოხერხდა.");
        const total = data.totalChunks ?? 0;
        setProgress({ done: data.completedChunks ?? chunkIndex + 1, total });
        if (typeof data.translatedText === "string") {
          setSelected((current) => current ? { ...current, translatedText: data.translatedText ?? null } : current);
          setDocuments((current) => current.map((item) => item.id === selected.id
            ? { ...item, translatedText: data.translatedText ?? null }
            : item));
          setNotice("თარგმანი მზადაა. ტექსტი შეგიძლიათ ჩამოტვირთოთ ან წაიკითხოთ ქვემოთ.");
          return;
        }
        if (total > 0 && chunkIndex + 1 >= total) break;
      }
      throw new Error("თარგმანი ბოლომდე ვერ დასრულდა. შეგიძლიათ ხელახლა სცადოთ.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "თარგმნა ვერ მოხერხდა.");
    } finally {
      setTranslating(false);
    }
  }

  async function deleteSelected() {
    if (!selected || !window.confirm(`წავშალოთ „${selected.title}“ ბიბლიოთეკიდან?`)) return;
    setError(null);
    try {
      const response = await fetch(`/api/library/documents/${selected.id}`, { method: "DELETE" });
      const data = await responseJson<{ ok?: boolean }>(response);
      if (!response.ok) {
        setError(data.error || "დოკუმენტის წაშლა ვერ მოხერხდა.");
        return;
      }
      setDocuments((current) => current.filter((item) => item.id !== selected.id));
      setSelected(null);
      setNotice("დოკუმენტი წაიშალა.");
    } catch {
      setError("ქსელის შეცდომა — დოკუმენტი ვერ წაიშალა.");
    }
  }

  function downloadTranslation() {
    if (!selected?.translatedText) return;
    const blob = new Blob([selected.translatedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.title}.ka.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/cabinet/dashboard" className="text-sm text-cyan-300 hover:text-cyan-200">← პირად კაბინეტში დაბრუნება</Link>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">პირადი ბიბლიოთეკა</h1>
              <p className="mt-1 text-sm text-slate-400">ატვირთეთ ინგლისური ან რუსული ტექსტები და თარგმნეთ ქართულად.</p>
            </div>
          </div>
        </div>
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <section className="space-y-5">
          <form onSubmit={handleUpload} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl sm:p-5">
            <h2 className="flex items-center gap-2 font-semibold text-white"><Upload className="h-4 w-4 text-cyan-300" />დოკუმენტის დამატება</h2>
            <label className="mt-4 block text-xs font-medium text-slate-300" htmlFor="source-language">დოკუმენტის ენა</label>
            <select
              id="source-language"
              value={sourceLanguage}
              onChange={(event) => setSourceLanguage(event.target.value as "en" | "ru")}
              className="mt-1 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/50"
            >
              <option value="en">ინგლისური</option>
              <option value="ru">რუსული</option>
            </select>
            <label className="mt-4 block text-xs font-medium text-slate-300" htmlFor="document-file">ფაილი (PDF, DOCX, TXT; მაქს. 3.5 MB)</label>
            <input
              ref={fileInput}
              id="document-file"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="mt-1 block w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 p-2 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-cyan-200"
            />
            <button
              type="submit"
              disabled={uploading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
            >
              {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {uploading ? "იტვირთება და მუშავდება..." : "ბიბლიოთეკაში დამატება"}
            </button>
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              ფაილის ორიგინალი არ ინახება — ინახება ამოღებული ტექსტი თქვენს ანგარიშში. თარგმნისას ტექსტი OpenRouter-ს, Groq-ს ან კონფიგურირებულ სათადარიგო სერვისს გადაეცემა.
            </p>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">ატვირთეთ მხოლოდ მასალა, რომლის პირადი გამოყენებისა და დამუშავების უფლებაც გაქვთ.</p>
          </form>

          <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">ჩემი დოკუმენტები</h2>
              <span className="text-xs text-slate-500">{documents.length}/100</span>
            </div>
            {loading ? (
              <p className="flex items-center gap-2 py-5 text-sm text-slate-400"><LoaderCircle className="h-4 w-4 animate-spin" />იტვირთება...</p>
            ) : documents.length === 0 ? (
              <p className="py-5 text-sm leading-6 text-slate-400">ბიბლიოთეკა ცარიელია. დაამატეთ პირველი დოკუმენტი.</p>
            ) : (
              <ul className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                {documents.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => void openDocument(item.id).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "დოკუმენტი ვერ გაიხსნა."))}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                        selected?.id === item.id ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/5 bg-white/[0.02] hover:border-white/15"
                      }`}
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-100">{item.title}</span>
                        <span className="mt-1 block text-[11px] text-slate-500">{item.fileType.toUpperCase()} · {languageName(item.sourceLanguage)}</span>
                      </span>
                      {item.translatedText && <Languages className="h-4 w-4 shrink-0 text-emerald-300" aria-label="ნათარგმნია" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <section className="min-h-[28rem] rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-6">
          {!selected ? (
            <div className="flex min-h-[26rem] flex-col items-center justify-center text-center">
              <FileText className="h-10 w-10 text-slate-600" />
              <p className="mt-3 text-sm text-slate-400">აირჩიეთ დოკუმენტი ან ატვირთეთ ახალი.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold text-white">{selected.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{selected.fileName} · {languageName(selected.sourceLanguage)} → ქართული</p>
                  <p className="mt-1 text-xs text-slate-500">{translationLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void translateSelected()}
                    disabled={translating || selectedIsTranslated}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {translating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
                    {translating
                      ? `თარგმნა ${progress.done}/${progress.total || "…"}`
                      : selectedIsTranslated ? "ნათარგმნია" : "ქართულად თარგმნა"}
                  </button>
                  {selected.translatedText && (
                    <button type="button" onClick={downloadTranslation} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                      <ArrowDownToLine className="h-4 w-4" />TXT
                    </button>
                  )}
                  <button type="button" onClick={() => void deleteSelected()} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/10">
                    <Trash2 className="h-4 w-4" />წაშლა
                  </button>
                </div>
              </div>
              {translating && progress.total > 0 && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress.done} aria-valuemax={progress.total}>
                  <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${Math.min(100, (progress.done / progress.total) * 100)}%` }} />
                </div>
              )}
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <article>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">ორიგინალი · {languageName(selected.sourceLanguage)}</h3>
                  <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/20 p-4 font-sans text-sm leading-7 text-slate-300">{selected.sourceText}</pre>
                </article>
                <article>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-200">ქართული თარგმანი</h3>
                  {selected.translatedText ? (
                    <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-cyan-300/10 bg-cyan-950/10 p-4 font-sans text-sm leading-7 text-slate-100">{selected.translatedText}</pre>
                  ) : (
                    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center text-sm leading-6 text-slate-500">
                      {translating ? "ნათარგმნი ნაწილი მზადდება..." : "თარგმანის სანახავად დააჭირეთ „ქართულად თარგმნა“."}
                    </div>
                  )}
                </article>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-slate-500">
                მანქანური თარგმანი შეიძლება შეიცავდეს შეცდომებს; მნიშვნელოვანი ტექსტი გადაამოწმეთ. დასკანერებული PDF-ის ტექსტის ამოღება ამ ვერსიაში არ არის მხარდაჭერილი.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
