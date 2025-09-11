import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Message as PrismaMessage, ChatRoom } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { ModerationService } from 'src/moderation/moderation.service';
import { TranscribeService } from 'src/transcribe/transcribe.service';
import { StorageService } from 'src/storage/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

type HandleVoiceArgs = {
  userId: number;
  roomId: number;
  file: Express.Multer.File;
};


@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly moderation: ModerationService,
    private readonly transcribe: TranscribeService,
    private readonly storage: StorageService,
    private readonly events: EventEmitter2, 
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

  async createTextMessage(chatRoomId: number, senderId: number, content: string) {
  if (!chatRoomId || !senderId || !content?.trim()) throw new BadRequestException('Missing fields');

  const isMember = await this.isParticipant(chatRoomId, senderId);
  if (!isMember) throw new ForbiddenException('Not a member of this room');

  const verdict = await this.moderation.isBlocked(content);
  if (!verdict.ok) throw new BadRequestException('MESSAGE_BLOCKED');

  const message = await this.prisma.message.create({
    data: { chatRoomId, senderId, type: 'text', content, status: 'sent' },
  });

  await this.notifyOthers(chatRoomId, senderId, content.slice(0, 120));
  await this.bumpLastActive(senderId);
  return message;
}

 async handleVoiceUploadAndCreateMessage({ userId, roomId, file }: HandleVoiceArgs) {
    if (!roomId || !userId || !file) throw new BadRequestException('Missing fields');
    const tmpPath = await this.saveUploadToTemp(file);
    try {
     const msg = await this.createAudioMessage(roomId, userId, tmpPath, file.originalname);
     this.events.emit('chat.message.created', { roomId, message: msg });

      return msg;
    } finally {
      try { await fsp.rm(tmpPath, { force: true }); } catch {}
   }
 }


  private async saveUploadToTemp(file: Express.Multer.File): Promise<string> {
    if ((file as any).path) return (file as any).path;

    const dir = path.join(process.cwd(), 'storage', 'voice', 'tmp');
    await fsp.mkdir(dir, { recursive: true });
    const base = `up-${Date.now()}-${randomUUID()}.webm`;
    const tmpPath = path.join(dir, base);
    await fsp.writeFile(tmpPath, file.buffer);
    return tmpPath;
  }

  async createAudioMessage(
    chatRoomId: number,
    senderId: number,
    tempPath: string,
    originalFilename?: string
  ) {
    if (!chatRoomId || !senderId || !tempPath) throw new BadRequestException('Missing fields');

    const isMember = await this.isParticipant(chatRoomId, senderId);
    if (!isMember) {
      try { await fsp.rm(tempPath, { force: true }); } catch {}
      throw new ForbiddenException('Not a member of this room');
    }

    const { text } = await this.transcribe.transcribeWebm(tempPath);

    const verdict = await this.moderation.isBlocked(text);
    if (!verdict.ok) {
      try { await fsp.rm(tempPath, { force: true }); } catch {}
      throw new BadRequestException('VOICE_BLOCKED');
    }

    const saved = await this.storage.moveTempToVoices(tempPath, originalFilename);

    const message = await this.prisma.message.create({
      data: {
        chatRoomId,
        senderId,
        type: 'audio',
        audioUrl: saved.url,
        transcript: text,
        status: 'sent',
      },
    });

    await this.notifyOthers(chatRoomId, senderId, text.slice(0, 120));
    await this.bumpLastActive(senderId);
    return message;
  }


private async notifyOthers(chatRoomId: number, senderId: number, preview: string) {
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
        content: preview,
      }),
    ),
  );
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
