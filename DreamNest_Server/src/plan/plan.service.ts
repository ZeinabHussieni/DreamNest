import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Plan as PrismaPlan,CoinReason } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { PlanResponseDto } from './responseDto/plan-response.dto';
import {
  PLAN_REWARD,
  PLAN_UNCHECK_PENALTY,
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

    const becomingCompleted = !plan.completed;
    const delta = becomingCompleted ? PLAN_REWARD : PLAN_UNCHECK_PENALTY;
    const reason = becomingCompleted ? CoinReason.PLAN_COMPLETED : CoinReason.PLAN_UNCHECKED;

    const updatedPlan = await this.prisma.$transaction(async (tx) => {
   
      const toggled = await tx.plan.update({
        where: { id: plan.id },
        data: { completed: becomingCompleted },
      });

 
      const goalPlans = await tx.plan.findMany({
        where: { goal_id: plan.goal_id },
        select: { completed: true },
      });
      const total = goalPlans.length;
      const done = goalPlans.reduce((n, p) => n + (p.completed ? 1 : 0), 0);
      const progress = total ? (done / total) * 100 : 0;

      await tx.goal.update({
        where: { id: plan.goal_id },
        data: { progress },
      });


      await tx.coinLedger.create({
        data: {
          userId: plan.goal.user.id,
          delta,
          reason,
          goalId: plan.goal_id,
          planId: plan.id,
        },
      });

      await tx.user.update({
        where: { id: plan.goal.user.id },
        data: { coins: { increment: delta } },
      });

      return toggled;
    });


    await this.notificationService.createAndPush({
      type: becomingCompleted ? 'PLAN_COMPLETED' : 'GOAL_PROGRESS',
      userId: plan.goal.user.id,
      planId: plan.id,
      goalId: plan.goal_id,
      content: becomingCompleted
        ? `You completed "${plan.title}"! +${COINS_PER_PLAN} coins.`
        : `You unchecked "${plan.title}". -${COINS_PER_PLAN} coins.`,
    });

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