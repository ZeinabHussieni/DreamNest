import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { saveBase64Image } from '../common/shared/file.utils';
import { join } from 'path';
import { Prisma } from '@prisma/client'; 
import { OpenAIService } from '../openai/openai.service';
import { DashboardGateway } from 'src/dashboard/gateway/dashboard.gateway';
import { GoalResponseDto } from './responseDto/goal-response.dto';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardGateway: DashboardGateway,
    private readonly openAIService: OpenAIService,
    private readonly notificationService: NotificationService,

    
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

  async deleteById(id: number): Promise<{ success: boolean }> {
    try {
      const goal = await this.prisma.goal.delete({ where: { id } });
      await this.dashboardGateway.emitDashboardUpdate(goal.user_id);
      return { success: true };
    } catch (err) {
      throw new NotFoundException('Goal not found');
    }
  }

   async createGoalWithAI(data: {
    title: string;
    description: string;
    helpText?: string;
    visionBoardBase64?: string;
    user_id: number;
  }): Promise<GoalResponseDto> {
    try {
      const threshold = 0.4;

     let visionBoardFilename: string | undefined;

     if (data.visionBoardBase64) {
       visionBoardFilename = saveBase64Image(
        data.visionBoardBase64,
        join(process.cwd(), 'storage/private/visionBoard')
 
       );
     }

      // generate embedding and plas
      const [goalEmbedding, aiPlans] = await Promise.all([
        this.generateGoalEmbedding(data.title, data.description),
        this.openAIService.generatePlan(data.title, data.description),
      ]);

      // create goal
      const goal = await this.createGoalInDB(data, goalEmbedding, aiPlans);

      // create help if provided
      const helpEmbedding = data.helpText
        ? await this.createHelp(data.user_id, data.helpText)
        : null;

      // create connections: goal → helps / help → other goals
      await this.createConnections(data.user_id, goal, goalEmbedding, helpEmbedding, threshold);


      await this.dashboardGateway.emitDashboardUpdate(data.user_id);

      return this.formatGoal(goal);
    } catch (err) {
      console.error('Goal creation with AI failed:', err);
      throw new BadRequestException('Goal creation with AI failed');
    }
  }



  // generate embedding helpers
  private async generateGoalEmbedding(title: string, description: string): Promise<number[]> {
    return this.openAIService.generateEmbedding(`${title}. ${description}`);
  }

  private async generateHelpEmbedding(helpText: string): Promise<number[]> {
    return this.openAIService.generateEmbedding(helpText);
  }


  // data helpers
  private async createGoalInDB(
    data: any,
    goalEmbedding: number[],
    aiPlans: any[],
  ) {
    return this.prisma.goal.create({
      data: {
        title: data.title,
        description: data.description,
        helpText: data.helpText || null,
        visionBoardFilename: data.visionBoardFilename || null,
        embedding: goalEmbedding.length ? goalEmbedding : Prisma.JsonNull,
        user: { connect: { id: data.user_id } },
        plans: { create: aiPlans.map(p => ({ ...p, due_date: new Date(), completed: false })) },
      },
      include: { plans: true },
    });
  }

  private async createHelp(userId: number, helpText: string): Promise<number[]> {
    const helpEmbedding = await this.generateHelpEmbedding(helpText);
    await this.prisma.help.create({
      data: {
        description: helpText,
        embedding: helpEmbedding.length ? helpEmbedding : Prisma.JsonNull,
        user_id: userId,
      },
    });
    return helpEmbedding;
  }


  // connections
  private async createConnections(
    userId: number,
    goal: any,
    goalEmbedding: number[],
    helpEmbedding: number[] | null,
    threshold: number,
  ) {
    const helps = await this.prisma.help.findMany({
      where: { embedding: { not: Prisma.JsonNull } },
      include: { user: true },
    });

    const connectionsToCreate: any[] = [];

    // goal to helps
    helps.forEach(h => {
      if (!h.embedding) return;
      const score = this.cosineSimilarity(goalEmbedding, h.embedding as number[]);
      if (score >= threshold) {
        connectionsToCreate.push({
          helper_id: h.user_id, 
          seeker_id: userId,
          goal_id: goal.id,
          similarityScore: score,
          status: 'pending',
        });
      }
    });

    // help to other goals
    if (helpEmbedding) {
      const otherGoals = await this.prisma.goal.findMany({
        where: { embedding: { not: Prisma.JsonNull }, user_id: { not: userId } },
      });
      otherGoals.forEach(g => {
        const score = this.cosineSimilarity(helpEmbedding, g.embedding as number[]);
        if (score >= threshold) {
          connectionsToCreate.push({
            helper_id: userId,
            seeker_id: g.user_id,
            goal_id: g.id,
            similarityScore: score,
            status: 'pending',
          });
        }
      });
    }

    // insert connections
    if (connectionsToCreate.length > 0) {
      await this.prisma.connection.createMany({ data: connectionsToCreate });
    }

     for (const conn of connectionsToCreate) {
      await this.notificationService.createNotification({
        type: 'NEW_CONNECTION',
        userId: conn.seeker_id,        
        actorId: conn.helper_id,       
        goalId: conn.goal_id,
        content: `You have a new connection request from user ${conn.helper_id} for goal ${conn.goal_id}`,
      });
    }
  }

  // similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }


  //helper for mapping
  private formatGoal(goal: any): GoalResponseDto {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    helpText: goal.helpText,
    visionBoardFilename: goal.visionBoardFilename,
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
