-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "completed" DOUBLE PRECISION NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Plan" ADD CONSTRAINT "Plan_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
