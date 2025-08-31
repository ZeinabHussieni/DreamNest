import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from '../chat/chat.service';
import { ConnectionDecision, ConnectionStatus } from '@prisma/client';

@Injectable()
export class ConnectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async getUserConnections(userId: number) {
    return this.prisma.connection.findMany({
      where: { OR: [{ seeker_id: userId }, { helper_id: userId }] },
      include: {
        helper: { select: { id: true, userName: true, profilePicture: true } },
        seeker: { select: { id: true, userName: true, profilePicture: true } },
        goal:   { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptConnection(connectionId: number, userId: number) {
    const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!conn) throw new NotFoundException('Connection not found');

    if (conn.helper_id !== userId && conn.seeker_id !== userId) {
      throw new ForbiddenException('Not your connection');
    }

    const data =
      conn.helper_id === userId
        ? { helperDecision: 'accepted' as ConnectionDecision }
        : { seekerDecision: 'accepted' as ConnectionDecision };

    const updated = await this.prisma.connection.update({ where: { id: connectionId }, data });

    const bothAccepted =
      updated.helperDecision === 'accepted' && updated.seekerDecision === 'accepted';

    if (!bothAccepted) return { connection: updated, chatRoom: null };

    // to mark accepted and create chat
    const room = await this.chatService.createChatRoom(
      [updated.helper_id, updated.seeker_id],
      userId
    );

    const finalConn = await this.prisma.connection.update({
      where: { id: updated.id },
      data: { status: 'accepted' as ConnectionStatus, chatRoomId: room.id },
      include: {
        helper: { select: { id: true, userName: true } },
        seeker: { select: { id: true, userName: true } },
        goal:   { select: { id: true, title: true } },
      },
    });

    return { connection: finalConn, chatRoom: room };
  }

  async rejectConnection(connectionId: number, userId: number) {
    const conn = await this.prisma.connection.findUnique({ where: { id: connectionId } });
    if (!conn) throw new NotFoundException('Connection not found');

    if (conn.helper_id !== userId && conn.seeker_id !== userId) {
      throw new ForbiddenException('Not your connection');
    }

    const data =
      conn.helper_id === userId
        ? { helperDecision: 'rejected' as ConnectionDecision, status: 'rejected' as ConnectionStatus }
        : { seekerDecision: 'rejected' as ConnectionDecision, status: 'rejected' as ConnectionStatus };

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data,
    });

    return { connection: updated, chatRoom: null };
  }
  
}
