import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message as PrismaMessage, ChatRoom, ChatRoomUser } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

 async createChatRoom(userIds: number[], currentUserId: number): Promise<ChatRoom> {
  if (userIds.length !== 2) {
    throw new BadRequestException('Chat room must have exactly 2 users');
  }

  // Check if both users exist
  const users = await this.prisma.user.findMany({
    where: { id: { in: userIds } },
  });
  if (users.length !== 2) {
    throw new NotFoundException('One or both users not found');
  }

  // Check if chat room already exists for these 2 users
  const existingRoom = await this.prisma.chatRoom.findFirst({
    where: {
      participants: { every: { userId: { in: userIds } } },
    },
  });
  if (existingRoom) return existingRoom;

  // Find the "other user" (not the logged-in user) for naming
  const otherUser = users.find(u => u.id !== currentUserId);
  if (!otherUser) throw new NotFoundException('Other user not found');

  // Create new chat room
  const chatRoom = await this.prisma.chatRoom.create({
    data: {
      name: otherUser.userName, // use the other user's name
      participants: {
        create: userIds.map(id => ({ userId: id })),
      },
    },
    include: { participants: true },
  });

  return chatRoom;
}


  // all chat rooms for a user
  async getUserChatRooms(userId: number): Promise<ChatRoom[]> {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { participants: { some: { userId } } },
      include: { participants: true, messages: { orderBy: { createdAt: 'asc' } } },
    });
    return rooms;
  }

  //  all messages for a room
  async getRoomMessages(chatRoomId: number): Promise<PrismaMessage[]> {
    return this.prisma.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Send a message in a room
// Send a message in a room
async createMessage(chatRoomId: number, senderId: number, content: string): Promise<PrismaMessage> {
  if (!chatRoomId) throw new BadRequestException('chatRoomId is required');
  if (!senderId) throw new BadRequestException('senderId is required');
  if (!content) throw new BadRequestException('Message content is required');

  const chatRoom = await this.prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
  if (!chatRoom) throw new NotFoundException('Chat room not found');

  return this.prisma.message.create({
    data: { content, senderId, chatRoomId },
  });
}

}
