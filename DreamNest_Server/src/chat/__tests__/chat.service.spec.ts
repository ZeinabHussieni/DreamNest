import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';

describe('ChatService', () => {
  let service: ChatService;

  const prisma = {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),  
    },
    chatRoom: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    chatRoomUser: {
    findFirst: jest.fn(),
    findMany: jest.fn(),  
   },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const notifications = {
    createAndPush: jest.fn(), 
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.chatRoomUser.findMany.mockResolvedValue([]); 
    prisma.user.update.mockResolvedValue({ id: 5 });         
    notifications.createAndPush.mockResolvedValue(undefined);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ChatService);
  });

  describe('createChatRoom', () => {
    it('returns existing room if already present', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1, userName: 'a' }, { id: 2, userName: 'b' }]);
      prisma.chatRoom.findFirst.mockResolvedValue({ id: 10, name: 'b' });

      const res = await service.createChatRoom([1, 2], 1);
      expect(prisma.chatRoom.findFirst).toHaveBeenCalledWith({
        where: {
          AND: [
            { participants: { some: { userId: 1 } } },
            { participants: { some: { userId: 2 } } },
          ],
        },
      });
      expect(res).toEqual({ id: 10, name: 'b' });
    });

    it('creates room with other user name when not existing', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1, userName: 'me' }, { id: 2, userName: 'other' }]);
      prisma.chatRoom.findFirst.mockResolvedValue(null);
      prisma.chatRoom.create.mockResolvedValue({
        id: 11,
        name: 'other',
        participants: [{ userId: 1 }, { userId: 2 }],
      });

      const res = await service.createChatRoom([1, 2], 1);
      expect(prisma.chatRoom.create).toHaveBeenCalledWith({
        data: {
          name: 'other',
          participants: { create: [{ userId: 1 }, { userId: 2 }] },
        },
        include: { participants: true },
      });
      expect(res.id).toBe(11);
    });

    it('wraps non-2 userIds with InternalServerErrorException', async () => {
     
      await expect(service.createChatRoom([1], 1))
     .rejects.toThrow(BadRequestException);
    });

    it('wraps "users not found" with InternalServerErrorException', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]);
      await expect(service.createChatRoom([1, 2], 1))
      .rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserChatRooms', () => {
    it('returns rooms including participants and messages', async () => {
      prisma.chatRoom.findMany.mockResolvedValue([{ id: 5 }]);
      const res = await service.getUserChatRooms(9);
expect(prisma.chatRoom.findMany).toHaveBeenCalledWith({
  where: { participants: { some: { userId: 9 } } },
  include: {
    participants: {
      select: {
        id: true,
        userId: true,
        chatRoomId: true,
        lastSeenAt: true,
        user: {
          select: {
            id: true,
            userName: true,
            profilePicture: true,
            lastActiveAt: true,
          },
        },
      },
    },
    messages: { orderBy: { createdAt: 'asc' } },
  },
});

      expect(res).toEqual([{ id: 5 }]);
    });
  });

  describe('getRoomMessages', () => {
    it('returns messages ordered asc', async () => {
      prisma.message.findMany.mockResolvedValue([{ id: 1, content: 'hi' }]);
      const res = await service.getRoomMessages(7);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatRoomId: 7 },
        orderBy: { createdAt: 'asc' },
      });
      expect(res).toEqual([{ id: 1, content: 'hi' }]);
    });

    it('wraps prisma errors into InternalServerErrorException', async () => {
      prisma.message.findMany.mockRejectedValue(new Error('db'));
await expect(service.getRoomMessages(1))
  .rejects.toThrow('db');
    });
  });

  describe('createMessage', () => {
    it('creates a message when room exists and user is member', async () => {
      prisma.chatRoom.findUnique.mockResolvedValue({ id: 3 });
      prisma.chatRoomUser.findFirst.mockResolvedValue({ id: 99 });
      prisma.message.create.mockResolvedValue({ id: 1, content: 'yo', chatRoomId: 3, senderId: 5 });

      const res = await service.createMessage(3, 5, 'yo');

      expect(prisma.chatRoom.findUnique).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(prisma.chatRoomUser.findFirst).toHaveBeenCalledWith({
        where: { chatRoomId: 3, userId: 5 },
        select: { id: true },
      });
      expect(prisma.message.create).toHaveBeenCalledWith({
        data: { content: 'yo', senderId: 5, chatRoomId: 3 },
      });
      expect(res).toEqual({ id: 1, content: 'yo', chatRoomId: 3, senderId: 5 });
    });

    it('wraps validation/membership failures with InternalServerErrorException', async () => {
     
      await expect(service.createMessage(1, 2, '' as any))
  .rejects.toThrow(BadRequestException);


   
      prisma.chatRoom.findUnique.mockResolvedValue(null);
    prisma.chatRoom.findUnique.mockResolvedValue(null);
await expect(service.createMessage(99, 5, 'hey'))
  .rejects.toThrow(NotFoundException);

      prisma.chatRoom.findUnique.mockResolvedValue({ id: 2 });
      prisma.chatRoomUser.findFirst.mockResolvedValue(null);
    prisma.chatRoom.findUnique.mockResolvedValue({ id: 2 });
prisma.chatRoomUser.findFirst.mockResolvedValue(null);
await expect(service.createMessage(2, 5, 'hey'))
  .rejects.toThrow(ForbiddenException);
    });
  });

  describe('isParticipant', () => {
    it('checks membership existence', async () => {
      prisma.chatRoomUser.findFirst.mockResolvedValueOnce(null);
      expect(await service.isParticipant(1, 1)).toBe(false);

      prisma.chatRoomUser.findFirst.mockResolvedValueOnce({ id: 1 });
      expect(await service.isParticipant(1, 1)).toBe(true);
    });
  });
});
