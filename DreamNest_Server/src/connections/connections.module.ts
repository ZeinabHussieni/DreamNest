import { Module } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { ConnectionsController } from './connections.controller';
import { ChatModule } from '../chat/chat.module'; // example, only if you need it


@Module({
  imports: [ChatModule], 
  controllers: [ConnectionsController],
  providers: [ConnectionsService],
  exports: [ConnectionsService], 
})
export class ConnectionsModule {}
