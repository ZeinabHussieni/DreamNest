import { Module } from '@nestjs/common';
import { ChatGateway } from './gateway/chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { NotificationModule } from '../notification/notification.module';
import { TranscribeModule } from 'src/transcribe/transcribe.module';
import { StorageModule } from 'src/storage/storage.module';
import { ModerationModule } from 'src/moderation/moderation.module';


@Module({
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  imports: [NotificationModule,ModerationModule,TranscribeModule,StorageModule],
  exports: [ChatService],  
})
export class ChatModule {}
