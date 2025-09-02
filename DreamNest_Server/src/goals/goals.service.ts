import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { saveBase64Image } from '../common/shared/file.utils';
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

  async getGoals(userId: number, status?: 'completed' | 'in-progress'): Promise<GoalResponseDto[]> {
    try {
      const where: any = { user_id: userId };
      if (status === 'completed') where.progress = { gte: 100 };
      else if (status === 'in-progress') where.progress = { gte: 0, lt: 100 };

      const goals = await this.prisma.goal.findMany({
        where,
        include: { plans: true },
      });

      return goals.map((g) => this.formatGoal(g));
    } catch {
      throw new InternalServerErrorException('Failed to fetch goals');
    }
  }

  async deleteById(id: number): Promise<{ success: boolean }> {
    try {
      const goal = await this.prisma.goal.delete({ where: { id } });
      await this.dashboardGateway.emitDashboardUpdate(goal.user_id);
      return { success: true };
    } catch {
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
          join(process.cwd(), 'storage/private/visionBoard'),
        );
      }

      const [goalEmbedding, aiPlans] = await Promise.all([
        this.generateGoalEmbedding(data.title, data.description),
        this.openAIService.generatePlan(data.title, data.description),
      ]);

      const goal = await this.createGoalInDB(
        { ...data, visionBoardFilename },
        goalEmbedding,
        aiPlans,
      );

      const helpEmbedding = data.helpText
        ? await this.createHelp(data.user_id, data.helpText)
        : null;

      await this.createConnections(data.user_id, goal, goalEmbedding, helpEmbedding, threshold);
      await this.dashboardGateway.emitDashboardUpdate(data.user_id);

      return this.formatGoal(goal);
    } catch (err) {
      console.error('Goal creation with AI failed:', err);
      throw new BadRequestException('Goal creation with AI failed');
    }
  }

  private async generateGoalEmbedding(title: string, description: string): Promise<number[]> {
    return this.openAIService.generateEmbedding(`${title}. ${description}`);
  }

  private async generateHelpEmbedding(helpText: string): Promise<number[]> {
    return this.openAIService.generateEmbedding(helpText);
  }

  private toDateSafe(input: unknown, offsetDays = 0): Date {
    const MS_DAY = 24 * 60 * 60 * 1000;
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const fallback = new Date(base.getTime() + offsetDays * MS_DAY);
    if (!input) return fallback;
    const d = new Date(String(input));
    return isNaN(d.getTime()) ? fallback : d;
  }

  private async createGoalInDB(
    data: any,
    goalEmbedding: number[],
    aiPlans: any[],
  ) {
    const steps = (Array.isArray(aiPlans) ? aiPlans : []).slice(0, 5);

    return this.prisma.goal.create({
      data: {
        title: data.title,
        description: data.description,
        helpText: data.helpText || null,
        visionBoardFilename: data.visionBoardFilename || null,
        embedding: goalEmbedding.length ? goalEmbedding : Prisma.JsonNull,
        user: { connect: { id: data.user_id } },
        plans: {
          create: steps.map((p, i) => ({
            title: String(p?.title ?? `Step ${i + 1}`),
            description: String(p?.description ?? ''),
            due_date: this.toDateSafe(p?.due_date, i * 7),
            completed: Boolean(p?.completed ?? false),
          })),
        },
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

    helps.forEach((h) => {
      if (!h.embedding || h.user_id === userId) return;
      const score = this.cosineSimilarity(goalEmbedding, h.embedding as number[]);
      if (score >= threshold) {
        connectionsToCreate.push({
          helper_id: h.user_id,
          seeker_id: userId,
          goal_id: goal.id,
          similarityScore: score,
          status: 'pending',
          helperDecision: 'pending',
          seekerDecision: 'pending',
        });
      }
    });

    if (helpEmbedding) {
      const otherGoals = await this.prisma.goal.findMany({
        where: { embedding: { not: Prisma.JsonNull }, user_id: { not: userId } },
        select: { id: true, user_id: true, embedding: true },
      });

      otherGoals.forEach((g) => {
        const score = this.cosineSimilarity(helpEmbedding, g.embedding as number[]);
        if (score >= threshold) {
          connectionsToCreate.push({
            helper_id: userId,
            seeker_id: g.user_id,
            goal_id: g.id,
            similarityScore: score,
            status: 'pending',
            helperDecision: 'pending',
            seekerDecision: 'pending',
          });
        }
      });
    }

    if (connectionsToCreate.length) {
      await this.prisma.connection.createMany({
        data: connectionsToCreate,
        skipDuplicates: true,
      });

      for (const c of connectionsToCreate) {
        await this.notificationService.createAndPush({
          type: 'NEW_CONNECTION',
          userId: c.seeker_id,
          actorId: c.helper_id,
          goalId: c.goal_id,
          content: `Someone may help with your goal.`,
        });
        await this.notificationService.createAndPush({
          type: 'NEW_CONNECTION',
          userId: c.helper_id,
          actorId: c.seeker_id,
          goalId: c.goal_id,
          content: `You may help someone with their goal.`,
        });
      }
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB);
  }

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
