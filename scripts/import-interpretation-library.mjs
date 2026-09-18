import fs from "node:fs/promises";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-interpretation-library.mjs path/to/entries.json");
  process.exit(1);
}

const raw = JSON.parse(await fs.readFile(file, "utf8"));
const entries = Array.isArray(raw) ? raw : raw.entries;
if (!Array.isArray(entries)) throw new Error("The JSON file must contain an array or an { entries: [] } object.");

const prisma = new PrismaClient();
try {
  for (const entry of entries) {
    if (!entry || typeof entry.entryKey !== "string" || typeof entry.chartType !== "string" || typeof entry.language !== "string" || typeof entry.sourceText !== "string") {
      throw new Error("Each entry needs entryKey, chartType, language, and sourceText.");
    }
    if (!/^https?:\/\//i.test(String(entry.sourceUrl ?? "")) || !String(entry.license ?? "").trim()) {
      throw new Error(`Entry ${entry.entryKey} must include sourceUrl and license metadata.`);
    }
    const sourceHash = crypto.createHash("sha256").update(`${entry.language}\0${entry.sourceText.trim()}`).digest("hex");
    await prisma.interpretationLibraryEntry.upsert({
      where: { entryKey: entry.entryKey },
      create: {
        entryKey: entry.entryKey,
        chartType: entry.chartType,
        language: entry.language,
        sourceText: entry.sourceText,
        sourceUrl: entry.sourceUrl,
        license: entry.license,
        sourceHash,
        tagsJson: JSON.stringify(entry.tags ?? {}),
        active: entry.active !== false,
      },
      update: {
        chartType: entry.chartType,
        language: entry.language,
        sourceText: entry.sourceText,
        sourceUrl: entry.sourceUrl,
        license: entry.license,
        sourceHash,
        tagsJson: JSON.stringify(entry.tags ?? {}),
        active: entry.active !== false,
      },
    });
  }
  console.log(`Imported ${entries.length} licensed interpretation entries.`);
} finally {
  await prisma.$disconnect();
}
