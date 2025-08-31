import {Injectable,NotFoundException,ForbiddenException,BadRequestException,InternalServerErrorException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message as PrismaMessage, ChatRoom } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async createChatRoom(userIds: number[], currentUserId: number): Promise<ChatRoom> {
    try {
      if (userIds.length !== 2) {
        throw new BadRequestException('Chat room must have exactly 2 users');
      }

      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
      });
      if (users.length !== 2) {
        throw new NotFoundException('One or both users not found');
      }

      const existingRoom = await this.prisma.chatRoom.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: userIds[0] } } },
            { participants: { some: { userId: userIds[1] } } },
          ],
        },
      });
      if (existingRoom) return existingRoom;

      const otherUser = users.find((u) => u.id !== currentUserId);
      if (!otherUser) throw new NotFoundException('Other user not found');

      return await this.prisma.chatRoom.create({
        data: {
          name: otherUser.userName,
          participants: { create: userIds.map((id) => ({ userId: id })) },
        },
        include: { participants: true },
      });
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw new InternalServerErrorException('Failed to create chat room');
    }
  }

  async getUserChatRooms(userId: number) {
    return this.prisma.chatRoom.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: { select: { id: true, userName: true, profilePicture: true } },
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

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

  async createMessage(
    chatRoomId: number,
    senderId: number,
    content: string,
  ): Promise<PrismaMessage> {
    try {
      if (!chatRoomId || !senderId || !content) {
        throw new BadRequestException('Missing fields');
      }

      const chatRoom = await this.prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
      if (!chatRoom) throw new NotFoundException('Chat room not found');

      const member = await this.prisma.chatRoomUser.findFirst({
        where: { chatRoomId, userId: senderId },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Not a member of this room');

      const message = await this.prisma.message.create({
        data: { content, senderId, chatRoomId },
      });

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  async isParticipant(chatRoomId: number, userId: number) {
    const p = await this.prisma.chatRoomUser.findFirst({ where: { chatRoomId, userId } });
    return !!p;
  }
}
