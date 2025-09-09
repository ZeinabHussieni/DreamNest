import {Controller,Get,Post,Delete,Body,UseGuards,BadRequestException,Param,ParseIntPipe,} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { MessageResponseDto } from './responseDto/message-response.dto';

@UseGuards(AccessTokenGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChatRoom(
    @GetUser('sub') currentUserId: number,
    @Body() data: { otherUserId: number },
  ) {
    if (!data.otherUserId) throw new BadRequestException('Other user ID required');
    const userIds = [currentUserId, data.otherUserId];
    return this.chatService.createChatRoom(userIds, currentUserId);
  }

  @Get('rooms')
  async getUserChatRooms(@GetUser('sub') userId: number) {
    return this.chatService.getUserChatRooms(userId);
  }

  @Get('messages/:chatRoomId')
  async getMessages(
    @GetUser('sub') _userId: number,
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getRoomMessages(chatRoomId);
  }

  @Get('unread/summary')
  async unreadSummary(@GetUser('sub') userId: number) {
    return this.chatService.getUnreadSummary(userId);
  }

  @Get('rooms/:roomId/unread')
  async roomUnread(
    @GetUser('sub') userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.chatService.getUnreadForRoom(userId, roomId);
  }

  @Post('rooms/:roomId/read-until/:messageId')
  async readUntil(
    @GetUser('sub') userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    await this.chatService.markReadUntil(userId, roomId, messageId);
    return { ok: true };
  }


}
