import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

type MonthCounts = Record<string, number>;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserDashboard(userId: number) {
    const totalGoals = await this.prisma.goal.count({ where: { user_id: userId } });

    const inProgressGoals = await this.prisma.goal.count({
      where: { user_id: userId, progress: { gt: 0, lt: 100 } },
    });

    const completedGoals = await this.prisma.goal.count({
      where: { user_id: userId, progress: 100 },
    });

    const posts = await this.prisma.post.findMany({
      where: { user_id: userId },
      select: { createdAt: true },
    });
    const postsPerMonth = this.groupByMonth(posts);

    const goals = await this.prisma.goal.findMany({
      where: { user_id: userId },
      select: { createdAt: true },
    });
    const goalsPerMonth = this.groupByMonth(goals);

    return { totalGoals, inProgressGoals, completedGoals, postsPerMonth, goalsPerMonth };
  }

  private groupByMonth(items: { createdAt: Date }[]): MonthCounts {
    const result: MonthCounts = {};
    for (const item of items) {
      const month = item.createdAt.toISOString().slice(0, 7);
      result[month] = (result[month] || 0) + 1;
    }
    return result;
  }
}
