import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { NotificationResponseDto } from './responseDto/notification-response.dto';

@UseGuards(AccessTokenGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getAll(@GetUser('sub') userId: number): Promise<NotificationResponseDto[]> {
    return this.notificationService.getUserNotifications(userId);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: number): Promise<NotificationResponseDto>  {
    return this.notificationService.markAsRead(id);
  }
}
