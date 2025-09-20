import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';
import { NotificationModule } from '../notification/notification.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';
import { OpenaiModule } from '../openai/openai.module'; 
import { AgentModule } from 'src/agent/agent.module'; 


@Module({
  controllers: [GoalsController],
  providers: [GoalsService],
  imports: [NotificationModule,DashboardModule,OpenaiModule,AgentModule], 
})
export class GoalsModule {}
