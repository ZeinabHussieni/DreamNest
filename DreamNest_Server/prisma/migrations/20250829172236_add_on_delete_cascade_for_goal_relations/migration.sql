-- DropForeignKey
ALTER TABLE "public"."Connection" DROP CONSTRAINT "Connection_goal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Plan" DROP CONSTRAINT "Plan_goal_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Connection" ADD CONSTRAINT "Connection_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Plan" ADD CONSTRAINT "Plan_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
