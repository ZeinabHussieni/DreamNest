-- CreateEnum
CREATE TYPE "public"."ConnectionStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "public"."Goal" ADD COLUMN     "embedding" JSONB;

-- CreateTable
CREATE TABLE "public"."Help" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "embedding" JSONB,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Help_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Connection" (
    "id" SERIAL NOT NULL,
    "helper_id" INTEGER NOT NULL,
    "seeker_id" INTEGER NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Help_user_id_idx" ON "public"."Help"("user_id");

-- CreateIndex
CREATE INDEX "Connection_helper_id_idx" ON "public"."Connection"("helper_id");

-- CreateIndex
CREATE INDEX "Connection_seeker_id_idx" ON "public"."Connection"("seeker_id");

-- CreateIndex
CREATE INDEX "Connection_goal_id_idx" ON "public"."Connection"("goal_id");

-- AddForeignKey
ALTER TABLE "public"."Help" ADD CONSTRAINT "Help_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_helper_id_fkey" FOREIGN KEY ("helper_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
