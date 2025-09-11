import {Controller,Get,Post,Param,Body,UseGuards,BadRequestException,ParseIntPipe,} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { MessageResponseDto } from './responseDto/message-response.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';

class CreateChatRoomDto {
  @ApiProperty({ example: 123, description: 'The other user ID to chat with' })
  otherUserId!: number;
}

@ApiTags('chat')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create (or get) a chat room with another user' })
  @ApiBody({ type: CreateChatRoomDto })
  @ApiBadRequestResponse({ description: 'Other user ID required' })
  async createChatRoom(
    @GetUser('sub') currentUserId: number,
    @Body() data: CreateChatRoomDto,
  ) {
    if (!data.otherUserId) throw new BadRequestException('Other user ID required');
    const userIds = [currentUserId, data.otherUserId];
    return this.chatService.createChatRoom(userIds, currentUserId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List chat rooms for the current user' })
  async getUserChatRooms(@GetUser('sub') userId: number) {
    return this.chatService.getUserChatRooms(userId);
  }

  @Get('messages/:chatRoomId')
  @ApiOperation({ summary: 'Get messages in a chat room' })
  @ApiParam({ name: 'chatRoomId', type: Number, example: 42 })
  @ApiOkResponse({ type: MessageResponseDto, isArray: true })
  async getMessages(
    @GetUser('sub') _userId: number,
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getRoomMessages(chatRoomId);
  }

  @Get('unread/summary')
  @ApiOperation({ summary: 'Get unread counts per room' })
  async unreadSummary(@GetUser('sub') userId: number) {
    return this.chatService.getUnreadSummary(userId);
  }

  @Get('rooms/:roomId/unread')
  @ApiOperation({ summary: 'Get unread count for a room' })
  @ApiParam({ name: 'roomId', type: Number, example: 42 })
  async roomUnread(
    @GetUser('sub') userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.chatService.getUnreadForRoom(userId, roomId);
  }

  @Post('rooms/:roomId/read-until/:messageId')
  @ApiOperation({ summary: 'Mark messages as read up to a message ID' })
  @ApiParam({ name: 'roomId', type: Number, example: 42 })
  @ApiParam({ name: 'messageId', type: Number, example: 999 })
  async readUntil(
    @GetUser('sub') userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    await this.chatService.markReadUntil(userId, roomId, messageId);
    return { ok: true };
  }
}
