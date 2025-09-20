import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoinsService } from '../coins.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CoinReason } from '@prisma/client';

describe('CoinsService', () => {
  let service: CoinsService;

 
  const prisma = {
    coinLedger: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: any) => {
      const tx = {
        user: {
          findUnique: prisma.user.findUnique,
          update: prisma.user.update,
        },
        coinLedger: {
          create: prisma.coinLedger.create,
        },
      };
      return cb(tx);
    }),
  };

  const notifications = {
    createAndPush: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile();

    service = module.get(CoinsService);
  });

  describe('getBalance', () => {
    it('returns coins when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ coins: 12 });
      const res = await service.getBalance(7);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 7 },
        select: { coins: true },
      });
      expect(res).toEqual({ coins: 12 });
    });

    it('defaults to 0 if user not found or coins null', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await service.getBalance(1);
      expect(res).toEqual({ coins: 0 });
    });
  });

  describe('getLeaderboard', () => {
  it('defaults to 3 when limit is 0 (falsy)', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 1, coins: 10 }]);
    const res = await service.getLeaderboard(0 as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: { coins: 'desc' },
      take: 3, 
      select: { id: true, userName: true, profilePicture: true, coins: true },
    });
    expect(res).toEqual({ items: [{ id: 1, coins: 10 }] });
  });

  it('respects min=1 when limit is negative', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 2, coins: 5 }]);
    const res = await service.getLeaderboard(-5 as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: { coins: 'desc' },
      take: 1, 
      select: { id: true, userName: true, profilePicture: true, coins: true },
    });
    expect(res).toEqual({ items: [{ id: 2, coins: 5 }] });
  });

  it('defaults to 3 when limit undefined', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await service.getLeaderboard(undefined as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
  });

  it('caps at 20 when limit is big', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await service.getLeaderboard(50);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});


  describe('runDailyDecay', () => {
    const forDate = new Date('2025-02-02T10:00:00Z'); 

    it('skips users who completed a plan today', async () => {
    
      prisma.coinLedger.findMany.mockResolvedValue([
        { userId: 10 },
      ]);
      prisma.user.findMany.mockResolvedValue([{ id: 10 }, { id: 20 }]);

    
      prisma.user.findUnique.mockResolvedValue({ coins: 0 });

      await service.runDailyDecay(forDate);

   
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.coinLedger.create).not.toHaveBeenCalled();

    
      expect(notifications.createAndPush).not.toHaveBeenCalled();
    });

    it('applies negative delta and sends notification for inactive users with coins', async () => {
  
      prisma.coinLedger.findMany.mockResolvedValue([]);
     
      prisma.user.findMany.mockResolvedValue([{ id: 99 }]);
    
      prisma.user.findUnique.mockResolvedValue({ coins: 10 });

      await service.runDailyDecay(forDate);

     
      expect(prisma.coinLedger.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 99,
          reason: CoinReason.DAILY_DECAY,
          delta: expect.any(Number),
          decayDay: expect.any(Date),
        }),
      });

     
      const updateArg = prisma.user.update.mock.calls[0][0];
      expect(updateArg).toEqual({
        where: { id: 99 },
        data: { coins: { increment: expect.any(Number) } },
      });
      const applied = updateArg.data.coins.increment as number;
      expect(applied).toBeLessThanOrEqual(0); 
      expect(applied).toBeGreaterThanOrEqual(-10);

      expect(notifications.createAndPush).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DAILY_DECAY',
          userId: 99,
          content: expect.stringContaining('Daily reminder'),
        }),
      );
    });

    it('uses min(current, |DAILY_DECAY|) so low-balance users do not go negative', async () => {
      prisma.coinLedger.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([{ id: 5 }]);
      prisma.user.findUnique.mockResolvedValue({ coins: 2 });

      await service.runDailyDecay(forDate);

      const updateArg = prisma.user.update.mock.calls[0][0];
      const applied = updateArg.data.coins.increment as number;
      expect(applied).toBeLessThanOrEqual(0);
    
      expect(applied).toBeGreaterThanOrEqual(-2);

   
      expect(prisma.coinLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: CoinReason.DAILY_DECAY }),
        }),
      );
    });

    it('ignores unique constraint (P2002) errors and continues', async () => {
      prisma.coinLedger.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
     
      const err: any = new Error('dup');
      err.code = 'P2002';
      prisma.$transaction.mockImplementationOnce(async () => {
        throw err;
      });

      await expect(service.runDailyDecay(forDate)).resolves.toBeUndefined();

 
      expect(notifications.createAndPush).not.toHaveBeenCalled();
    });
  });
});
