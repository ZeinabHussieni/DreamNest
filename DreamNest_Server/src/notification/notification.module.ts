import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './gateway/notification.gateway';
import { NotificationController } from './notification.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [PrismaService, NotificationService, NotificationGateway],
  controllers: [NotificationController],
  exports: [NotificationService], 
})
export class NotificationModule {}
