-- Add public identifiers without changing existing records.
ALTER TABLE "User" ADD COLUMN "publicId" TEXT;
ALTER TABLE "Calculation" ADD COLUMN "publicId" TEXT;
ALTER TABLE "DeletedUser" ADD COLUMN "publicId" TEXT;

CREATE TABLE "IdSequence" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "nextNumber" INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX "User_publicId_key" ON "User"("publicId");
