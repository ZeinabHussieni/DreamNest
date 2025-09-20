import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostUserMiniDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'zanouba' })
  userName: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://cdn.example.com/avatars/123.png',
  })
  profilePicture?: string | null;
}

export class PostResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'hello dreamnest' })
  content: string;

  @ApiProperty({ example: 123 })
  user_id: number;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-09-11T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-09-11T10:05:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: PostUserMiniDto, description: 'Lightweight author info' })
  user?: PostUserMiniDto;
}
