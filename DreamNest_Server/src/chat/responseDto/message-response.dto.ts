import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 987 })
  id: number;

  @ApiProperty({ example: 'text', enum: ['text', 'audio'] })
  type: string;

  @ApiProperty({ example: 'hii', nullable: true })
  content: string | null;

  @ApiProperty({ example: '/static/voice/voice-12345.webm', nullable: true })
  audioUrl: string | null;

  @ApiProperty({ example: 'مرحبا صديقي', nullable: true })
  transcript: string | null;

  @ApiProperty({ example: 'sent', enum: ['sent', 'delivered', 'read'] })
  status: string;

  @ApiProperty({ example: 123 })
  senderId: number;

  @ApiProperty({ example: 42 })
  chatRoomId: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-09-11T12:34:56Z',
  })
  createdAt: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2025-09-11T12:35:10Z',
    nullable: true,
  })
  deliveredAt: Date | null;
}
