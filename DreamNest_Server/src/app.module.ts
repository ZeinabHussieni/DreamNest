import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule} from '@nestjs/config';
import { GoalsModule } from './goals/goals.module';
import { PlanModule } from './plan/plan.module';
import { PostModule } from './post/post.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { AutomationModule } from './automation/jobs/automation.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import { OpenAIService } from './openai/openai.service';
import { OpenaiModule } from './openai/openai.module';
import { ConnectionsController } from './connections/connections.controller';
import { ConnectionsService } from './connections/connections.service';
import { ConnectionsModule } from './connections/connections.module';
import { CoinsModule } from './coins/coins.module';

@Module({
  imports: [
  ScheduleModule.forRoot(),
  AutomationModule,
  ConfigModule.forRoot({ isGlobal: true }),
  AuthModule, UserModule, PrismaModule, GoalsModule,PlanModule, PostModule, ChatModule, NotificationModule, AutomationModule, DashboardModule,OpenaiModule, ConnectionsModule, CoinsModule

],
  controllers: [DashboardController, ConnectionsController],
  providers: [OpenAIService, ConnectionsService],
})
export class AppModule {}
