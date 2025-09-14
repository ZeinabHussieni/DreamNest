import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatRoom, Prisma } from '@prisma/client';
import { NotificationService } from 'src/notification/notification.service';
import { ModerationService } from 'src/moderation/moderation.service';
import { TranscribeService } from 'src/transcribe/transcribe.service';
import { StorageService } from 'src/storage/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DashboardGateway } from 'src/dashboard/gateway/dashboard.gateway';

type HandleVoiceArgs = {
  userId: number;
  roomId: number;
  file: Express.Multer.File;
};

type HandleImageArgs = {
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
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  private async ensureModRow(tx: Prisma.TransactionClient, userId: number) {
    await tx.userModeration.upsert({ where: { userId }, create: { userId }, update: {} });
  }

  private async bumpInfraction(tx: Prisma.TransactionClient, userId: number, kind: 'text' | 'voice' | 'image') {
    const data: any = { totalInfractions: { increment: 1 } };
    if (kind === 'text') data.textInfractions = { increment: 1 };
    if (kind === 'voice') data.voiceInfractions = { increment: 1 };
    if (kind === 'image') data.imageInfractions = { increment: 1 };
    const mod = await tx.userModeration.update({ where: { userId }, data });
    if (!mod.chatBlocked && mod.totalInfractions >= 7) {
      await tx.userModeration.update({ where: { userId }, data: { chatBlocked: true, chatBlockedAt: new Date() } });
    }
    if (!mod.siteBlocked && mod.totalInfractions >= 15) {
      await tx.userModeration.update({ where: { userId }, data: { siteBlocked: true, siteBlockedAt: new Date() } });
    }
  }

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
    const rooms = await this.prisma.chatRoom.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            chatRoomId: true,
            lastSeenAt: true,
            user: { select: { id: true, userName: true, profilePicture: true, lastActiveAt: true } },
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    return rooms.map((r) => ({ ...r, messages: this.toSafeMessages(r.messages) }));
  }

  private toSafeMessages(list: any[]) {
    return list.map((m) => this.toSafeMessage(m));
  }

  async getRoomMessages(chatRoomId: number) {
    const rows = await this.prisma.message.findMany({
      where: { chatRoomId },
      orderBy: { createdAt: 'asc' },
    });
    return this.toSafeMessages(rows);
  }

  async createTextMessage(chatRoomId: number, senderId: number, content: string) {
    if (!chatRoomId || !senderId || !content?.trim()) throw new BadRequestException('Missing fields');
    await this.assertChatAllowed(senderId);

    const isMember = await this.isParticipant(chatRoomId, senderId);
    if (!isMember) throw new ForbiddenException('Not a member of this room');

    const blockedVerdict = await this.moderation.isBlocked(content);
    const { isBad: censorHit, censored } = this.moderation.censor(content);
    const isBad = censorHit || !blockedVerdict.ok;

    const message = await this.prisma.$transaction(async (tx) => {
      await this.ensureModRow(tx, senderId);
      const msg = await tx.message.create({
        data: {
          chatRoomId,
          senderId,
          type: 'text',
          content,
          censoredContent: isBad ? censored : null,
          status: isBad ? 'delivered_censored' : 'delivered',
          isBad,
          badReason: isBad ? 'profanity' : null,
          moderatedAt: isBad ? new Date() : null,
          deliveredAt: new Date(),
        },
      });
      if (isBad) {
        await this.bumpInfraction(tx, senderId, 'text');
        await this.dashboardGateway.emitAdminDashboardUpdate();
      }
      return msg;
    });

    const preview = (isBad ? message.censoredContent : content)?.slice(0, 120) ?? '';
    await this.notifyOthers(chatRoomId, senderId, preview);
    await this.bumpLastActive(senderId);
    return this.toSafeMessage(message);
  }

  async handleVoiceUploadAndCreateMessage({ userId, roomId, file }: HandleVoiceArgs) {
    if (!roomId || !userId || !file) throw new BadRequestException('Missing fields');
    const tmpPath = await this.saveUploadToTemp(file);
    try {
      const msg = await this.createAudioMessage(roomId, userId, tmpPath, file.originalname);
      if (msg.status === 'delivered') {
        this.events.emit('chat.message.created', { roomId, message: msg });
      }
      return msg;
    } finally {
      try {
        await fsp.rm(tmpPath, { force: true });
      } catch {}
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

  async createAudioMessage(chatRoomId: number, senderId: number, tempPath: string, originalFilename?: string) {
    if (!chatRoomId || !senderId || !tempPath) throw new BadRequestException('Missing fields');
    await this.assertChatAllowed(senderId);

    const isMember = await this.isParticipant(chatRoomId, senderId);
    if (!isMember) {
      try {
        await fsp.rm(tempPath, { force: true });
      } catch {}
      throw new ForbiddenException('Not a member of this room');
    }

    const { text } = await this.transcribe.transcribeWebm(tempPath);
    const verdict = await this.moderation.isBlocked(text);

    const message = await this.prisma.$transaction(async (tx) => {
      await this.ensureModRow(tx, senderId);

      if (!verdict.ok) {
        const savedQ = await this.storage.moveTempToVoicesQuarantine(tempPath, originalFilename);
        const msg = await tx.message.create({
          data: {
            chatRoomId,
            senderId,
            type: 'voice',
            audioUrl: null,
            transcript: text,
            status: 'blocked',
            isBad: true,
            badReason: 'harmful_voice',
            quarantineUrl: savedQ.filePath,
            moderatedAt: new Date(),
          },
        });
        await this.bumpInfraction(tx, senderId, 'voice');
        return msg;
      } else {
        const saved = await this.storage.moveTempToVoicesPublic(tempPath, originalFilename);
        const msg = await tx.message.create({
          data: {
            chatRoomId,
            senderId,
            type: 'voice',
            audioUrl: saved.url,
            transcript: text,
            status: 'delivered',
            deliveredAt: new Date(),
            isBad: false,
          },
        });
        return msg;
      }
    });

    if (message.status === 'delivered') {
      const preview = message.transcript?.slice(0, 120) ?? '🎤 Voice message';
      await this.notifyOthers(chatRoomId, senderId, preview);
      await this.bumpLastActive(senderId);
      return this.toSafeMessage(message);
    }

    try {
      await fsp.rm(tempPath, { force: true });
    } catch {}
    await this.dashboardGateway.emitAdminDashboardUpdate();
    return this.toSafeMessage(message);
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

  async handleImageUploadAndCreateMessage({ userId, roomId, file }: HandleImageArgs) {
    if (!roomId || !userId || !file) throw new BadRequestException('Missing fields');
    await this.assertChatAllowed(userId);
    if (!file.mimetype?.startsWith('image/')) throw new BadRequestException('Only image files are allowed');

    const tmpPath = await this.saveUploadToTempImage(file);
    try {
      const isMember = await this.isParticipant(roomId, userId);
      if (!isMember) throw new ForbiddenException('Not a member of this room');

      const buf = (file as any).buffer ? file.buffer : await fsp.readFile(tmpPath);
      const verdict = await this.moderation.isImageBlocked(buf, file.mimetype || 'image/jpeg');

      const message = await this.prisma.$transaction(async (tx) => {
        await this.ensureModRow(tx, userId);

        if (!verdict.ok) {
          const q = await this.storage.moveTempToImagesQuarantine(tmpPath, file.originalname);
          const msg = await tx.message.create({
            data: {
              chatRoomId: roomId,
              senderId: userId,
              type: 'image',
              imageUrl: null,
              status: 'blocked',
              isBad: true,
              badReason: 'harmful_image',
              quarantineUrl: q.filePath,
              moderatedAt: new Date(),
            },
          });
          await this.bumpInfraction(tx, userId, 'image');
          return msg;
        } else {
          const saved = await this.storage.moveTempToImagesPublic(tmpPath, file.originalname);
          const msg = await tx.message.create({
            data: {
              chatRoomId: roomId,
              senderId: userId,
              type: 'image',
              imageUrl: saved.url,
              status: 'delivered',
              deliveredAt: new Date(),
              isBad: false,
            },
          });
          return msg;
        }
      });

      if (message.status === 'delivered') {
        await this.notifyOthers(roomId, userId, '🖼️ Image');
        await this.bumpLastActive(userId);
        this.events.emit('chat.message.created', { roomId, message: this.toSafeMessage(message) });
        return this.toSafeMessage(message);
      }

      await this.dashboardGateway.emitAdminDashboardUpdate();
      return this.toSafeMessage(message);
    } finally {
      try {
        await fsp.rm(tmpPath, { force: true });
      } catch {}
    }
  }

  private async saveUploadToTempImage(file: Express.Multer.File): Promise<string> {
    if ((file as any).path) return (file as any).path;
    const dir = path.join(process.cwd(), 'storage', 'image', 'tmp');
    await fsp.mkdir(dir, { recursive: true });
    const ext = (file.originalname?.split('.').pop() || 'bin').toLowerCase();
    const name = `up-${Date.now()}-${randomUUID()}.${ext}`;
    const tmpPath = path.join(dir, name);
    await fsp.writeFile(tmpPath, file.buffer);
    return tmpPath;
  }

  private toSafeMessage(m: any) {
    if (m.isBad && m.type === 'text') {
      const { quarantineUrl, ...rest } = m;
      return { ...rest, content: null, censoredContent: m.censoredContent ?? '████', quarantineUrl: null };
    }
    if (m.isBad && m.type !== 'text') {
      const { quarantineUrl, ...rest } = m;
      return { ...rest, audioUrl: null, imageUrl: null, transcript: null, quarantineUrl: null };
    }
    return m;
  }

  private async assertChatAllowed(userId: number) {
    const mod = await this.prisma.userModeration.findUnique({ where: { userId } });
    if (mod?.siteBlocked) throw new ForbiddenException('Account suspended.');
    if (mod?.chatBlocked) throw new ForbiddenException('Chat is blocked.');
  }
}
