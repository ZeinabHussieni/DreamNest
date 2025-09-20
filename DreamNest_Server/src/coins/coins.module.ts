import { Module } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { CoinsController } from './coins.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [CoinsController],
  imports: [NotificationModule], 
  providers: [CoinsService, PrismaService],
  exports: [CoinsService],
})
export class CoinsModule {}
