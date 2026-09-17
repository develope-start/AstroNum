-- PostgreSQL baseline for databases that were previously created with SQLite.
-- Every operation is intentionally idempotent so this migration is safe for
-- both a new database and an existing AstroNum database.

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "publicId" TEXT,
    "adminId" TEXT,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Chart" (
    "id" TEXT NOT NULL,
    "mapNumber" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "name1" TEXT NOT NULL,
    "date1" TEXT NOT NULL,
    "time1" TEXT NOT NULL,
    "place1" TEXT NOT NULL,
    "lat1" DOUBLE PRECISION NOT NULL,
    "lon1" DOUBLE PRECISION NOT NULL,
    "tz1" TEXT NOT NULL,
    "name2" TEXT,
    "date2" TEXT,
    "time2" TEXT,
    "place2" TEXT,
    "lat2" DOUBLE PRECISION,
    "lon2" DOUBLE PRECISION,
    "tz2" TEXT,
    "transitDate" TEXT,
    "houseSystem" TEXT NOT NULL DEFAULT 'placidus',
    "resultJson" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Calculation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "publicId" TEXT,
    "mapNumber" TEXT,
    "saved" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "name1" TEXT NOT NULL,
    "date1" TEXT NOT NULL,
    "time1" TEXT NOT NULL,
    "place1" TEXT NOT NULL,
    "lat1" DOUBLE PRECISION NOT NULL,
    "lon1" DOUBLE PRECISION NOT NULL,
    "tz1" TEXT NOT NULL,
    "name2" TEXT,
    "date2" TEXT,
    "time2" TEXT,
    "place2" TEXT,
    "lat2" DOUBLE PRECISION,
    "lon2" DOUBLE PRECISION,
    "tz2" TEXT,
    "transitDate" TEXT,
    "houseSystem" TEXT NOT NULL DEFAULT 'placidus',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "resultJson" TEXT NOT NULL,
    "interpretation" TEXT,
    "updatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AccountEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "emailSnapshot" TEXT NOT NULL,
    "oldEmail" TEXT,
    "newEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "payload" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActionToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "IdSequence" (
    "key" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "IdSequence_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "DeletedUser" (
    "id" TEXT NOT NULL,
    "publicId" TEXT,
    "adminId" TEXT,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "originalCreatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chartsJson" TEXT NOT NULL,
    "calculationsJson" TEXT NOT NULL,
    "accountEventsJson" TEXT NOT NULL,
    CONSTRAINT "DeletedUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DeletedCalculation" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeletedCalculation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;

ALTER TABLE "Chart" ADD COLUMN IF NOT EXISTS "mapNumber" TEXT;

ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "publicId" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "mapNumber" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "saved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "interpretation" TEXT;
ALTER TABLE "Calculation" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

ALTER TABLE "DeletedUser" ADD COLUMN IF NOT EXISTS "publicId" TEXT;
ALTER TABLE "DeletedUser" ADD COLUMN IF NOT EXISTS "adminId" TEXT;
ALTER TABLE "DeletedUser" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "DeletedUser" ADD COLUMN IF NOT EXISTS "username" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_publicId_key" ON "User"("publicId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_adminId_key" ON "User"("adminId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE INDEX IF NOT EXISTS "Calculation_createdAt_idx" ON "Calculation"("createdAt");
CREATE INDEX IF NOT EXISTS "AccountEvent_createdAt_idx" ON "AccountEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "AccountEvent_userId_idx" ON "AccountEvent"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "ActionToken_tokenHash_key" ON "ActionToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "ActionToken_userId_idx" ON "ActionToken"("userId");
CREATE INDEX IF NOT EXISTS "ActionToken_expiresAt_idx" ON "ActionToken"("expiresAt");
CREATE UNIQUE INDEX IF NOT EXISTS "DeletedUser_email_key" ON "DeletedUser"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "DeletedCalculation_originalId_key" ON "DeletedCalculation"("originalId");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Chart_userId_fkey') THEN
        ALTER TABLE "Chart" ADD CONSTRAINT "Chart_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Calculation_userId_fkey') THEN
        ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccountEvent_userId_fkey') THEN
        ALTER TABLE "AccountEvent" ADD CONSTRAINT "AccountEvent_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ActionToken_userId_fkey') THEN
        ALTER TABLE "ActionToken" ADD CONSTRAINT "ActionToken_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

WITH numbered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id")
          + COALESCE((
              SELECT MAX("number")
              FROM (
                  SELECT (substring("mapNumber" from '^Z-([0-9]+)$'))::integer AS "number"
                  FROM "Calculation"
                  UNION ALL
                  SELECT (substring("mapNumber" from '^Z-([0-9]+)$'))::integer AS "number"
                  FROM "Chart"
              ) AS existing_numbers
          ), 0) AS "number"
    FROM "Calculation"
    WHERE "mapNumber" IS NULL
)
UPDATE "Calculation" AS calculation
SET "mapNumber" = 'Z-' || LPAD(numbered."number"::text, 5, '0')
FROM numbered
WHERE calculation."id" = numbered."id";

WITH numbered AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "createdAt", "id")
          + COALESCE((
              SELECT MAX("number")
              FROM (
                  SELECT (substring("mapNumber" from '^Z-([0-9]+)$'))::integer AS "number"
                  FROM "Calculation"
                  UNION ALL
                  SELECT (substring("mapNumber" from '^Z-([0-9]+)$'))::integer AS "number"
                  FROM "Chart"
              ) AS existing_numbers
          ), 0) AS "number"
    FROM "Chart"
    WHERE "mapNumber" IS NULL
)
UPDATE "Chart" AS chart
SET "mapNumber" = 'Z-' || LPAD(numbered."number"::text, 5, '0')
FROM numbered
WHERE chart."id" = numbered."id";

INSERT INTO "IdSequence" ("key", "nextNumber")
VALUES ('MAP', 1)
ON CONFLICT ("key") DO NOTHING;

UPDATE "IdSequence"
SET "nextNumber" = GREATEST(
    "nextNumber",
    COALESCE((
        SELECT MAX("number") + 1
        FROM (
            SELECT (substring("mapNumber" from '^Z-([0-9]+)$'))::integer AS "number"
            FROM "Calculation"
            UNION ALL
            SELECT (substring("mapNumber" from '^Z-([0-9]+)$'))::integer AS "number"
            FROM "Chart"
        ) AS all_numbers
    ), 1)
)
WHERE "key" = 'MAP';

CREATE UNIQUE INDEX IF NOT EXISTS "Calculation_mapNumber_key" ON "Calculation"("mapNumber");
