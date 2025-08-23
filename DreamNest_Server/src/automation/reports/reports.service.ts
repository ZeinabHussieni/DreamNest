import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateUserDailyReport(userId: number) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // all users
    const goals = await this.prisma.goal.findMany({
      where: { user_id: userId },
    });

    // see plans updated
    const plansToday = await this.prisma.plan.findMany({
      where: {
        goal: { user_id: userId },
        updatedAt: { gte: startOfDay },
      },
    });

    // calculate the progress
    let totalProgress = 0;
    let didNothing = true;

    for (const goal of goals) {
      if (goal.progress > 0) didNothing = false;
      totalProgress += goal.progress;
    }

    const avgProgress = goals.length > 0 ? totalProgress / goals.length : 0;

    return {
      goals,
      plansToday,
      avgProgress,
      didNothing,
    };
  }
}
