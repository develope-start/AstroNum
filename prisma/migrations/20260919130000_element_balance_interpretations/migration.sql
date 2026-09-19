CREATE TABLE IF NOT EXISTS "ElementBalanceInterpretation" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "distributionKey" TEXT NOT NULL,
    "countsJson" TEXT NOT NULL,
    "percentagesJson" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "interpretationText" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "provider" TEXT NOT NULL,
    "providerVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElementBalanceInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ElementBalanceInterpretation_cacheKey_key"
  ON "ElementBalanceInterpretation"("cacheKey");

CREATE INDEX IF NOT EXISTS "ElementBalanceInterpretation_distributionKey_idx"
  ON "ElementBalanceInterpretation"("distributionKey");
