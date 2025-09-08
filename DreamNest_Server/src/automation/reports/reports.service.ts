// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyDigest(userId: number) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const goals = await this.prisma.goal.findMany({
      where: { user_id: userId },
      select: { id: true, title: true, progress: true },
    });


    const updatedToday = await this.prisma.plan.findMany({
      where: {
        goal: { user_id: userId },
        updatedAt: { gte: startOfDay },
      },
      select: {
        id: true,
        title: true,
        due_date: true,
        updatedAt: true,
        goal: { select: { title: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });


    const missedSteps = await this.prisma.plan.findMany({
      where: {
        goal: { user_id: userId },
        completed: false,
        due_date: { lt: startOfDay },
      },
      select: {
        id: true,
        title: true,
        due_date: true,
        goal: { select: { title: true } },
      },
      orderBy: { due_date: 'asc' },
      take: 10,
    });

    const totalProgress = goals.reduce((s, g) => s + (g.progress ?? 0), 0);
    const avgProgress = goals.length ? totalProgress / goals.length : 0;

    return {
      date: now.toISOString().slice(0, 10),
      stats: {
        totalGoals: goals.length,
        avgProgress,
        missedCount: missedSteps.length,
        updatedCount: updatedToday.length,
      },
      goals,
      missedSteps: missedSteps.map(p => ({
        planId: p.id,
        title: p.title,
        due_date: p.due_date,
        goalTitle: p.goal.title,
      })),
      updatedToday: updatedToday.map(p => ({
        planId: p.id,
        title: p.title,
        due_date: p.due_date,
        updatedAt: p.updatedAt,
        goalTitle: p.goal.title,
      })),
    };
  }
}
