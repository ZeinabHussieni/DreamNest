import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanService } from '../plan.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { CoinReason } from '@prisma/client';

describe('PlanService', () => {
  let service: PlanService;


  const prisma = {
    goal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    coinLedger: {
      create: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },

   
    $transaction: jest.fn(async (cb: any) => {
      const tx = {
        plan: {
          updateMany: prisma.plan.updateMany,
          count: prisma.plan.count,
          findUnique: prisma.plan.findUnique,
        },
        goal: {
          update: prisma.goal.update,
        },
        coinLedger: {
          create: prisma.coinLedger.create,
        },
        user: {
          update: prisma.user.update,
        },
      };
      return cb(tx);
    }),
  };

  const notification = {
    createAndPush: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notification },
      ],
    }).compile();

    service = module.get(PlanService);
  });

  describe('findById', () => {
    it('returns a formatted plan', async () => {
      prisma.plan.findUnique.mockResolvedValue({
        id: 1, title: 'T', description: 'D', due_date: new Date('2025-01-01'),
        completed: false, goal_id: 9, createdAt: new Date(), updatedAt: new Date(),
      });

      const res = await service.findById(1);
      expect(prisma.plan.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res).toMatchObject({ id: 1, title: 'T', goal_id: 9 });
    });

    it('throws if not found', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('throws if goal not found', async () => {
      prisma.goal.findUnique.mockResolvedValue(null);
      await expect(
        service.create(10, { title: 't', description: 'd', due_date: '2025-01-01', completed: false }),
      ).rejects.toThrow('Goal not found');
    });

    it('creates plan under goal and formats', async () => {
      prisma.goal.findUnique.mockResolvedValue({ id: 10 });
      const fake = {
        id: 3, title: 't', description: 'd', due_date: new Date('2025-01-01'),
        completed: false, goal_id: 10, createdAt: new Date(), updatedAt: new Date(),
      };
      prisma.plan.create.mockResolvedValue(fake);

      const res = await service.create(10, { title: 't', description: 'd', due_date: '2025-01-01', completed: false });

      expect(prisma.plan.create).toHaveBeenCalledWith({
        data: {
          title: 't',
          description: 'd',
          due_date: new Date('2025-01-01'),
          completed: false,
          goal_id: 10,
        },
      });
      expect(res).toMatchObject({ id: 3, title: 't', goal_id: 10 });
    });
  });

  describe('getAllByGoal', () => {
    it('throws if goal not found', async () => {
      prisma.goal.findUnique.mockResolvedValue(null);
      await expect(service.getAllByGoal(7)).rejects.toThrow('Goal not found');
    });

    it('returns sorted plans mapped', async () => {
      prisma.goal.findUnique.mockResolvedValue({ id: 7 });
      const p1 = {
        id: 1, title: 'A', description: 'a', due_date: new Date('2025-01-01'),
        completed: false, goal_id: 7, createdAt: new Date(), updatedAt: new Date(),
      };
      const p2 = {
        id: 2, title: 'B', description: 'b', due_date: new Date('2025-01-02'),
        completed: true, goal_id: 7, createdAt: new Date(), updatedAt: new Date(),
      };
      prisma.plan.findMany.mockResolvedValue([p1, p2]);

      const res = await service.getAllByGoal(7);

      expect(prisma.plan.findMany).toHaveBeenCalledWith({
        where: { goal_id: 7 },
        orderBy: { due_date: 'asc' },
      });
      expect(res).toHaveLength(2);
      expect(res[0]).toMatchObject({ id: 1, title: 'A' });
      expect(res[1]).toMatchObject({ id: 2, title: 'B' });
    });
  });

  describe('togglePlanDone', () => {
    it('throws if plan not found', async () => {
      prisma.plan.findUnique.mockResolvedValue(null);
      await expect(service.togglePlanDone(5)).rejects.toThrow('Plan not found');
    });

    it('returns as-is if already completed', async () => {
      const plan = {
        id: 1, title: 'done', description: 'd', due_date: new Date(),
        completed: true, goal_id: 2, createdAt: new Date(), updatedAt: new Date(),
        goal: { id: 2, user: { id: 100 } },
      };
      prisma.plan.findUnique.mockResolvedValue(plan);

      const res = await service.togglePlanDone(1);
      expect(res).toMatchObject({ id: 1, completed: true });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('sets completed, updates goal progress, gives coins, sends notification', async () => {
      const plan = {
        id: 1, title: 'p', description: 'd', due_date: new Date(),
        completed: false, goal_id: 2, createdAt: new Date(), updatedAt: new Date(),
        goal: { id: 2, user: { id: 100 } },
      };
      prisma.plan.findUnique
        .mockResolvedValueOnce(plan) 
        .mockResolvedValueOnce({ ...plan, completed: true }); 

   
      prisma.plan.updateMany.mockResolvedValue({ count: 1 });

      prisma.plan.count
        .mockResolvedValueOnce(4) 
        .mockResolvedValueOnce(1); 
      prisma.goal.update.mockResolvedValue({});
      prisma.coinLedger.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const res = await service.togglePlanDone(1);

      expect(prisma.plan.updateMany).toHaveBeenCalledWith({
        where: { id: 1, completed: false },
        data: { completed: true },
      });
      expect(prisma.plan.count).toHaveBeenCalledTimes(2);
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { progress: (1 / 4) * 100 },
      });
      
      expect(prisma.coinLedger.create).toHaveBeenCalledWith({
        data: {
          userId: 100,
          delta: expect.any(Number), 
          reason: CoinReason.PLAN_COMPLETED,
          goalId: 2,
          planId: 1,
        },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: { coins: { increment: expect.any(Number) } },
      });
  
      expect(notification.createAndPush).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PLAN_COMPLETED',
          userId: 100,
          planId: 1,
          goalId: 2,
          content: expect.stringContaining('completed'),
        }),
      );

      expect(res).toMatchObject({ id: 1, completed: true });
    });
  });
});
