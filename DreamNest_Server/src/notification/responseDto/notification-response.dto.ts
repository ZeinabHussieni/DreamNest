import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export enum NotificationType {
  POST_LIKED = 'post_liked',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  GOAL_ASSIGNED = 'goal_assigned',
  PLAN_UPDATED = 'plan_updated',
  MESSAGE = 'message',
}

export class NotificationResponseDto {
  @ApiProperty({ example: 1001 })
  id: number;

  @ApiProperty({
    example: NotificationType.POST_LIKED,
  })
  type: NotificationType | string;

  @ApiProperty({ example: 123, description: 'Recipient user ID' })
  userId: number;

  @ApiPropertyOptional({ nullable: true, example: 456, description: 'Actor user ID (if any)' })
  actorId: number | null;

  @ApiPropertyOptional({ nullable: true, example: 42 })
  goalId: number | null;

  @ApiPropertyOptional({ nullable: true, example: 7 })
  planId: number | null;

  @ApiPropertyOptional({ nullable: true, example: 555 })
  postId: number | null;

  @ApiPropertyOptional({ nullable: true, example: 999 })
  chatRoomId: number | null;

  @ApiPropertyOptional({ nullable: true, example: 321 })
  messageId: number | null;

  @ApiProperty({ example: 'Ali liked your post 💫' })
  content: string;

  @ApiProperty({ example: false })
  read: boolean;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-09-11T12:34:56.000Z' })
  createdAt: Date;
}
