import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const DEFAULT_PROVIDER_VERSION = "libretranslate-v1";
const CHUNK_LIMIT = 3_500;

export interface TranslationResult {
  text: string;
  translated: boolean;
  provider: string;
  cacheHits: number;
  chunks: number;
}

function normalize(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function fingerprint(sourceText: string, sourceLanguage: string, targetLanguage: string, providerVersion: string): string {
  return createHash("sha256")
    .update(`${providerVersion}\0${sourceLanguage}\0${targetLanguage}\0${normalize(sourceText)}`)
    .digest("hex");
}

function providerUrl(): string | null {
  const configured = process.env.LIBRETRANSLATE_URL?.trim();
  if (!configured) return null;
  return configured.endsWith("/translate") ? configured : `${configured.replace(/\/$/, "")}/translate`;
}

function splitText(text: string): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= CHUNK_LIMIT) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    if (paragraph.length <= CHUNK_LIMIT) {
      current = paragraph;
      continue;
    }
    for (let index = 0; index < paragraph.length; index += CHUNK_LIMIT) chunks.push(paragraph.slice(index, index + CHUNK_LIMIT));
    current = "";
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

async function translateChunk(sourceText: string, sourceLanguage: string, targetLanguage: string): Promise<{ text: string; cached: boolean; provider: string }> {
  if (sourceLanguage === targetLanguage || !normalize(sourceText)) {
    return { text: sourceText, cached: true, provider: "identity" };
  }

  const url = providerUrl();
  const providerVersion = process.env.LIBRETRANSLATE_VERSION?.trim() || DEFAULT_PROVIDER_VERSION;
  const provider = url ? "libretranslate" : "unconfigured";
  const hash = fingerprint(sourceText, sourceLanguage, targetLanguage, providerVersion);

  try {
    const cached = await prisma.translationCache.findUnique({ where: { fingerprint: hash }, select: { translatedText: true, provider: true } });
    if (cached) return { text: cached.translatedText, cached: true, provider: cached.provider };
  } catch (error) {
    console.error("Translation cache lookup failed", error instanceof Error ? error.message : error);
  }

  if (!url) return { text: sourceText, cached: false, provider };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: sourceText,
        source: sourceLanguage,
        target: targetLanguage,
        format: "text",
        ...(process.env.LIBRETRANSLATE_API_KEY ? { api_key: process.env.LIBRETRANSLATE_API_KEY } : {}),
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
    if (!response.ok) throw new Error(`LibreTranslate returned ${response.status}`);
    const payload = await response.json() as { translatedText?: unknown };
    if (typeof payload.translatedText !== "string" || !payload.translatedText.trim()) throw new Error("LibreTranslate returned no translated text");

    try {
      await prisma.translationCache.upsert({
        where: { fingerprint: hash },
        create: { fingerprint: hash, sourceLanguage, targetLanguage, sourceText, translatedText: payload.translatedText, provider, providerVersion },
        update: { translatedText: payload.translatedText, provider, providerVersion },
      });
    } catch (error) {
      console.error("Translation cache write failed", error instanceof Error ? error.message : error);
    }
    return { text: payload.translatedText, cached: false, provider };
  } catch (error) {
    console.error("LibreTranslate request failed", error instanceof Error ? error.message : error);
    return { text: sourceText, cached: false, provider };
  }
}

/**
 * Translates paragraphs independently so a future streaming endpoint can emit
 * each completed chunk without exposing provider credentials to the browser.
 * Existing Georgian interpretations use the identity path and add no latency.
 */
export async function localizeInterpretation(
  text: string,
  sourceLanguage = "ka",
  targetLanguage = "ka",
): Promise<TranslationResult> {
  const chunks = splitText(text);
  if (sourceLanguage === targetLanguage) return { text, translated: false, provider: "identity", cacheHits: chunks.length, chunks: chunks.length };

  const translated: string[] = [];
  let cacheHits = 0;
  let provider = "unconfigured";
  for (const chunk of chunks) {
    const result = await translateChunk(chunk, sourceLanguage, targetLanguage);
    translated.push(result.text);
    provider = result.provider;
    if (result.cached) cacheHits += 1;
  }
  return { text: translated.join("\n\n"), translated: translated.some((part, index) => part !== chunks[index]), provider, cacheHits, chunks: chunks.length };
}
