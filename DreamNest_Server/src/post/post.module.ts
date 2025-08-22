import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [PostController],
  providers: [PostService],
  imports: [NotificationModule]
})
export class PostModule {}
