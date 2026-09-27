-- Query-planning indexes for user history, guest history and expiring actions.
CREATE INDEX "Calculation_userId_createdAt_idx" ON "Calculation"("userId", "createdAt");
CREATE INDEX "Calculation_userId_type_createdAt_idx" ON "Calculation"("userId", "type", "createdAt");
CREATE INDEX "Calculation_ipAddress_userAgent_createdAt_idx" ON "Calculation"("ipAddress", "userAgent", "createdAt");
CREATE INDEX "ActionToken_type_expiresAt_idx" ON "ActionToken"("type", "expiresAt");
CREATE INDEX "Chart_userId_createdAt_idx" ON "Chart"("userId", "createdAt");
CREATE INDEX "DeletedUser_deletedAt_idx" ON "DeletedUser"("deletedAt");
CREATE INDEX "DeletedCalculation_deletedAt_idx" ON "DeletedCalculation"("deletedAt");
