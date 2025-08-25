import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  imports: [NotificationModule],
  exports: [ChatService],  
})
export class ChatModule {}
