import { translateToProfessionalGeorgian } from "@/lib/documents/translate";
import { normalizeGeorgianAstrologyTerms } from "@/lib/astrologyGeorgian";

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
  try {
    const result = await translateToProfessionalGeorgian(sourceText, sourceLanguage, "interpretation-library");
    return result;
  } catch (error) {
    // A dubious translation is worse than an intelligible original. The UI can
    // label this as a source-language excerpt instead of presenting it as ka.
    console.error("Interpretation editorial translation failed", error instanceof Error ? error.message : error);
    return { text: sourceText, cached: false, provider: "source-preserved" };
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
  if (sourceLanguage === targetLanguage) {
    return {
      text: targetLanguage === "ka" ? normalizeGeorgianAstrologyTerms(text) : text,
      translated: false,
      provider: "identity",
      cacheHits: chunks.length,
      chunks: chunks.length,
    };
  }

  const translated: string[] = [];
  let cacheHits = 0;
  let provider = "unconfigured";
  for (const chunk of chunks) {
    const result = await translateChunk(chunk, sourceLanguage, targetLanguage);
    translated.push(result.text);
    provider = result.provider;
    if (result.cached) cacheHits += 1;
  }
  const localizedText = translated.join("\n\n");
  return {
    text: targetLanguage === "ka" ? normalizeGeorgianAstrologyTerms(localizedText) : localizedText,
    translated: translated.some((part, index) => part !== chunks[index]),
    provider,
    cacheHits,
    chunks: chunks.length,
  };
}
