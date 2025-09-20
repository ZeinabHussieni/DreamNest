import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

type MonthCounts = Record<string, number>;
type Offender = {
  userId: number;
  userName: string | null;
  email: string;
  totalInfractions: number;
  textInfractions: number;
  voiceInfractions: number;
  imageInfractions: number;
  chatBlocked: boolean;
  siteBlocked: boolean;
  lastUpdated: Date;
};

type SafeBadMessage = {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderName: string | null;
  type: string;               
  status: string;           
  badReason: string | null;
  createdAt: Date;
  textPreview?: string;     
  transcriptPreview?: string;  
};

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

   async getGlobalAdminDashboard() {
    const [usersTotal, postsTotal, goalsTotal, completedGoals, avgGoalProgress] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.post.count(),
        this.prisma.goal.count(),
        this.prisma.goal.count({ where: { progress: 100 } }), 
        this.prisma.goal.aggregate({ _avg: { progress: true } }),
      ]);

    const inProgressGoals = await this.prisma.goal.count({
      where: { progress: { gt: 0, lt: 100 } },
    });

   const [modAgg, chatBlockedCount, siteBlockedCount] = await this.prisma.$transaction([
      this.prisma.userModeration.aggregate({
      where: { totalInfractions: { gt: 0 } },
      _sum: {
       totalInfractions: true,
       textInfractions: true,
       voiceInfractions: true,
       imageInfractions: true,
      },
     _count: true,
    }),
     this.prisma.userModeration.count({ where: { chatBlocked: true } }),
     this.prisma.userModeration.count({ where: { siteBlocked: true } }),
    ]);


    const offendersRaw = await this.prisma.userModeration.findMany({
     where: { totalInfractions: { gt: 0 } },
     orderBy: { totalInfractions: 'desc' },
     take: 20,
     include: { user: { select: { id: true, userName: true, email: true } } },
    });


    const offenders: Offender[] = offendersRaw.map((o) => ({
      userId: o.userId,
      userName: o.user?.userName ?? null,
      email: o.user?.email ?? "",
      totalInfractions: o.totalInfractions,
      textInfractions: o.textInfractions,
      voiceInfractions: o.voiceInfractions,
      imageInfractions: o.imageInfractions,
      chatBlocked: o.chatBlocked,
      siteBlocked: o.siteBlocked,
      lastUpdated: o.updatedAt,
    }));

    const badMsgsRaw = await this.prisma.message.findMany({
      where: { isBad: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        chatRoomId: true,
        senderId: true,
        sender: { select: { userName: true } },
        type: true,
        status: true,
        badReason: true,
        createdAt: true,
        censoredContent: true,
        transcript: true,
      },
    });

    const recentBadMessages: SafeBadMessage[] = badMsgsRaw.map((m) => ({
      id: m.id,
      chatRoomId: m.chatRoomId,
      senderId: m.senderId,
      senderName: m.sender?.userName ?? null,
      type: m.type,
      status: m.status,
      badReason: m.badReason ?? null,
      createdAt: m.createdAt,
      textPreview: m.type === "text" ? (m.censoredContent ?? "████") : undefined,
      transcriptPreview:
        m.type === "voice" && m.transcript ? m.transcript.slice(0, 120) : undefined,
    }));

    const since = this.monthsAgo(6);
    const [postsRecent, goalsRecent, badMsgsRecent] = await this.prisma.$transaction([
      this.prisma.post.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.goal.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.message.findMany({
        where: { isBad: true, createdAt: { gte: since } },
        select: { createdAt: true, type: true },
      }),
    ]);

    const postsPerMonth = this.groupByMonth(postsRecent);
    const goalsPerMonth = this.groupByMonth(goalsRecent);
    const badByMonth = this.groupByMonth(badMsgsRecent);
    const badTextPerMonth = this.groupByMonth(badMsgsRecent.filter((m: any) => m.type === "text"));
    const badVoicePerMonth = this.groupByMonth(badMsgsRecent.filter((m: any) => m.type === "voice"));
    const badImagePerMonth = this.groupByMonth(badMsgsRecent.filter((m: any) => m.type === "image"));

    return {
      totals: {
        usersTotal,
        postsTotal,
        goalsTotal,
        inProgressGoals,
        completedGoals,
        avgGoalProgress: avgGoalProgress._avg.progress ?? 0,
      },
      moderation: {
        usersWithModerationRow: modAgg._count,
        totalInfractions: modAgg._sum.totalInfractions ?? 0,
        byType: {
          text: modAgg._sum.textInfractions ?? 0,
          voice: modAgg._sum.voiceInfractions ?? 0,
          image: modAgg._sum.imageInfractions ?? 0,
        },
        chatBlockedCount,
        siteBlockedCount,
      },
      offenders,            
      recentBadMessages,   
      trends: {
        postsPerMonth,
        goalsPerMonth,
        badPerMonth: badByMonth,
        badTextPerMonth,
        badVoicePerMonth,
        badImagePerMonth,
      },
      generatedAt: new Date(),
    };
  }


  private monthsAgo(n: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private groupByMonth(items: { createdAt: Date }[]): MonthCounts {
    const out: MonthCounts = {};
    for (const it of items) {
      const k = it.createdAt.toISOString().slice(0, 7); 
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }
}
