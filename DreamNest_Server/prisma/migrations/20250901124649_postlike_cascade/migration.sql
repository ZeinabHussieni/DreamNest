-- DropForeignKey
ALTER TABLE "public"."PostLike" DROP CONSTRAINT "PostLike_post_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."PostLike" ADD CONSTRAINT "PostLike_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
