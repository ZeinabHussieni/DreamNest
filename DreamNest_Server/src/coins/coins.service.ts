import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DAILY_DECAY } from '../common/shared/coins';
import { NotificationService } from 'src/notification/notification.service'; 
import { CoinReason } from '@prisma/client';

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function endOfUtcDay(d = new Date()) {
  const s = startOfUtcDay(d);
  return new Date(s.getTime() + 24 * 60 * 60 * 1000);
}

@Injectable()
export class CoinsService {
  private readonly logger = new Logger(CoinsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService, 
  ) {}


  async runDailyDecay(forDate?: Date) {
    const base = forDate ?? new Date();
    const start = startOfUtcDay(base);
    const end = endOfUtcDay(base);

    const completedToday = await this.prisma.coinLedger.findMany({
      where: {
        reason: CoinReason.PLAN_COMPLETED,
        createdAt: { gte: start, lt: end },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    const completedUserIds = new Set(completedToday.map((r) => r.userId));

    const allUsers = await this.prisma.user.findMany({ select: { id: true } });

    for (const u of allUsers) {
      if (completedUserIds.has(u.id)) continue;

      let appliedDelta = 0;

      try {
        await this.prisma.$transaction(async (tx) => {
          const me = await tx.user.findUnique({
            where: { id: u.id },
            select: { coins: true },
          });
          const current = me?.coins ?? 0;
          if (current <= 0) return;            

          const delta = Math.max(DAILY_DECAY, -current); 
          if (delta === 0) return;

          await tx.coinLedger.create({
            data: {
              userId: u.id,
              delta,
              reason: CoinReason.DAILY_DECAY,
              decayDay: start,
            },
          });

          await tx.user.update({
            where: { id: u.id },
            data: { coins: { increment: delta } },
          });

          appliedDelta = delta; 
        });

      
        if (appliedDelta < 0) {
          await this.notificationService.createAndPush({
            type: 'DAILY_DECAY',
            userId: u.id,
            content: `Daily reminder: ${appliedDelta} coins for inactivity today. Complete a plan to earn +15 tomorrow!`,
          });
        }
      } catch (e: any) {
        if (e?.code === 'P2002') continue; 
        this.logger.warn(`Decay failed for user ${u.id}: ${e?.message ?? e}`);
      }
    }

    this.logger.log(`Daily decay done for UTC day ${start.toISOString().slice(0, 10)}`);
  }

  @Cron('5 0 * * *', { timeZone: 'UTC' })
  async cronDailyDecay() {
    await this.runDailyDecay();
  }


  async getBalance(userId: number) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });
    return { coins: me?.coins ?? 0 };
  }


  async getLeaderboard(limit: number) {
    const take = Math.max(1, Math.min(limit || 3, 20)); 
    const rows = await this.prisma.user.findMany({
      orderBy: { coins: 'desc' },
      take,
      select: { id: true, userName: true, profilePicture: true, coins: true },
    });
    return { items: rows };
  }
}
