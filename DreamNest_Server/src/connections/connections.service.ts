import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async getUserConnections(userId: number) {
    return this.prisma.connection.findMany({
      where: {
        OR: [{ seeker_id: userId }, { helper_id: userId }],
      },
      include: {
        helper: { select: { id: true, userName: true } },
        seeker: { select: { id: true, userName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptConnection(connectionId: number, userId: number) {
    const connection = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'accepted' },
    });

    if (!connection) throw new NotFoundException('Connection not found');

    const otherUserId =
      connection.helper_id === userId ? connection.seeker_id : connection.helper_id;

    const chatRoom = await this.chatService.createChatRoom(
      [userId, otherUserId],
      userId,
    );

    return { connection, chatRoom };
  }

  async rejectConnection(connectionId: number, userId: number) {
    const connection = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'rejected' },
    });

    if (!connection) throw new NotFoundException('Connection not found');

    return { connection };
  }
}
