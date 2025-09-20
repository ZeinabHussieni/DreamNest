import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../dashboard.controller';
import { DashboardService } from '../dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  const svc = {
    getUserDashboard: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: svc }],
    }).compile();

    controller = module.get(DashboardController);
  });

  it('GET /dashboard -> forwards userId and returns dto', async () => {
    const dto = {
      totalGoals: 7,
      inProgressGoals: 3,
      completedGoals: 2,
      postsPerMonth: { '2025-01': 2 },
      goalsPerMonth: { '2025-01': 1 },
    };
    svc.getUserDashboard.mockResolvedValue(dto);

    const res = await controller.getDashboard(99 as any);

    expect(svc.getUserDashboard).toHaveBeenCalledWith(99);
    expect(res).toBe(dto);
  });
});
