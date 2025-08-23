import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserDashboard(userId: number) {

    const totalGoals = await this.prisma.goal.count({ where: { user_id: userId } });

    // the progress goals > 0 but < 100
    const inProgressGoals = await this.prisma.goal.count({
      where: { user_id: userId, progress: { gt: 0, lt: 100 } },
    });

    // completed goals
    const completedGoals = await this.prisma.goal.count({
      where: { user_id: userId, progress: 100 },
    });

    // posts created per month
    const posts = await this.prisma.post.findMany({
      where: { user_id: userId },
    });
    const postsPerMonth = this.groupByMonth(posts);

    // goals created per month
    const goals = await this.prisma.goal.findMany({ where: { user_id: userId } });
    const goalsPerMonth = this.groupByMonth(goals);

    return { totalGoals, inProgressGoals, completedGoals, postsPerMonth, goalsPerMonth };
  }

  private groupByMonth(items: any[]) {
    const result = {};
    items.forEach(item => {
      const month = item.createdAt.toISOString().slice(0, 7); 
      result[month] = (result[month] || 0) + 1;
    });
    return result;
  }
}
