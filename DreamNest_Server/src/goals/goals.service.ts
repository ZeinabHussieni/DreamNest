import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async getAllByUserId(userId: number) {
    const goals = await this.prisma.goal.findMany({
      where: { user_id: userId },
    });
    if (!goals || goals.length === 0) throw new NotFoundException('No goals found for this user');
    return goals;
  }

  async deleteById(id: number) {
    try {
      const goal = await this.prisma.goal.delete({
        where: { id },
      });
      return goal;
    } catch (err) {
      throw new NotFoundException('Goal not found');
    }
  }

  async create(data: {
    title: string;
    description: string;
    help_text?: string;
    vision_board_url?: string;
    user_id: number;
  }) {
    try {
      return await this.prisma.goal.create({
        data: {
          title: data.title,
          description: data.description,
          help_text: data.help_text || null,
          vision_board_url: data.vision_board_url || null,
          user: { connect: { id: data.user_id } }, 
        },
      });
    } catch (err) {
        console.log(err);
      throw new BadRequestException('Goal creation failed');
    }
  }

  async getGoalsByStatus(userId: number, status: 'completed' | 'in-progress') {
    const goals = await this.prisma.goal.findMany({
      where: {
        user_id: userId,
        progress: status === 'completed' ? 100 : { lt: 100 },
      },
    });
    return goals;
  }

}
