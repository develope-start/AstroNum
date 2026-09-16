-- CreateTable
CREATE TABLE "DeletedUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "originalCreatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chartsJson" TEXT NOT NULL,
    "calculationsJson" TEXT NOT NULL,
    "accountEventsJson" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DeletedCalculation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "DeletedUser_email_key" ON "DeletedUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DeletedCalculation_originalId_key" ON "DeletedCalculation"("originalId");
