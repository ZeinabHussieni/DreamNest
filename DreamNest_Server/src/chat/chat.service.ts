import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message as PrismaMessage, ChatRoom } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';


@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService, 
  ) {}

  // create a chat room for  2 users
  async createChatRoom(userIds: number[], currentUserId: number): Promise<ChatRoom> {
    try {
      if (userIds.length !== 2) throw new BadRequestException('Chat room must have exactly 2 users');

      // we check if both users exist
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
      });
      if (users.length !== 2) throw new NotFoundException('One or both users not found');

      // and if chat room already exists
      const existingRoom = await this.prisma.chatRoom.findFirst({
        where: { participants: { every: { userId: { in: userIds } } } },
      });
      if (existingRoom) return existingRoom;

      // we want to name the chatroom depend on other user 
      const otherUser = users.find(u => u.id !== currentUserId);
      if (!otherUser) throw new NotFoundException('Other user not found');

      // create new chat room
      return await this.prisma.chatRoom.create({
        data: {
          name: otherUser.userName,
          participants: { create: userIds.map(id => ({ userId: id })) },
        },
        include: { participants: true },
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw new InternalServerErrorException('Failed to create chat room');
    }
  }

  // all chat rooms for a user
  async getUserChatRooms(userId: number): Promise<ChatRoom[]> {
    try {
      return await this.prisma.chatRoom.findMany({
        where: { participants: { some: { userId } } },
        include: { participants: true, messages: { orderBy: { createdAt: 'asc' } } },
      });
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw new InternalServerErrorException('Failed to fetch chat rooms');
    }
  }

  //  all messages for a room
  async getRoomMessages(chatRoomId: number): Promise<PrismaMessage[]> {
    try {
      return await this.prisma.message.findMany({
        where: { chatRoomId },
        orderBy: { createdAt: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  // send a message in a room
  async createMessage(chatRoomId: number, senderId: number, content: string): Promise<PrismaMessage> {
    try {
      if (!chatRoomId) throw new BadRequestException('chatRoomId is required');
      if (!senderId) throw new BadRequestException('senderId is required');
      if (!content) throw new BadRequestException('Message content is required');

      const chatRoom = await this.prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
      if (!chatRoom) throw new NotFoundException('Chat room not found');


      const message =  await this.prisma.message.create({ data: { content, senderId, chatRoomId } });

     return message;

    } catch (error) {
      console.error('Error sending message:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }
}
