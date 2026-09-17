ALTER TABLE "Calculation" ADD COLUMN "mapNumber" TEXT;
ALTER TABLE "Chart" ADD COLUMN "mapNumber" TEXT;

CREATE UNIQUE INDEX "Calculation_mapNumber_key" ON "Calculation"("mapNumber");

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS "number"
  FROM "Calculation"
)
UPDATE "Calculation" AS calculation
SET "mapNumber" = 'Z-' || LPAD(numbered."number"::text, 5, '0')
FROM numbered
WHERE calculation."id" = numbered."id";

WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") + (SELECT COUNT(*) FROM "Calculation") AS "number"
  FROM "Chart"
)
UPDATE "Chart" AS chart
SET "mapNumber" = 'Z-' || LPAD(numbered."number"::text, 5, '0')
FROM numbered
WHERE chart."id" = numbered."id";

INSERT INTO "IdSequence" ("key", "nextNumber")
VALUES ('MAP', (SELECT COUNT(*) FROM "Calculation") + (SELECT COUNT(*) FROM "Chart") + 1)
ON CONFLICT ("key") DO UPDATE
SET "nextNumber" = GREATEST("IdSequence"."nextNumber", EXCLUDED."nextNumber");
