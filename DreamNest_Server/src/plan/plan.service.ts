import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlanService {

    constructor(private readonly prisma: PrismaService) {}

    async findById(id: number) {
        const plan= await this.prisma.plan.findUnique({
            where:{id},
        });
        if(!plan) throw new NotFoundException('Plan not found');
        return plan;
    }

 async togglePlanDone(id: number) {
 
  const plan = await this.prisma.plan.findUnique({
    where: { id },
    include: { goal: true },
  });
  if (!plan) throw new NotFoundException('Plan not found');


  const newCompleted = !plan.completed;
  const updatedPlan = await this.prisma.plan.update({
    where: { id },
    data: { completed: newCompleted },
  });


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

  return updatedPlan;
}



async create(goalId: number, dto: CreatePlanDto) {
    // Check if goal exists
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    return this.prisma.plan.create({
      data: {
        title: dto.title,
        description: dto.description,
        due_date: new Date(dto.due_date),
        completed: dto.completed ? 1 : 0,
        goal_id: goalId,
      },
    });
  }

  async getAllByGoal(goalId: number) {
    // Check if goal exists
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    return this.prisma.plan.findMany({
      where: { goal_id: goalId },
      orderBy: { due_date: 'asc' },
    });
  }









}
