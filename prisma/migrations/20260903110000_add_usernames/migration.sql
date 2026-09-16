ALTER TABLE "User" ADD COLUMN "username" TEXT;
ALTER TABLE "DeletedUser" ADD COLUMN "username" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
