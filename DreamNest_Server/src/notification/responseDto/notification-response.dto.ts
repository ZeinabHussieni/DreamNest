export class NotificationResponseDto {
  id: number;
  type: string;
  userId: number;
  actorId: number | null;
  goalId: number | null;
  planId: number | null;
  postId: number | null;
  chatRoomId: number | null;
  messageId: number | null;
  content: string;
  read: boolean;
  createdAt: Date;
}
