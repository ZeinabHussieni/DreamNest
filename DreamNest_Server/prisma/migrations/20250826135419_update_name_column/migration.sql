/*
  Warnings:

  - You are about to drop the column `help_text` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Goal" DROP COLUMN "help_text",
ADD COLUMN     "helpText" TEXT;
