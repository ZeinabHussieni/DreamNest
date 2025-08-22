import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Goal as PrismaGoal } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  //Public methods

  async findById(id: number): Promise<PrismaGoal> {
    try {
      const goal = await this.prisma.goal.findUnique({ where: { id } });
      if (!goal) throw new NotFoundException('Goal not found');
      return this.formatGoal(goal);
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new InternalServerErrorException('Failed to fetch goal');
    }
  }

  async getAllByUserId(userId: number): Promise<PrismaGoal[]> {
    try {
      const goals = await this.prisma.goal.findMany({ where: { user_id: userId } });
      return goals.map(this.formatGoal);
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch goals');
    }
  }

  async create(data: {
    title: string;
    description: string;
    help_text?: string;
    vision_board_url?: string;
    user_id: number;
  }): Promise<PrismaGoal> {
    try {
      const goal = await this.prisma.goal.create({
        data: {
          title: data.title,
          description: data.description,
          help_text: data.help_text || null,
          vision_board_url: data.vision_board_url || null,
          user: { connect: { id: data.user_id } },
        },
      });
      return this.formatGoal(goal);
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Goal creation failed');
    }
  }

  async deleteById(id: number): Promise<{ success: boolean }> {
    try {
      await this.prisma.goal.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      throw new NotFoundException('Goal not found');
    }
  }

  async getGoalsByStatus(userId: number, status: 'completed' | 'in-progress'): Promise<PrismaGoal[]> {
    try {
      const goals = await this.prisma.goal.findMany({
        where: {
          user_id: userId,
          progress: status === 'completed' ? 100 : { lt: 100 },
        },
      });
      return goals.map(this.formatGoal);
    } catch (err) {
      throw new InternalServerErrorException('Failed to fetch goals by status');
    }
  }

  // Private helper

  private formatGoal(goal:PrismaGoal) {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      help_text: goal.help_text,
      vision_board_url: goal.vision_board_url,
      progress: goal.progress,
      user_id: goal.user_id,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }
}
