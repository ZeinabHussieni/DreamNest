import { Controller, Delete, Get, Patch, ParseIntPipe, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { NotificationResponseDto } from './responseDto/notification-response.dto';

import {ApiTags,ApiBearerAuth,ApiOperation,ApiOkResponse,ApiUnauthorizedResponse,ApiParam,} from '@nestjs/swagger';

@ApiTags('notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(AccessTokenGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  async getAll(@GetUser('sub') userId: number): Promise<NotificationResponseDto[]> {
    return this.notificationService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', type: Number, example: 123 })
  @ApiOkResponse({ type: NotificationResponseDto })
  async markRead(@Param('id', ParseIntPipe) id: number): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification by ID' })
  @ApiParam({ name: 'id', type: Number, example: 123 })
  @ApiOkResponse({ description: 'Notification deleted' })
  async deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.deleteById(id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications for the current user' })
  @ApiOkResponse({ description: 'All notifications deleted' })
  async deleteAllForUser(@GetUser('sub') userId: number) {
    return this.notificationService.deleteAllForUser(userId);
  }
}
