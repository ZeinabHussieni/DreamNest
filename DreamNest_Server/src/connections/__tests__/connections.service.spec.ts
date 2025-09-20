import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsService } from '../connections.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatService } from 'src/chat/chat.service';

describe('ConnectionsService', () => {
  let service: ConnectionsService;

  const prisma = {
    connection: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const chat = {
    createChatRoom: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ChatService, useValue: chat },
      ],
    }).compile();

    service = module.get(ConnectionsService);
  });

  describe('getUserConnections', () => {
    it('queries both seeker/helper sides, includes relations, orders desc', async () => {
      prisma.connection.findMany.mockResolvedValue([{ id: 1 }]);
      const res = await service.getUserConnections(7);

      expect(prisma.connection.findMany).toHaveBeenCalledWith({
        where: { OR: [{ seeker_id: 7 }, { helper_id: 7 }] },
        include: {
          helper: { select: { id: true, userName: true, profilePicture: true } },
          seeker: { select: { id: true, userName: true, profilePicture: true } },
          goal:   { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(res).toEqual([{ id: 1 }]);
    });
  });

  describe('acceptConnection', () => {
    it('throws NotFound if connection missing', async () => {
      prisma.connection.findUnique.mockResolvedValue(null);
      await expect(service.acceptConnection(99, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden if user not part of connection', async () => {
      prisma.connection.findUnique.mockResolvedValue({ id: 1, helper_id: 2, seeker_id: 3 });
      await expect(service.acceptConnection(1, 999)).rejects.toThrow(ForbiddenException);
    });

    it('marks accepted for helper and returns no chat if only one side accepted', async () => {
      const conn = { id: 1, helper_id: 5, seeker_id: 8, helperDecision: 'pending', seekerDecision: 'pending' };
      prisma.connection.findUnique.mockResolvedValue(conn);
      // first update after decision
      const updated = { ...conn, helperDecision: 'accepted', seekerDecision: 'pending' };
      prisma.connection.update.mockResolvedValueOnce(updated);

      const res = await service.acceptConnection(1, 5);

      expect(prisma.connection.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { helperDecision: 'accepted' },
      });
      expect(res).toEqual({ connection: updated, chatRoom: null });
      expect(chat.createChatRoom).not.toHaveBeenCalled();
    });

    it('creates chat + finalizes when both accepted', async () => {
      const conn = { id: 1, helper_id: 5, seeker_id: 8, helperDecision: 'pending', seekerDecision: 'accepted' };
      prisma.connection.findUnique.mockResolvedValue(conn);

      // update decision -> now both accepted
      const afterDecision = { ...conn, helperDecision: 'accepted', seekerDecision: 'accepted' };
      prisma.connection.update
        .mockResolvedValueOnce(afterDecision) // first update (decision)
        .mockResolvedValueOnce({             // second update (status/chatRoom)
          id: 1,
          status: 'accepted',
          chatRoomId: 123,
          helper_id: 5,
          seeker_id: 8,
          helper: { id: 5, userName: 'H' },
          seeker: { id: 8, userName: 'S' },
          goal:   { id: 10, title: 'Goal' },
          helperDecision: 'accepted',
          seekerDecision: 'accepted',
        });

      chat.createChatRoom.mockResolvedValue({ id: 123, members: [5, 8] });

      const res = await service.acceptConnection(1, 5);

      expect(prisma.connection.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: { helperDecision: 'accepted' },
      });
      expect(chat.createChatRoom).toHaveBeenCalledWith([5, 8], 5);
      expect(prisma.connection.update).toHaveBeenNthCalledWith(2, {
        where: { id: 1 },
        data: { status: 'accepted', chatRoomId: 123 },
        include: {
          helper: { select: { id: true, userName: true } },
          seeker: { select: { id: true, userName: true } },
          goal:   { select: { id: true, title: true } },
        },
      });
      expect(res.chatRoom).toEqual({ id: 123, members: [5, 8] });
      expect(res.connection.status).toBe('accepted');
      expect(res.connection.chatRoomId).toBe(123);
    });
  });

  describe('rejectConnection', () => {
    it('throws NotFound if connection missing', async () => {
      prisma.connection.findUnique.mockResolvedValue(null);
      await expect(service.rejectConnection(9, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden if user not part of connection', async () => {
      prisma.connection.findUnique.mockResolvedValue({ id: 1, helper_id: 2, seeker_id: 3 });
      await expect(service.rejectConnection(1, 999)).rejects.toThrow(ForbiddenException);
    });

    it('helper rejects -> sets helperDecision & status rejected', async () => {
      const conn = { id: 1, helper_id: 5, seeker_id: 8 };
      prisma.connection.findUnique.mockResolvedValue(conn);

      const updated = { ...conn, helperDecision: 'rejected', seekerDecision: 'pending', status: 'rejected' };
      prisma.connection.update.mockResolvedValue(updated);

      const res = await service.rejectConnection(1, 5);

      expect(prisma.connection.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { helperDecision: 'rejected', status: 'rejected' },
      });
      expect(res).toEqual({ connection: updated, chatRoom: null });
    });

    it('seeker rejects -> sets seekerDecision & status rejected', async () => {
      const conn = { id: 1, helper_id: 5, seeker_id: 8 };
      prisma.connection.findUnique.mockResolvedValue(conn);

      const updated = { ...conn, helperDecision: 'pending', seekerDecision: 'rejected', status: 'rejected' };
      prisma.connection.update.mockResolvedValue(updated);

      const res = await service.rejectConnection(1, 8);

      expect(prisma.connection.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { seekerDecision: 'rejected', status: 'rejected' },
      });
      expect(res).toEqual({ connection: updated, chatRoom: null });
    });
  });
});
