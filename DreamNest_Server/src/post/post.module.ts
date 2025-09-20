import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { NotificationModule } from '../notification/notification.module';
import { DashboardModule } from 'src/dashboard/dashboard.module';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports: [NotificationModule,DashboardModule]
})
export class PostModule {}
