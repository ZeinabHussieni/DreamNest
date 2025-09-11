import {Controller,Get,Post,Param,Body,UseGuards,BadRequestException,ParseIntPipe,} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { MessageResponseDto } from './responseDto/message-response.dto';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatGateway } from './gateway/chat.gateway';
import { SendVoiceDto } from './dto/SendVoiceDto';
import { SendTextDto } from './dto/SendTextDto';
import { CreateChatRoomDto } from './dto/CreateChatRoomDto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';


@ApiTags('chat')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService,
      private readonly chatGateway: ChatGateway,
  ) {}

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

@Post('messages/text')
@ApiOperation({ summary: 'Send a moderated text message' })
@ApiBody({ type: SendTextDto })
@ApiOkResponse({ type: MessageResponseDto })
async sendText(
  @GetUser('sub') userId: number,
  @Body() body: SendTextDto,
): Promise<MessageResponseDto> {
  if (!body?.roomId || !body?.content?.trim()) {
    throw new BadRequestException('roomId and content are required');
  }
  return this.chatService.createTextMessage(body.roomId, userId, body.content);
}

@Post('messages/voice')
@ApiOperation({ summary: 'Send a voice note (transcribe + moderate + save)' })
@ApiConsumes('multipart/form-data')
@UseInterceptors(FileInterceptor('audio')) 
@ApiOkResponse({ type: MessageResponseDto })
async sendVoice(
  @GetUser('sub') userId: number,
  @Body() body: SendVoiceDto,
  @UploadedFile() file?: Express.Multer.File,
): Promise<MessageResponseDto> {
  if (!file) throw new BadRequestException('audio file required (form-data key: audio)');
  return this.chatService.handleVoiceUploadAndCreateMessage({
    userId,
    roomId: body.roomId,
    file,
  });
}
}