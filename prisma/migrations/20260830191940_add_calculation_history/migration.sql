-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "name1" TEXT NOT NULL,
    "date1" TEXT NOT NULL,
    "time1" TEXT NOT NULL,
    "place1" TEXT NOT NULL,
    "lat1" REAL NOT NULL,
    "lon1" REAL NOT NULL,
    "tz1" TEXT NOT NULL,
    "name2" TEXT,
    "date2" TEXT,
    "time2" TEXT,
    "place2" TEXT,
    "lat2" REAL,
    "lon2" REAL,
    "tz2" TEXT,
    "transitDate" TEXT,
    "houseSystem" TEXT NOT NULL DEFAULT 'placidus',
    "resultJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Calculation_createdAt_idx" ON "Calculation"("createdAt");
