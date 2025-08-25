import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Plan as PrismaPlan } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { PlanResponseDto } from './responseDto/plan-response.dto';



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

  async togglePlanDone(id: number): Promise<PlanResponseDto>  {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
      include: { goal: true },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    // toggle completed
    const updatedPlan = await this.prisma.plan.update({
      where: { id },
      data: { completed: !plan.completed },
    });

    // update goal progress
    const goalPlans = await this.prisma.plan.findMany({
      where: { goal_id: plan.goal_id },
    });
    const totalPlans = goalPlans.length;
    const completedPlans = goalPlans.filter(p => p.completed).length;
    const progress = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0;

    await this.prisma.goal.update({
      where: { id: plan.goal_id },
      data: { progress },
    });

    await this.notificationService.createNotification({
     type: 'GOAL_PROGRESS',
     userId: plan.goal.user_id, 
     goalId: plan.goal_id,
     content: `Congrats! Your goal "${plan.goal.title}" progress is now ${progress.toFixed(0)}%`,
    });
  
    if (updatedPlan.completed) {
    await this.notificationService.createNotification({
      type: 'PLAN_COMPLETED',
      userId: plan.goal.user_id,
      planId: updatedPlan.id,
      content: `You completed the plan "${updatedPlan.title}"! Keep going`,
    });
    }


    return this.formatPlan(updatedPlan);
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

  // private helper
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
