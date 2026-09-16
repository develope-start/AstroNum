UPDATE "Calculation"
SET "saved" = 1
WHERE "userId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "Chart"
    WHERE "Chart"."userId" = "Calculation"."userId"
      AND "Chart"."type" = "Calculation"."type"
      AND "Chart"."name1" = "Calculation"."name1"
      AND "Chart"."date1" = "Calculation"."date1"
      AND "Chart"."time1" = "Calculation"."time1"
      AND "Chart"."place1" = "Calculation"."place1"
      AND "Chart"."lat1" = "Calculation"."lat1"
      AND "Chart"."lon1" = "Calculation"."lon1"
      AND "Chart"."tz1" = "Calculation"."tz1"
      AND COALESCE("Chart"."name2", '') = COALESCE("Calculation"."name2", '')
      AND COALESCE("Chart"."date2", '') = COALESCE("Calculation"."date2", '')
      AND COALESCE("Chart"."time2", '') = COALESCE("Calculation"."time2", '')
      AND COALESCE("Chart"."place2", '') = COALESCE("Calculation"."place2", '')
      AND COALESCE("Chart"."lat2", 0) = COALESCE("Calculation"."lat2", 0)
      AND COALESCE("Chart"."lon2", 0) = COALESCE("Calculation"."lon2", 0)
      AND COALESCE("Chart"."tz2", '') = COALESCE("Calculation"."tz2", '')
      AND COALESCE("Chart"."transitDate", '') = COALESCE("Calculation"."transitDate", '')
      AND "Chart"."houseSystem" = "Calculation"."houseSystem"
  );
