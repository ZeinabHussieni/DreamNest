import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { NotificationModule } from '../notification/notification.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';

@Module({
  controllers: [GoalsController],
  providers: [GoalsService],
  imports: [NotificationModule,DashboardModule], 
})
export class GoalsModule {}
