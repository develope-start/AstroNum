-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
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
    "interpretation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Chart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
