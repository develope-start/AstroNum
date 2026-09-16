ALTER TABLE "User" ADD COLUMN "adminId" TEXT;
ALTER TABLE "DeletedUser" ADD COLUMN "adminId" TEXT;

CREATE UNIQUE INDEX "User_adminId_key" ON "User"("adminId");
