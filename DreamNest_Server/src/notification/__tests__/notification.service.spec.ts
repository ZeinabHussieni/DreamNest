import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from '../notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationGateway } from '../gateway/notification.gateway';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

let logSpy: jest.SpyInstance, errSpy: jest.SpyInstance;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errSpy  = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => { logSpy.mockRestore(); errSpy.mockRestore(); });

describe('NotificationService', () => {
  let service: NotificationService;

  const prisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const gateway = {
    pushNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  describe('createNotification', () => {
    it('creates and returns a notification', async () => {
      const dto = { type: 'LIKE_POST', userId: 1, content: 'hi' };
      prisma.notification.create.mockResolvedValue({ id: 10, ...dto });

      const res = await service.createNotification(dto as any);

      expect(prisma.notification.create).toHaveBeenCalledWith({ data: dto });
      expect(res).toEqual({ id: 10, ...dto });
    });

    it('wraps prisma error with InternalServerErrorException', async () => {
      prisma.notification.create.mockRejectedValue(new Error('db fail'));
      await expect(
        service.createNotification({ type: 'X', userId: 1, content: 'c' } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('createAndPush', () => {
    it('creates then pushes via gateway', async () => {
      const dto = { type: 'LIKE_POST', userId: 2, content: 'yo' };
      const row = { id: 99, ...dto };
      prisma.notification.create.mockResolvedValue(row);

      const res = await service.createAndPush(dto as any);

      expect(prisma.notification.create).toHaveBeenCalledWith({ data: dto });
      expect(gateway.pushNotification).toHaveBeenCalledWith(2, row);
      expect(res).toBe(row);
    });
  });

  describe('getUserNotifications', () => {
    it('returns notifications ordered desc', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const res = await service.getUserNotifications(7);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('wraps errors with InternalServerErrorException', async () => {
      prisma.notification.findMany.mockRejectedValue(new Error('x'));
      await expect(service.getUserNotifications(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('markAsRead', () => {
    it('marks as read and returns row', async () => {
      prisma.notification.update.mockResolvedValue({ id: 5, read: true });
      const res = await service.markAsRead(5);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { read: true },
      });
      expect(res).toEqual({ id: 5, read: true });
    });

    it('throws NotFoundException on P2025', async () => {
      const err: any = new Error('no row');
      err.code = 'P2025';
      prisma.notification.update.mockRejectedValue(err);

      await expect(service.markAsRead(999)).rejects.toThrow(NotFoundException);
    });

    it('throws InternalServerErrorException on other errors', async () => {
      prisma.notification.update.mockRejectedValue(new Error('boom'));
      await expect(service.markAsRead(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteById', () => {
    it('deletes by id and returns success', async () => {
      prisma.notification.delete.mockResolvedValue({ id: 3 });
      const res = await service.deleteById(3);

      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(res).toEqual({ success: true });
    });

    it('throws NotFoundException on P2025', async () => {
      const err: any = new Error('no row');
      err.code = 'P2025';
      prisma.notification.delete.mockRejectedValue(err);

      await expect(service.deleteById(123)).rejects.toThrow(NotFoundException);
    });

    it('throws InternalServerErrorException otherwise', async () => {
      prisma.notification.delete.mockRejectedValue(new Error('fail'));
      await expect(service.deleteById(1)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteAllForUser', () => {
    it('deletes many and returns deletedCount', async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 4 });

      const res = await service.deleteAllForUser(10);

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({ where: { userId: 10 } });
      expect(res).toEqual({ success: true, deletedCount: 4 });
    });

    it('throws NotFoundException if count === 0', async () => {
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 });
      await expect(service.deleteAllForUser(10)).rejects.toThrow(NotFoundException);
    });

    it('throws InternalServerErrorException on unexpected error', async () => {
      prisma.notification.deleteMany.mockRejectedValue(new Error('db down'));
      await expect(service.deleteAllForUser(10)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
