CREATE TABLE IF NOT EXISTS "ChartView" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerRole" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChartView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ChartView_chartId_viewerId_key"
  ON "ChartView"("chartId", "viewerId");

CREATE INDEX IF NOT EXISTS "ChartView_chartId_viewerRole_viewedAt_idx"
  ON "ChartView"("chartId", "viewerRole", "viewedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChartView_chartId_fkey'
  ) THEN
    ALTER TABLE "ChartView"
      ADD CONSTRAINT "ChartView_chartId_fkey"
      FOREIGN KEY ("chartId") REFERENCES "Chart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChartView_viewerId_fkey'
  ) THEN
    ALTER TABLE "ChartView"
      ADD CONSTRAINT "ChartView_viewerId_fkey"
      FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
