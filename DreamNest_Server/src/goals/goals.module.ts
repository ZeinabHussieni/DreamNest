import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [GoalsController],
  providers: [GoalsService],
  imports: [NotificationModule], 
})
export class GoalsModule {}
