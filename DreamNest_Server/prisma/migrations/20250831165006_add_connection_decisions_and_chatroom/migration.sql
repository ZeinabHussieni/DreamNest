/*
  Warnings:

  - A unique constraint covering the columns `[helper_id,seeker_id,goal_id]` on the table `Connection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ConnectionDecision" AS ENUM ('pending', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "public"."Connection" ADD COLUMN     "chatRoomId" INTEGER,
ADD COLUMN     "helperDecision" "public"."ConnectionDecision" NOT NULL DEFAULT 'pending',
ADD COLUMN     "seekerDecision" "public"."ConnectionDecision" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "Connection_helper_id_seeker_id_goal_id_key" ON "public"."Connection"("helper_id", "seeker_id", "goal_id");

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "public"."ChatRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
