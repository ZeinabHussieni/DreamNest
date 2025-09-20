import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../chat.controller';
import { ChatService } from '../chat.service';

describe('ChatController', () => {
  let controller: ChatController;

  const svc = {
    createChatRoom: jest.fn(),
    getUserChatRooms: jest.fn(),
    getRoomMessages: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: svc }],
    }).compile();

    controller = module.get(ChatController);
  });

  describe('createChatRoom', () => {
    it('forwards [currentUserId, otherUserId] to service', async () => {
      svc.createChatRoom.mockResolvedValue({ id: 10 });
      const res = await controller.createChatRoom(7 as any, { otherUserId: 9 } as any);
      expect(svc.createChatRoom).toHaveBeenCalledWith([7, 9], 7);
      expect(res).toEqual({ id: 10 });
    });

    it('throws when otherUserId missing', async () => {
      await expect(controller.createChatRoom(7 as any, {} as any)).rejects.toThrow();
      expect(svc.createChatRoom).not.toHaveBeenCalled();
    });
  });

  describe('getUserChatRooms', () => {
    it('forwards userId', async () => {
      svc.getUserChatRooms.mockResolvedValue([{ id: 1 }]);
      const res = await controller.getUserChatRooms(5 as any);
      expect(svc.getUserChatRooms).toHaveBeenCalledWith(5);
      expect(res).toEqual([{ id: 1 }]);
    });
  });

  describe('getMessages', () => {
    it('forwards chatRoomId (userId not used by service method)', async () => {
      svc.getRoomMessages.mockResolvedValue([{ id: 1, content: 'yo' }]);
      const res = await controller.getMessages(5 as any, 12 as any);
      expect(svc.getRoomMessages).toHaveBeenCalledWith(12);
      expect(res).toEqual([{ id: 1, content: 'yo' }]);
    });
  });
});
