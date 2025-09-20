import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../notification.controller';
import { NotificationService } from '../notification.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  const service = {
    getUserNotifications: jest.fn(),
    markAsRead: jest.fn(),
    deleteById: jest.fn(),
    deleteAllForUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [{ provide: NotificationService, useValue: service }],
    }).compile();

    controller = module.get(NotificationController);
  });

  it('GET /notifications -> forwards userId', async () => {
    service.getUserNotifications.mockResolvedValue([{ id: 1 }]);
    const res = await controller.getAll(7 as any);
    expect(service.getUserNotifications).toHaveBeenCalledWith(7);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('PATCH /notifications/:id/read -> forwards id', async () => {
    service.markAsRead.mockResolvedValue({ id: 5, read: true });
    const res = await controller.markRead(5 as any);
    expect(service.markAsRead).toHaveBeenCalledWith(5);
    expect(res).toEqual({ id: 5, read: true });
  });

  it('DELETE /notifications/:id -> forwards id', async () => {
    service.deleteById.mockResolvedValue({ success: true });
    const res = await controller.deleteById(11 as any);
    expect(service.deleteById).toHaveBeenCalledWith(11);
    expect(res).toEqual({ success: true });
  });

  it('DELETE /notifications -> forwards userId', async () => {
    service.deleteAllForUser.mockResolvedValue({ success: true, deletedCount: 3 });
    const res = await controller.deleteAllForUser(9 as any);
    expect(service.deleteAllForUser).toHaveBeenCalledWith(9);
    expect(res).toEqual({ success: true, deletedCount: 3 });
  });
});
