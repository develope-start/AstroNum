CREATE TABLE "LibraryDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT,
    "translatedChunksJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LibraryDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LibraryDocument_userId_updatedAt_idx" ON "LibraryDocument"("userId", "updatedAt");
ALTER TABLE "LibraryDocument" ADD CONSTRAINT "LibraryDocument_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebSearchQuota" (
    "key" TEXT NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebSearchQuota_pkey" PRIMARY KEY ("key")
);
