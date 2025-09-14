import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { ModerationService } from 'src/moderation/moderation.service';
import { TranscribeService } from 'src/transcribe/transcribe.service';
import { StorageService } from 'src/storage/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardGateway } from 'src/dashboard/gateway/dashboard.gateway';

describe('ChatService', () => {
  let service: ChatService;

  const prisma = {
    $transaction: jest.fn(),
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    userModeration: {
      findUnique: jest.fn(),
      upsert: jest.fn(),     
      update: jest.fn(),     
      aggregate: jest.fn(),
      count: jest.fn(),
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
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    messageRead: {
      createMany: jest.fn(),
    },
    post: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    goal: {
      count: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  } as unknown as Record<string, any>;


  const notifications = {
    createAndPush: jest.fn(),
  };

  const moderation = {
    isBlocked: jest.fn().mockResolvedValue({ ok: true }),
    censor: jest.fn().mockReturnValue({ isBad: false, censored: '' }),
    isImageBlocked: jest.fn().mockResolvedValue({ ok: true }),
  };

  const transcribe = {
    transcribeWebm: jest.fn().mockResolvedValue({ text: 'hello' }),
  };

  const storage = {
    moveTempToVoicesPublic: jest.fn().mockResolvedValue({ url: '/voice/test.webm' }),
    moveTempToVoicesQuarantine: jest.fn().mockResolvedValue({ filePath: '/q/voice.webm' }),
    moveTempToImagesPublic: jest.fn().mockResolvedValue({ url: '/image/img.png' }),
    moveTempToImagesQuarantine: jest.fn().mockResolvedValue({ filePath: '/q/image.png' }),
  };

  const events = { emit: jest.fn() };

  const dashboardGateway = {
    emitDashboardUpdate: jest.fn(),
    emitAdminDashboardUpdate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();


    prisma.userModeration.findUnique = jest.fn().mockResolvedValue(null);
    prisma.chatRoomUser.findMany = jest.fn().mockResolvedValue([]);      
    prisma.user.update = jest.fn().mockResolvedValue({ id: 5 });      
    notifications.createAndPush = jest.fn().mockResolvedValue(undefined);


    prisma.$transaction = jest.fn(async (cb: any) => {
      const tx = {
        userModeration: {
          upsert: jest.fn().mockResolvedValue({ userId: 5 }),
          update: jest.fn().mockResolvedValue({}),
        },
        message: {
          create: jest.fn().mockResolvedValue({
            id: 1,
            chatRoomId: 3,
            senderId: 5,
            type: 'text',
            content: 'yo',
            isBad: false,
            status: 'delivered',
            deliveredAt: new Date(),
          }),
        },
      };
      return cb(tx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notifications },
        { provide: ModerationService, useValue: moderation },
        { provide: TranscribeService, useValue: transcribe },
        { provide: StorageService, useValue: storage },
        { provide: EventEmitter2, useValue: events },
        { provide: DashboardGateway, useValue: dashboardGateway },
      ],
    }).compile();

    service = module.get(ChatService);
  });


  describe('createChatRoom', () => {
    it('returns existing room if already present', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 1, userName: 'a' },
        { id: 2, userName: 'b' },
      ]);
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
      prisma.user.findMany.mockResolvedValue([
        { id: 1, userName: 'me' },
        { id: 2, userName: 'other' },
      ]);
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

    it('throws BadRequestException when userIds length is not 2', async () => {
      await expect(service.createChatRoom([1], 1)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when one or both users not found', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 1 }]); 
      await expect(service.createChatRoom([1, 2], 1)).rejects.toThrow(NotFoundException);
    });
  });


  describe('getUserChatRooms', () => {
    it('returns rooms including participants and messages (safe-mapped)', async () => {
      prisma.chatRoom.findMany.mockResolvedValue([
        { id: 5, messages: [], participants: [] },
      ]);

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


      expect(res).toEqual([{ id: 5, messages: [], participants: [] }]);
    });
  });


  describe('getRoomMessages', () => {
    it('returns messages ordered asc (safe-mapped)', async () => {
      prisma.message.findMany.mockResolvedValue([{ id: 1, content: 'hi' }]);

      const res = await service.getRoomMessages(7);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatRoomId: 7 },
        orderBy: { createdAt: 'asc' },
      });
      expect(res).toEqual([{ id: 1, content: 'hi' }]);
    });

    it('rethrows prisma errors', async () => {
      prisma.message.findMany.mockRejectedValue(new Error('db'));
      await expect(service.getRoomMessages(1)).rejects.toThrow('db');
    });
  });


  describe('createTextMessage', () => {
    it('creates a text message when user is a room participant', async () => {
      prisma.chatRoomUser.findFirst.mockResolvedValue({ id: 99 }); 

      prisma.$transaction.mockImplementationOnce(async (cb: any) => {
        const tx = {
          userModeration: {
            upsert: jest.fn().mockResolvedValue({ userId: 5 }),
            update: jest.fn().mockResolvedValue({}),
          },
          message: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              chatRoomId: 3,
              senderId: 5,
              type: 'text',
              content: 'yo',
              isBad: false,
              status: 'delivered',
              deliveredAt: new Date(),
            }),
          },
        };
        return cb(tx);
      });

      const res = await service.createTextMessage(3, 5, 'yo');

      expect(prisma.chatRoomUser.findFirst).toHaveBeenCalledWith({
        where: { chatRoomId: 3, userId: 5 },
      });


      expect(res).toMatchObject({
        id: 1,
        chatRoomId: 3,
        senderId: 5,
        type: 'text',
        content: 'yo',
        isBad: false,
        status: 'delivered',
      });
    });

    it('throws BadRequestException when content is empty/whitespace', async () => {
      await expect(service.createTextMessage(1, 2, '  ')).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when user is not a participant', async () => {
      prisma.chatRoomUser.findFirst.mockResolvedValue(null); 
      await expect(service.createTextMessage(2, 5, 'hey')).rejects.toThrow(ForbiddenException);
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
