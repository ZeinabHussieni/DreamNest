/*
  Warnings:

  - You are about to drop the column `vision_board_filename` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Goal" DROP COLUMN "vision_board_filename",
ADD COLUMN     "visionBoardFilename" TEXT;
