import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    if (userIds.length !== 2) throw new BadRequestException('Chat room must have exactly 2 users');

    const users = await this.prisma.user.findMany({ where: { id: { in: userIds } } });
    if (users.length !== 2) throw new NotFoundException('One or both users not found');

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

    return this.prisma.chatRoom.create({
      data: {
        name: otherUser.userName,
        participants: { create: userIds.map((id) => ({ userId: id })) },
      },
      include: { participants: true },
    });
  }

  async getUserChatRooms(userId: number) {
    return this.prisma.chatRoom.findMany({
      where: { participants: { some: { userId } } },
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
  }

  async getRoomMessages(chatRoomId: number): Promise<PrismaMessage[]> {
    return this.prisma.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(chatRoomId: number, senderId: number, content: string): Promise<PrismaMessage> {
    if (!chatRoomId || !senderId || !content) throw new BadRequestException('Missing fields');

    const chatRoom = await this.prisma.chatRoom.findUnique({ where: { id: chatRoomId } });
    if (!chatRoom) throw new NotFoundException('Chat room not found');

    const member = await this.prisma.chatRoomUser.findFirst({
      where: { chatRoomId, userId: senderId },
      select: { id: true },
    });
    if (!member) throw new ForbiddenException('Not a member of this room');

    const message = await this.prisma.message.create({ data: { content, senderId, chatRoomId } });

    const recipients = await this.prisma.chatRoomUser.findMany({
      where: { chatRoomId, userId: { not: senderId } },
      select: { userId: true },
    });

    await Promise.all(
      recipients.map((r) =>
        this.notificationService.createAndPush({
          type: 'CHAT_MESSAGE',
          userId: r.userId,
          actorId: senderId,
          chatRoomId,
          messageId: message.id,
          content: content.slice(0, 120),
        }),
      ),
    );

    await this.bumpLastActive(senderId);
    return message;
  }

  async isParticipant(chatRoomId: number, userId: number) {
    const p = await this.prisma.chatRoomUser.findFirst({ where: { chatRoomId, userId } });
    return !!p;
  }

  async getRoomParticipantIds(roomId: number): Promise<number[]> {
    const rows = await this.prisma.chatRoomUser.findMany({
      where: { chatRoomId: roomId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  async getUnreadForRoom(userId: number, roomId: number) {
    const rp = await this.prisma.chatRoomUser.findUnique({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
    });
    if (!rp) return { count: 0, firstUnreadId: null };

    const first = await this.prisma.message.findFirst({
      where: { chatRoomId: roomId, createdAt: { gt: rp.lastSeenAt }, senderId: { not: userId } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    const count = await this.prisma.message.count({
      where: { chatRoomId: roomId, createdAt: { gt: rp.lastSeenAt }, senderId: { not: userId } },
    });

    return { count, firstUnreadId: first?.id ?? null };
  }

  async getUnreadSummary(userId: number) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: { participants: { some: { userId } } },
      select: { id: true },
    });
    const results = await Promise.all(rooms.map((r) => this.getUnreadForRoom(userId, r.id)));
    return rooms.map((r, i) => ({ roomId: r.id, ...results[i] }));
  }

  async markRoomSeen(userId: number, roomId: number, untilMessageId?: number) {
    await this.prisma.chatRoomUser.update({
      where: { userId_chatRoomId: { userId, chatRoomId: roomId } },
      data: { lastSeenAt: new Date() },
    });

    if (untilMessageId) {
      const unread = await this.prisma.message.findMany({
        where: { chatRoomId: roomId, id: { lte: untilMessageId }, senderId: { not: userId } },
        select: { id: true },
      });
      const data = unread.map((m) => ({ userId, messageId: m.id }));
      if (data.length) await this.prisma.messageRead.createMany({ data, skipDuplicates: true });
    }
  }

  async markDelivered(messageId: number) {
    return this.prisma.message.update({ where: { id: messageId }, data: { deliveredAt: new Date() } });
  }

  async markReadUntil(userId: number, roomId: number, untilMessageId: number) {
    await this.markRoomSeen(userId, roomId, untilMessageId);
    const participants = await this.prisma.chatRoomUser.findMany({
      where: { chatRoomId: roomId },
      select: { userId: true },
    });
    return participants.map((p) => p.userId).filter((id) => id !== userId);
  }

  async bumpLastActive(userId: number) {
    await this.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } });
  }
}
