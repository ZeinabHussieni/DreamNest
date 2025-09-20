import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Plan as PrismaPlan,CoinReason } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { PlanResponseDto } from './responseDto/plan-response.dto';
import {
  PLAN_REWARD
} from 'src/common/shared/coins'; 


const COINS_PER_PLAN = 15;
@Injectable()
export class PlanService {
  constructor(
      private readonly prisma: PrismaService,
      private readonly notificationService: NotificationService, 
  ) {}

  async findById(id: number): Promise<PlanResponseDto> {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.formatPlan(plan);
  }

  async create(goalId: number, data: { title: string; description: string; due_date: string; completed?: boolean }) {
  const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) throw new NotFoundException('Goal not found');

  const plan = await this.prisma.plan.create({
    data: {
      title: data.title,
      description: data.description,
      due_date: new Date(data.due_date),
      completed: !!data.completed,
      goal_id: goalId,
    },
  });

  return this.formatPlan(plan);
 }


  async getAllByGoal(goalId: number): Promise<PlanResponseDto[]> {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const plans = await this.prisma.plan.findMany({
      where: { goal_id: goalId },
      orderBy: { due_date: 'asc' },
    });

    return plans.map(this.formatPlan);
  }

  async togglePlanDone(id: number): Promise<PlanResponseDto> {

    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { goal: { include: { user: true } } },
    });
    if (!plan) throw new NotFoundException('Plan not found');


     if (plan.completed) {
      return this.formatPlan(plan);
    }

    const updatedPlan = await this.prisma.$transaction(async (tx) => {
   
      const flip = await tx.plan.updateMany({
        where: { id: plan.id,completed:false },
        data: { completed: true  },
      });

  
 
      const [totalCount, doneCount] = await Promise.all([
        tx.plan.count({ where: { goal_id: plan.goal_id } }),
        tx.plan.count({ where: { goal_id: plan.goal_id, completed: true } }),
      ]);
      const progress = totalCount ? (doneCount / totalCount) * 100 : 0;

      await tx.goal.update({
        where: { id: plan.goal_id },
        data: { progress },
      });

      if (flip.count > 0) {
      await tx.coinLedger.create({
        data: {
          userId: plan.goal.user.id,
          delta: PLAN_REWARD,
          reason: CoinReason.PLAN_COMPLETED,
          goalId: plan.goal_id,
          planId: plan.id,
        },
      });

      await tx.user.update({
        where: { id: plan.goal.user.id },
        data: { coins: { increment: PLAN_REWARD  } },
      });

    }

      const toggled = await tx.plan.findUnique({ where: { id: plan.id } });
      return toggled!;
    });

    if (!plan.completed && updatedPlan.completed) {
    await this.notificationService.createAndPush({
      type: 'PLAN_COMPLETED',
      userId: plan.goal.user.id,
      planId: plan.id,
      goalId: plan.goal_id,
      content: `You completed "${plan.title}"! +${COINS_PER_PLAN} coins.`
       
    });
  }

    return this.formatPlan(updatedPlan);
  }


  private formatPlan(plan: PrismaPlan): PlanResponseDto {
    return {
      id: plan.id,
      title: plan.title,
      description: plan.description,
      due_date: plan.due_date,
      completed: plan.completed,
      goal_id: plan.goal_id,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}