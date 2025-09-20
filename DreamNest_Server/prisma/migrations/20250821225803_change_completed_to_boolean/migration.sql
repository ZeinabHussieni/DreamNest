/*
  Warnings:

  - Changed the type of `completed` on the `Plan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Plan" DROP COLUMN "completed",
ADD COLUMN     "completed" BOOLEAN NOT NULL;
