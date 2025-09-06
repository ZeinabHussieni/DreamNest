import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const prisma = {
    goal: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('aggregates counts and groups by month correctly', async () => {
    const userId = 42;

    // counts
    prisma.goal.count
      .mockResolvedValueOnce(7)  // totalGoals
      .mockResolvedValueOnce(3)  // inProgressGoals
      .mockResolvedValueOnce(2); // completedGoals

    // posts created across months
    prisma.post.findMany.mockResolvedValue([
      { createdAt: new Date('2025-01-15T12:00:00Z') },
      { createdAt: new Date('2025-01-20T08:00:00Z') },
      { createdAt: new Date('2025-02-01T00:00:00Z') },
    ]);

    // goals created across months
    prisma.goal.findMany.mockResolvedValue([
      { createdAt: new Date('2025-01-01T05:00:00Z') },
      { createdAt: new Date('2025-03-31T23:59:59Z') },
      { createdAt: new Date('2025-03-10T10:00:00Z') },
    ]);

    const res = await service.getUserDashboard(userId);

    // counts
    expect(prisma.goal.count).toHaveBeenNthCalledWith(1, { where: { user_id: userId } });
    expect(prisma.goal.count).toHaveBeenNthCalledWith(2, { where: { user_id: userId, progress: { gt: 0, lt: 100 } } });
    expect(prisma.goal.count).toHaveBeenNthCalledWith(3, { where: { user_id: userId, progress: 100 } });

    // posts fetch
    expect(prisma.post.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      select: { createdAt: true },
    });

    // goals fetch for per-month
    expect(prisma.goal.findMany).toHaveBeenCalledWith({
      where: { user_id: userId },
      select: { createdAt: true },
    });

    // payload shape
    expect(res.totalGoals).toBe(7);
    expect(res.inProgressGoals).toBe(3);
    expect(res.completedGoals).toBe(2);

    // grouping logic: YYYY-MM keys
    expect(res.postsPerMonth).toEqual({
      '2025-01': 2,
      '2025-02': 1,
    });
    expect(res.goalsPerMonth).toEqual({
      '2025-01': 1,
      '2025-03': 2,
    });
  });

  it('returns empty maps when no items exist', async () => {
    prisma.goal.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    prisma.post.findMany.mockResolvedValue([]);
    prisma.goal.findMany.mockResolvedValue([]);

    const res = await service.getUserDashboard(1);

    expect(res.totalGoals).toBe(0);
    expect(res.inProgressGoals).toBe(0);
    expect(res.completedGoals).toBe(0);
    expect(res.postsPerMonth).toEqual({});
    expect(res.goalsPerMonth).toEqual({});
  });
});
