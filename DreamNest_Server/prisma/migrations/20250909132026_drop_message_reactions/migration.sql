/*
  Warnings:

  - You are about to drop the `MessageReaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."MessageReaction" DROP CONSTRAINT "MessageReaction_messageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MessageReaction" DROP CONSTRAINT "MessageReaction_userId_fkey";

-- DropTable
DROP TABLE "public"."MessageReaction";
