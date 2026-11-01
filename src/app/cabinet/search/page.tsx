"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, BookOpen, LoaderCircle, Search, Sparkles } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  content: string;
  truncated: boolean;
  score: number | null;
  publishedDate: string | null;
  translatedText?: string;
  translationError?: string;
}

interface ApiError {
  error?: string;
}

async function responseJson<T>(response: Response): Promise<T & ApiError> {
  return response.json().catch(() => ({} as T & ApiError));
}

function splitSearchText(text: string, limit = 2_500): string[] {
  const chunks: string[] = [];
  let offset = 0;
  while (offset < text.length) {
    let end = Math.min(offset + limit, text.length);
    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > offset + Math.floor(limit / 2)) end = boundary;
    }
    chunks.push(text.slice(offset, end).trim());
    offset = end;
    while (text[offset] === " ") offset += 1;
  }
  return chunks.filter(Boolean);
}

export default function WebSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedCount, setTranslatedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setTranslating(false);
    setTranslatedCount(0);
    setError(null);
    setResults([]);

    try {
      const response = await fetch("/api/search/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await responseJson<{
        results?: SearchResult[];
        translationAvailable?: boolean;
      }>(response);
      if (!response.ok) throw new Error(data.error || "ძიება ვერ შესრულდა.");

      const found = data.results ?? [];
      setResults(found);
      if (!found.length) return;
      if (!data.translationAvailable) {
        setError("ძიება მუშაობს, მაგრამ ავტომატური თარგმნისთვის OPENROUTER_API_KEY, GROQ_API_KEY ან სხვა თარგმნის სერვისი უნდა იყოს კონფიგურირებული.");
        return;
      }

      setTranslating(true);
      let nextIndex = 0;
      let completed = 0;
      const translateNext = async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= found.length) return;
          try {
            const chunks = splitSearchText(found[index].content);
            const translatedChunks: string[] = [];
            for (const text of chunks) {
              const translationResponse = await fetch("/api/search/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
              });
              const translationData = await responseJson<{ translatedText?: string }>(translationResponse);
              if (!translationResponse.ok || !translationData.translatedText) {
                throw new Error(translationData.error || "ამონარიდის თარგმნა ვერ მოხერხდა.");
              }
              translatedChunks.push(translationData.translatedText);
            }
            setResults((current) => current.map((item, itemIndex) => itemIndex === index
              ? { ...item, translatedText: translatedChunks.join("\n\n") }
              : item));
          } catch (reason) {
            setResults((current) => current.map((item, itemIndex) => itemIndex === index
              ? { ...item, translationError: reason instanceof Error ? reason.message : "თარგმნა ვერ მოხერხდა." }
              : item));
          } finally {
            completed += 1;
            setTranslatedCount(completed);
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(2, found.length) }, () => translateNext()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "ძიება ვერ შესრულდა.");
    } finally {
      setLoading(false);
      setTranslating(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-7">
        <Link href="/cabinet/library" className="text-sm text-cyan-300 hover:text-cyan-200">← პირად ბიბლიოთეკაში დაბრუნება</Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10 text-violet-200">
            <Search className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">ვებ-ძიება ქართულად</h1>
            <p className="mt-1 text-sm text-slate-400">მოძებნეთ საჯარო ვებ-წყაროები და თარგმნეთ შედეგები ავტომატურად.</p>
          </div>
        </div>
      </header>

      <form onSubmit={(event) => void search(event)} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-xl sm:p-5">
        <label htmlFor="web-query" className="text-xs font-medium text-slate-300">საძიებო ფრაზა</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="web-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={300}
            minLength={2}
            required
            placeholder="მაგ. astronomy history, астрология..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
          />
          <button
            type="submit"
            disabled={loading || query.trim().length < 2}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "მუშავდება..." : "ძიება"}
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          საძიებო ფრაზა Tavily-ს გადაეცემა, ხოლო შედეგების ამონარიდები თარგმნისთვის OpenRouter-ს, Groq-ს ან კონფიგურირებულ სათადარიგო სერვისს. გამოიყენება Tavily Basic; პროექტის საერთო უსაფრთხოების ლიმიტია მაქსიმუმ 900 ძიება თვეში.
        </p>
      </form>

      {error && <p role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">{error}</p>}
      {translating && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-cyan-200">
          <Sparkles className="h-4 w-4 animate-pulse" />ქართული თარგმანი მზადდება: {translatedCount}/{results.length}
        </p>
      )}

      <div className="mt-5 space-y-4">
        {results.map((result, index) => (
          <article key={`${result.url}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold leading-6 text-white">{result.title}</h2>
                <p className="mt-1 break-all text-[11px] text-emerald-300/80">{new URL(result.url).hostname}</p>
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
              >
                წყაროს გახსნა <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {result.translatedText ? (
              <>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">{result.translatedText}</p>
                <details className="mt-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-400">ორიგინალი ტექსტი</summary>
                  <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-slate-400">{result.content}</p>
                </details>
              </>
            ) : result.translationError ? (
              <div className="mt-4">
                <p role="alert" className="mb-2 text-xs text-amber-200">{result.translationError}</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{result.content}</p>
              </div>
            ) : (
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{result.content}</p>
            )}

            {result.truncated && <p className="mt-3 text-[11px] text-slate-500">ამონარიდი 6,000 სიმბოლოზეა შეზღუდული; სრული ტექსტისთვის გახსენით წყარო.</p>}
            {result.publishedDate && <p className="mt-2 text-[11px] text-slate-500">წყაროს სავარაუდო თარიღი: {result.publishedDate}</p>}
          </article>
        ))}
      </div>

      {!loading && results.length === 0 && !error && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm text-slate-400">შეიყვანეთ საძიებო ფრაზა — შედეგები გამოჩნდება წყაროს ბმულებით და ქართულად ნათარგმნი ამონარიდებით.</p>
        </div>
      )}
    </main>
  );
}
