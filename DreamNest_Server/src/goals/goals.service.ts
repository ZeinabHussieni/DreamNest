import {Injectable,NotFoundException,BadRequestException,InternalServerErrorException,Logger,} from '@nestjs/common';
import { Prisma, Goal } from '@prisma/client';
import { join } from 'path';

import { PrismaService } from '../prisma/prisma.service';
import { saveBase64Image } from '../common/shared/file.utils';
import { OpenAIService } from '../openai/openai.service';
import { PlanningAgentService } from 'src/agent/agent.service';
import { DashboardGateway } from 'src/dashboard/gateway/dashboard.gateway';
import { GoalResponseDto } from './responseDto/goal-response.dto';
import { NotificationService } from 'src/notification/notification.service';
import { ConfigService } from '@nestjs/config';

type Vec = number[];

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);
  private readonly simThreshold: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardGateway,
    private readonly openAI: OpenAIService,
    private readonly notifications: NotificationService,
    private readonly agent: PlanningAgentService,
    private readonly config: ConfigService,
  ) {
    this.simThreshold = Number(this.config.get('SIM_THRESHOLD') ?? 0.4);
  }



  async findById(id: number): Promise<GoalResponseDto> {
    try {
      const goal = await this.prisma.goal.findUnique({
        where: { id },
        include: { plans: true },
      });
      if (!goal) throw new NotFoundException('Goal not found');
      return this.formatGoal(goal);
    } catch (err: any) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error('findById failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch goal');
    }
  }

  async getGoals(userId: number,status?: 'completed' | 'in-progress',
  ): Promise<GoalResponseDto[]> {
    try {
      const where: Prisma.GoalWhereInput = { user_id: userId };
      if (status === 'completed') where.progress = { gte: 100 };
      if (status === 'in-progress') where.progress = { gte: 0, lt: 100 };

      const goals = await this.prisma.goal.findMany({
        where,
        include: { plans: true },
      });
      return goals.map((g) => this.formatGoal(g));
    } catch (err: any) {
      this.logger.error('getGoals failed', err?.stack || err);
      throw new InternalServerErrorException('Failed to fetch goals');
    }
  }

  async deleteById(id: number): Promise<{ success: boolean }> {
    try {
      const goal = await this.prisma.goal.delete({ where: { id } });
      this.dashboard.emitDashboardUpdate(goal.user_id).catch((e) =>
        this.logger.warn(`emitDashboardUpdate failed: ${e?.message ?? e}`),
      );
      return { success: true };
    } catch {
      this.logger.warn(`deleteById: ${id} not found`);
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
    const { title, description, helpText, visionBoardBase64, user_id } = data;

    try {
      const [visionBoardFilename, goalEmbedding, helpEmbedding] = await Promise.all([
        visionBoardBase64
          ? Promise.resolve(
              saveBase64Image(
                visionBoardBase64,
                join(process.cwd(), 'storage/private/visionBoard'),
              ),
            )
          : Promise.resolve<string | undefined>(undefined),
        this.embedText(`${title}. ${description}`, 'goal'),
        helpText ? this.embedText(helpText, 'help') : Promise.resolve<Vec | null>(null),
      ]);

      const goal = await this.prisma.goal.create({
        data: {
          title,
          description,
          helpText: helpText ?? null,
          visionBoardFilename: visionBoardFilename ?? null,
          embedding: goalEmbedding.length ? goalEmbedding : Prisma.JsonNull,
          user: { connect: { id: user_id } },
        },
        select: { id: true },
      });

      await this.agent.planAndAttachToGoal({
        userId: user_id,
        goalId: goal.id,
        title,
        description,
      });

      const goalWithPlans = await this.prisma.goal.findUnique({
        where: { id: goal.id },
        include: { plans: true },
      });
      if (!goalWithPlans) throw new Error('Created goal not found');

      await this.buildConnections(user_id, goalWithPlans, goalEmbedding, helpEmbedding);

      this.dashboard.emitDashboardUpdate(user_id).catch((e) =>
        this.logger.warn(`emitDashboardUpdate failed: ${e?.message ?? e}`),
      );

      return this.formatGoal(goalWithPlans);
    } catch (err: any) {
      this.logger.error('createGoalWithAI failed', err?.stack || err);
      throw new BadRequestException('Goal creation with AI failed');
    }
  }



  private async embedText(text: string, label: 'goal' | 'help'): Promise<Vec> {
    const v = await this.openAI.generateEmbedding(text);
    this.logger.log(`[EMBED] ${label} dims=${v?.length ?? 0}`);
    return v ?? [];
  }



  private async buildConnections(
    userId: number,
    goal: Goal & { plans?: any[] },
    goalEmbedding: Vec,
    helpEmbedding: Vec | null,
  ): Promise<void> {
    if (!goalEmbedding?.length) return;

    const threshold = this.simThreshold;

    const [helps, otherGoals] = await Promise.all([
      this.prisma.help.findMany({
        where: { embedding: { not: Prisma.JsonNull } },
        select: { user_id: true, embedding: true },
      }),
      helpEmbedding?.length
        ? this.prisma.goal.findMany({
            where: { embedding: { not: Prisma.JsonNull }, user_id: { not: userId } },
            select: { id: true, user_id: true, embedding: true },
          })
        : Promise.resolve<Array<{ id: number; user_id: number; embedding: Prisma.JsonValue }>>([]),
    ]);

    const toCreate: Prisma.ConnectionCreateManyInput[] = [];
    for (const h of helps) {
      const emb = (h.embedding as Vec | null) ?? null;
      if (!emb || h.user_id === userId) continue;

      const score = this.cosineSimilarity(goalEmbedding, emb);
      if (score >= threshold) {
        toCreate.push({
          helper_id: h.user_id,
          seeker_id: userId,
          goal_id: goal.id,
          similarityScore: score,
          status: 'pending',
          helperDecision: 'pending',
          seekerDecision: 'pending',
        });
      }
    }

    if (helpEmbedding?.length) {
      for (const g of otherGoals) {
        const emb = (g.embedding as Vec | null) ?? null;
        if (!emb) continue;

        const score = this.cosineSimilarity(helpEmbedding, emb);
        if (score >= threshold) {
          toCreate.push({
            helper_id: userId,
            seeker_id: g.user_id,
            goal_id: g.id,
            similarityScore: score,
            status: 'pending',
            helperDecision: 'pending',
            seekerDecision: 'pending',
          });
        }
      }
    }

    if (!toCreate.length) return;

    await this.prisma.connection.createMany({ data: toCreate, skipDuplicates: true });

    await Promise.allSettled(
      toCreate.flatMap((c) => [
        this.notifications.createAndPush({
          type: 'NEW_CONNECTION',
          userId: c.seeker_id,
          actorId: c.helper_id,
          goalId: c.goal_id,
          content: 'Someone may help with your goal.',
        }),
        this.notifications.createAndPush({
          type: 'NEW_CONNECTION',
          userId: c.helper_id,
          actorId: c.seeker_id,
          goalId: c.goal_id,
          content: 'You may help someone with their goal.',
        }),
      ]),
    );
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!Array.isArray(a) || !Array.isArray(b)) return 0;
    const n = a.length;
    if (!n || n !== b.length) return 0;
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < n; i++) {
      const ai = a[i];
      const bi = b[i];
      dot += ai * bi;
      na += ai * ai;
      nb += bi * bi;
    }
    if (!na || !nb) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
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
      plans: goal.plans?.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        due_date: p.due_date,
        completed: p.completed,
      })),
    };
  }
}
