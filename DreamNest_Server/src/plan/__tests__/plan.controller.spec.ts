import { Test, TestingModule } from '@nestjs/testing';
import { PlanController } from '../plan.controller';
import { PlanService } from '../plan.service';
import { join } from 'path';

describe('PlanController', () => {
  let controller: PlanController;

  const service = {
    create: jest.fn(),
    getAllByGoal: jest.fn(),
    togglePlanDone: jest.fn(),
    findById: jest.fn(),
  };


  const resMock = {
    sendFile: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [{ provide: PlanService, useValue: service }],
    }).compile();

    controller = module.get(PlanController);
  });

  it('create -> forwards to service with params', async () => {
    service.create.mockResolvedValue({ id: 1 });
    const dto = { title: 't', description: 'd', due_date: '2025-01-01' } as any;
    const res = await controller.create(9 as any, dto);
    expect(service.create).toHaveBeenCalledWith(9, dto);
    expect(res).toEqual({ id: 1 });
  });

  it('getAllByGoal -> forwards goalId', async () => {
    service.getAllByGoal.mockResolvedValue([{ id: 2 }]);
    const res = await controller.getAllByGoal(9 as any);
    expect(service.getAllByGoal).toHaveBeenCalledWith(9);
    expect(res).toEqual([{ id: 2 }]);
  });

  it('togglePlanDone -> forwards planId', async () => {
    service.togglePlanDone.mockResolvedValue({ id: 3, completed: true });
    const res = await controller.togglePlanDone(3 as any);
    expect(service.togglePlanDone).toHaveBeenCalledWith(3);
    expect(res).toEqual({ id: 3, completed: true });
  });

  it('getById -> forwards planId', async () => {
    service.findById.mockResolvedValue({ id: 4 });
    const res = await controller.getById(4 as any);
    expect(service.findById).toHaveBeenCalledWith(4);
    expect(res).toEqual({ id: 4 });
  });

  it('getProfile -> sends the file from storage folder', async () => {
    const filename = 'abc.png';
    await controller.getProfile(filename, resMock as any);

    const expectedPath = join(process.cwd(), 'storage/private/visionBoard', filename);
    expect(resMock.sendFile).toHaveBeenCalledWith(expectedPath);
  });
});
