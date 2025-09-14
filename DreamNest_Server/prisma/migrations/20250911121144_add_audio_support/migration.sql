-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'sent',
ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'text',
ALTER COLUMN "content" DROP NOT NULL;
