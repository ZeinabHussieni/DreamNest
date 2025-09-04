-- CreateEnum
CREATE TYPE "public"."CoinReason" AS ENUM ('PLAN_COMPLETED', 'PLAN_UNCHECKED', 'DAILY_DECAY', 'PURCHASE');

-- CreateEnum
CREATE TYPE "public"."PurchaseStatus" AS ENUM ('pending', 'succeeded', 'failed');

-- CreateTable
CREATE TABLE "public"."CoinLedger" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "public"."CoinReason" NOT NULL,
    "goalId" INTEGER,
    "planId" INTEGER,
    "purchaseId" INTEGER,
    "decayDay" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CoinPurchase" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "public"."PurchaseStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CoinPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoinLedger_userId_createdAt_idx" ON "public"."CoinLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CoinLedger_reason_createdAt_idx" ON "public"."CoinLedger"("reason", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoinLedger_userId_reason_decayDay_key" ON "public"."CoinLedger"("userId", "reason", "decayDay");

-- AddForeignKey
ALTER TABLE "public"."CoinLedger" ADD CONSTRAINT "CoinLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoinLedger" ADD CONSTRAINT "CoinLedger_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "public"."CoinPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CoinPurchase" ADD CONSTRAINT "CoinPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
