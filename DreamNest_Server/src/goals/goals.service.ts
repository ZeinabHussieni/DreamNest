import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Goal as PrismaGoal } from '@prisma/client';
import { OpenAIService } from '../openai/openai.service';
import { DashboardGateway } from 'src/dashboard/dashboard.gateway';
import { GoalResponseDto } from './responseDto/goal-response.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardGateway: DashboardGateway,
    private readonly openAIService: OpenAIService,
  ) {}


  async findById(id: number): Promise<GoalResponseDto> {
    try {
      const goal = await this.prisma.goal.findUnique({ where: { id } });
      if (!goal) throw new NotFoundException('Goal not found');
      return this.formatGoal(goal);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to fetch goal');
    }
  }

  async getAllByUserId(userId: number): Promise<GoalResponseDto[]>  {
    try {
      const goal= await this.prisma.goal.findMany({ where: { user_id: userId } });
      return goal.map((g) => this.formatGoal(g));
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch goals');
    }
  }

  async getGoalsByStatus(userId: number, status: 'completed' | 'in-progress'): Promise<GoalResponseDto[]>{
    try {
      const goal=  await this.prisma.goal.findMany({
        where: {
          user_id: userId,
          progress: status === 'completed'
          ? { gte: 100 } : { gte: 0, lt: 100 } 
        },
        include: { plans: true },
      });
     return goal.map((g) => this.formatGoal(g));
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch goals by status');
    }
  }


  async createGoalWithAI(data: {
    title: string;
    description: string;
    help_text?: string;
    vision_board_filename?: string;
    user_id: number;
  }): Promise<GoalResponseDto> {
    try {
    
      const aiPlans = await this.openAIService.generatePlan(data.title, data.description);

 
      const goal = await this.prisma.goal.create({
        data: {
          title: data.title,
          description: data.description,
          help_text: data.help_text || null,
          vision_board_filename: data.vision_board_filename || null,
          user: { connect: { id: data.user_id } },
          plans: {
            create: aiPlans.map((p: any) => ({
              title: p.title,
              description: p.description,
              due_date: new Date(),
              completed: false,
            })),
          },
        },
        include: { plans: true },
      });

    
      await this.dashboardGateway.emitDashboardUpdate(data.user_id);

      return this.formatGoal(goal);
    } catch (err) {
      console.error(err);
      throw new BadRequestException('Goal creation with AI failed');
    }
  }


  async deleteById(id: number): Promise<{ success: boolean }> {
    try {
      const goal = await this.prisma.goal.delete({ where: { id } });
      await this.dashboardGateway.emitDashboardUpdate(goal.user_id);
      return { success: true };
    } catch (err) {
      throw new NotFoundException('Goal not found');
    }
  }

  //helper for mapping
  private formatGoal(goal: any): GoalResponseDto {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    help_text: goal.help_text,
    vision_board_filename: goal.vision_board_filename,
    progress: goal.progress,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    plans: goal.plans?.map((plan: any) => ({
      id: plan.id,
      title: plan.title,
      description: plan.description,
      due_date: plan.due_date,
      completed: plan.completed,
    })),
  };
}

}
