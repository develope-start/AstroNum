CREATE TABLE IF NOT EXISTS "InterpretationLibraryEntry" (
    "id" TEXT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "chartType" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ka',
    "sourceText" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "license" TEXT,
    "sourceHash" TEXT NOT NULL,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InterpretationLibraryEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TranslationCache" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TranslationCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InterpretationLibraryEntry_entryKey_key"
  ON "InterpretationLibraryEntry"("entryKey");
CREATE UNIQUE INDEX IF NOT EXISTS "InterpretationLibraryEntry_sourceHash_key"
  ON "InterpretationLibraryEntry"("sourceHash");
CREATE INDEX IF NOT EXISTS "InterpretationLibraryEntry_chartType_active_idx"
  ON "InterpretationLibraryEntry"("chartType", "active");
CREATE INDEX IF NOT EXISTS "InterpretationLibraryEntry_language_idx"
  ON "InterpretationLibraryEntry"("language");
CREATE UNIQUE INDEX IF NOT EXISTS "TranslationCache_fingerprint_key"
  ON "TranslationCache"("fingerprint");
CREATE INDEX IF NOT EXISTS "TranslationCache_sourceLanguage_targetLanguage_idx"
  ON "TranslationCache"("sourceLanguage", "targetLanguage");
