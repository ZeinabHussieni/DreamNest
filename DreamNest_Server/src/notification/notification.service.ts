import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Notification as PrismaNotification } from '@prisma/client';
import { NotificationGateway } from './gateway/notification.gateway'; 

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private readonly notifGateway: NotificationGateway, 
  ) {}

  async createNotification(data: {
    type: string;
    userId: number;
    actorId?: number;
    goalId?: number;
    planId?: number;
    postId?: number;
    chatRoomId?: number;
    messageId?: number;
    content: string;
  }): Promise<PrismaNotification> {
    try {
      return await this.prisma.notification.create({ data });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new InternalServerErrorException('Failed to create notification');
    }
  }


  async createAndPush(data: {
    type: string;
    userId: number;
    actorId?: number;
    goalId?: number;
    planId?: number;
    postId?: number;
    chatRoomId?: number;
    messageId?: number;
    content: string;
  }): Promise<PrismaNotification> {
    const row = await this.createNotification(data);

    this.notifGateway.pushNotification(data.userId, row);
    return row;
  }

  async getUserNotifications(userId: number): Promise<PrismaNotification[]> {
    try {
      return await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async markAsRead(notificationId: number): Promise<PrismaNotification> {
    try {
      return await this.prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      if (error.code === 'P2025') throw new NotFoundException('Notification not found');
      throw new InternalServerErrorException('Failed to mark notification as read');
    }
  }

   async deleteById(id: number): Promise<{ success: boolean }> {
    try {
      await this.prisma.notification.delete({ where: { id } });
      return { success: true };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new NotFoundException('Notification not found');
      }
      throw new InternalServerErrorException('Failed to delete notification');
    }
  }



  async deleteAllForUser(userId: number): Promise<{ success: boolean; deletedCount: number }> {
    try {
      const res = await this.prisma.notification.deleteMany({ where: { userId } });
      if (res.count === 0) {
        throw new NotFoundException('No notifications found for this user');
      }
      return { success: true, deletedCount: res.count };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete user notifications');
    }
  }
}
