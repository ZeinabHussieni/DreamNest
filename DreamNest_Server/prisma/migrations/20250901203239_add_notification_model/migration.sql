-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "public"."Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");
