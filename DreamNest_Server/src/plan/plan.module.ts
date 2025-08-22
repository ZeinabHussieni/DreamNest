import { Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule], 
  controllers: [PlanController],
  providers: [PlanService]
})
export class PlanModule {}
