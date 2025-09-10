import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GoalsService } from '../goals.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardGateway } from 'src/dashboard/gateway/dashboard.gateway';
import { OpenAIService } from 'src/openai/openai.service';
import { NotificationService } from 'src/notification/notification.service';
import { PlanningAgentService } from 'src/agent/agent.service';
import { ConfigService } from '@nestjs/config';


let errSpy: jest.SpyInstance;
beforeAll(() => {
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  errSpy.mockRestore();
});


jest.mock('src/common/shared/file.utils', () => ({
  saveBase64Image: jest.fn(() => 'vision.png'),
}));

describe('GoalsService', () => {
  let service: GoalsService;

  const prisma = {
    goal: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    help: {
      findMany: jest.fn(),
    },
    connection: {
      createMany: jest.fn(),
    },
  };

  const gateway = {
  emitDashboardUpdate: jest.fn().mockResolvedValue(undefined), // 👈 async
};


  const openai = {
    generateEmbedding: jest.fn(),
  };

  const notifications = {
    createAndPush: jest.fn(),
  };

  const agent = {
    planAndAttachToGoal: jest.fn(),
  };

  const config = {
    get: jest.fn().mockImplementation((k: string) => {
      if (k === 'SIM_THRESHOLD') return '0.4';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: prisma },
        { provide: DashboardGateway, useValue: gateway },
        { provide: OpenAIService, useValue: openai },
        { provide: NotificationService, useValue: notifications },
        { provide: PlanningAgentService, useValue: agent },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(GoalsService);
  });

  describe('findById', () => {
    it('returns formatted goal', async () => {
      const goal = {
        id: 1, title: 'T', description: 'D', helpText: null, visionBoardFilename: null,
        progress: 0, createdAt: new Date(), updatedAt: new Date(), plans: [],
      };
      prisma.goal.findUnique.mockResolvedValue(goal);

      const res = await service.findById(1);

      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { plans: true },
      });
      expect(res).toMatchObject({ id: 1, title: 'T' });
    });

    it('throws NotFound if none', async () => {
      prisma.goal.findUnique.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('wraps unexpected errors as InternalServerError', async () => {
      prisma.goal.findUnique.mockRejectedValue(new Error('db'));
      await expect(service.findById(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getGoals', () => {
    it('lists all by user, no status filter', async () => {
      prisma.goal.findMany.mockResolvedValue([
        { id: 1, title: 'A', description: 'a', plans: [], createdAt: new Date(), updatedAt: new Date(), progress: 0 },
      ]);

      const res = await service.getGoals(7);

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { user_id: 7 },
        include: { plans: true },
      });
      expect(res[0]).toMatchObject({ id: 1, title: 'A' });
    });

    it('filters completed', async () => {
      prisma.goal.findMany.mockResolvedValue([]);
      await service.getGoals(7, 'completed');
      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 7, progress: { gte: 100 } } }),
      );
    });

    it('filters in-progress', async () => {
      prisma.goal.findMany.mockResolvedValue([]);
      await service.getGoals(7, 'in-progress');
      expect(prisma.goal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 7, progress: { gte: 0, lt: 100 } } }),
      );
    });

    it('wraps errors', async () => {
      prisma.goal.findMany.mockRejectedValue(new Error('x'));
      await expect(service.getGoals(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteById', () => {
    it('deletes and emits dashboard update', async () => {
      prisma.goal.delete.mockResolvedValue({ id: 3, user_id: 12 });
      const res = await service.deleteById(3);

      expect(prisma.goal.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(gateway.emitDashboardUpdate).toHaveBeenCalledWith(12);
      expect(res).toEqual({ success: true });
    });

    it('throws NotFound if prisma throws', async () => {
      prisma.goal.delete.mockRejectedValue(new Error('nope'));
      await expect(service.deleteById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createGoalWithAI', () => {
    it('creates goal with AI (saves vision, embeds, plans via agent) and emits dashboard update', async () => {

      openai.generateEmbedding.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      prisma.goal.create.mockResolvedValue({ id: 10 });
      agent.planAndAttachToGoal.mockResolvedValue(undefined);
      const goalWithPlans = {
        id: 10,
        title: 'Learn TS',
        description: 'Master TypeScript',
        helpText: null,
        visionBoardFilename: 'vision.png',
        progress: 0,
        user_id: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        plans: [
          { id: 1, title: 'Step 1', description: 'desc 1', due_date: new Date('2025-01-01'), completed: false },
          { id: 2, title: 'Step 2', description: 'desc 2', due_date: new Date('2025-01-08'), completed: false },
        ],
      };
      prisma.goal.findUnique.mockResolvedValue(goalWithPlans);
      prisma.help.findMany.mockResolvedValue([]);

      const res = await service.createGoalWithAI({
        title: 'Learn TS',
        description: 'Master TypeScript',
        helpText: undefined,
        visionBoardBase64: 'data:image/png;base64,xxx',
        user_id: 5,
      });

      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          title: 'Learn TS',
          description: 'Master TypeScript',
          helpText: null,
          visionBoardFilename: 'vision.png',
          embedding: [0.1, 0.2, 0.3],
          user: { connect: { id: 5 } },
        },
        select: { id: true },
      });
      expect(agent.planAndAttachToGoal).toHaveBeenCalledWith({
        userId: 5,
        goalId: 10,
        title: 'Learn TS',
        description: 'Master TypeScript',
      });
      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        include: { plans: true },
      });

      expect(gateway.emitDashboardUpdate).toHaveBeenCalledWith(5);

      expect(res).toMatchObject({ id: 10, title: 'Learn TS' });
    });

    it('creates connections + sends notifications when similarity passes threshold', async () => {
      openai.generateEmbedding
        .mockResolvedValueOnce([1, 0, 0]) 
        .mockResolvedValueOnce([1, 0, 0]); 

      prisma.goal.create.mockResolvedValue({ id: 22 });
      agent.planAndAttachToGoal.mockResolvedValue(undefined);

      prisma.goal.findUnique.mockResolvedValue({
        id: 22, title: 'G', description: 'D', helpText: 'H', visionBoardFilename: null,
        progress: 0, user_id: 9, createdAt: new Date(), updatedAt: new Date(), plans: [],
      });

      prisma.help.findMany.mockResolvedValue([
        { user_id: 100, embedding: [1, 0, 0] },
      ]);
      prisma.goal.findMany.mockResolvedValue([
        { id: 500, user_id: 200, embedding: [1, 0, 0] },
      ]);

      prisma.connection.createMany.mockResolvedValue({ count: 2 });
      notifications.createAndPush.mockResolvedValue(undefined);

      const res = await service.createGoalWithAI({
        title: 'G', description: 'D', helpText: 'H', user_id: 9,
      });
      expect(prisma.connection.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          skipDuplicates: true,
        }),
      );
      expect(notifications.createAndPush).toHaveBeenCalled();
      expect(notifications.createAndPush).toHaveBeenCalledTimes(4);

      expect(res.id).toBe(22);
    });

    it('wraps unexpected errors as BadRequestException', async () => {
      openai.generateEmbedding.mockRejectedValue(new Error('openai down'));
      await expect(service.createGoalWithAI({
        title: 'T', description: 'D', user_id: 1,
      })).rejects.toThrow(BadRequestException);
    });
  });
});
