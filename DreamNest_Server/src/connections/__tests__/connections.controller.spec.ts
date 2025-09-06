import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsController } from '../connections.controller';
import { ConnectionsService } from '../connections.service';

describe('ConnectionsController', () => {
  let controller: ConnectionsController;

  const svc = {
    getUserConnections: jest.fn(),
    acceptConnection: jest.fn(),
    rejectConnection: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectionsController],
      providers: [{ provide: ConnectionsService, useValue: svc }],
    }).compile();

    controller = module.get(ConnectionsController);
  });

  it('GET /connections -> forwards userId', async () => {
    svc.getUserConnections.mockResolvedValue([{ id: 1 }]);
    const res = await controller.getUserConnections(7 as any);
    expect(svc.getUserConnections).toHaveBeenCalledWith(7);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('PATCH /:id/accept -> forwards id + userId', async () => {
    svc.acceptConnection.mockResolvedValue({ connection: { id: 1 }, chatRoom: null });
    const res = await controller.acceptConnection(1 as any, 5 as any);
    expect(svc.acceptConnection).toHaveBeenCalledWith(1, 5);
    expect(res).toEqual({ connection: { id: 1 }, chatRoom: null });
  });

  it('PATCH /:id/reject -> forwards id + userId', async () => {
    svc.rejectConnection.mockResolvedValue({ connection: { id: 1 }, chatRoom: null });
    const res = await controller.rejectConnection(1 as any, 5 as any);
    expect(svc.rejectConnection).toHaveBeenCalledWith(1, 5);
    expect(res).toEqual({ connection: { id: 1 }, chatRoom: null });
  });
});
