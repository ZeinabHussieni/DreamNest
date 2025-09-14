-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "badReason" TEXT,
ADD COLUMN     "censoredContent" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isBad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "quarantineUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."UserModeration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "totalInfractions" INTEGER NOT NULL DEFAULT 0,
    "textInfractions" INTEGER NOT NULL DEFAULT 0,
    "voiceInfractions" INTEGER NOT NULL DEFAULT 0,
    "imageInfractions" INTEGER NOT NULL DEFAULT 0,
    "chatBlocked" BOOLEAN NOT NULL DEFAULT false,
    "chatBlockedAt" TIMESTAMP(3),
    "siteBlocked" BOOLEAN NOT NULL DEFAULT false,
    "siteBlockedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserModeration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserModeration_userId_key" ON "public"."UserModeration"("userId");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "public"."Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_isBad_status_type_idx" ON "public"."Message"("isBad", "status", "type");

-- AddForeignKey
ALTER TABLE "public"."UserModeration" ADD CONSTRAINT "UserModeration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
