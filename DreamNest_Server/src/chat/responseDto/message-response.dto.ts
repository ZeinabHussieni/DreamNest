import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 987 })
  id: number;

  @ApiProperty({ example: 'hii' })
  content: string;

  @ApiProperty({ example: 123 })
  senderId: number;

  @ApiProperty({ example: 42 })
  chatRoomId: number;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-09-11T12:34:56Z' })
  createdAt: Date;
}
