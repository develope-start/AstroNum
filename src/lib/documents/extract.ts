import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const MAX_DOCUMENT_BYTES = 3_500_000;
export const MAX_DOCUMENT_CHARACTERS = 80_000;

export type SupportedDocumentType = "pdf" | "docx" | "txt";

export class DocumentInputError extends Error {}

export function getDocumentType(fileName: string): SupportedDocumentType | null {
  const extension = fileName.toLowerCase().split(".").pop();
  return extension === "pdf" || extension === "docx" || extension === "txt" ? extension : null;
}

export async function extractDocumentText(fileName: string, buffer: Buffer): Promise<{ type: SupportedDocumentType; text: string }> {
  const type = getDocumentType(fileName);
  if (!type) throw new DocumentInputError("მხარდაჭერილია მხოლოდ PDF, DOCX და TXT ფაილები.");

  let text: string;
  try {
    if (type === "pdf") {
      if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new DocumentInputError("ფაილი ვალიდურ PDF დოკუმენტად ვერ დადასტურდა.");
      }
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (type === "docx") {
      if (buffer.subarray(0, 2).toString("ascii") !== "PK") {
        throw new DocumentInputError("ფაილი ვალიდურ DOCX დოკუმენტად ვერ დადასტურდა.");
      }
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } else {
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        throw new DocumentInputError("TXT ფაილი უნდა იყოს UTF-8 ფორმატში.");
      }
    }
  } catch (error) {
    if (error instanceof DocumentInputError) throw error;
    throw new DocumentInputError(`${type.toUpperCase()} ფაილი ვერ დამუშავდა. გადაამოწმეთ, რომ ფაილი დაზიანებული არ არის.`);
  }

  const normalized = text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) {
    throw new DocumentInputError("ფაილიდან ტექსტი ვერ ამოიღეს. დასკანერებულ PDF-ს OCR სჭირდება.");
  }
  if (normalized.length > MAX_DOCUMENT_CHARACTERS) {
    throw new DocumentInputError(`დოკუმენტი ძალიან დიდია. მაქსიმუმ ${MAX_DOCUMENT_CHARACTERS.toLocaleString("ka-GE")} სიმბოლოა მხარდაჭერილი.`);
  }
  return { type, text: normalized };
}

export function splitDocumentText(text: string, limit = 2_800): string[] {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  function pushLongParagraph(paragraph: string) {
    let offset = 0;
    while (offset < paragraph.length) {
      let end = Math.min(offset + limit, paragraph.length);
      if (end < paragraph.length) {
        const wordBoundary = paragraph.lastIndexOf(" ", end);
        if (wordBoundary > offset + Math.floor(limit / 2)) end = wordBoundary;
      }
      chunks.push(paragraph.slice(offset, end).trim());
      offset = end;
      while (paragraph[offset] === " ") offset += 1;
    }
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > limit) {
      if (current) chunks.push(current);
      current = "";
      pushLongParagraph(paragraph);
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= limit) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = paragraph;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
