import { Test, TestingModule } from '@nestjs/testing';
import { GoalsController } from '../goals.controller';
import { GoalsService } from '../goals.service';
import { join } from 'path';

describe('GoalsController', () => {
  let controller: GoalsController;

  const service = {
    createGoalWithAI: jest.fn(),
    getGoals: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };

  const resMock = {
    sendFile: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [{ provide: GoalsService, useValue: service }],
    }).compile();

    controller = module.get(GoalsController);
  });

  it('POST /goals -> forwards userId + body to service', async () => {
    service.createGoalWithAI.mockResolvedValue({ id: 1 });
    const dto = { title: 'T', description: 'D' } as any;
    const res = await controller.create(7 as any, dto);

    expect(service.createGoalWithAI).toHaveBeenCalledWith({ ...dto, user_id: 7 });
    expect(res).toEqual({ id: 1 });
  });

  it('GET /goals/visionBoard/file/:filename -> sends file', async () => {
    const filename = 'img.png';
    await controller.getVisionBoard(filename, resMock);
    const expectedPath = join(process.cwd(), 'storage/private/visionBoard', filename);
    expect(resMock.sendFile).toHaveBeenCalledWith(expectedPath);
  });

  it('GET /goals -> forwards userId + optional status', async () => {
    service.getGoals.mockResolvedValue([{ id: 2 }]);
    const res = await controller.getGoals(9 as any, 'completed');

    expect(service.getGoals).toHaveBeenCalledWith(9, 'completed');
    expect(res).toEqual([{ id: 2 }]);
  });

  it('GET /goals/:id -> forwards id', async () => {
    service.findById.mockResolvedValue({ id: 5 });
    const res = await controller.getById(5 as any);
    expect(service.findById).toHaveBeenCalledWith(5);
    expect(res).toEqual({ id: 5 });
  });

  it('DELETE /goals/:id -> forwards id', async () => {
    service.deleteById.mockResolvedValue({ success: true });
    const res = await controller.deleteById(123 as any, 5 as any);

    expect(service.deleteById).toHaveBeenCalledWith(5);
    expect(res).toEqual({ success: true });
  });
});
