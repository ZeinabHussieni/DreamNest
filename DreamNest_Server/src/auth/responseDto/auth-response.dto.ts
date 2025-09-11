import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiPropertyOptional({ nullable: true, example: 'zeinab' })
  firstName: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'ah' })
  lastName: string | null;

  @ApiProperty({ example: 'zeinab' })
  userName: string;

  @ApiProperty({ example: 'zeinab@example.com' })
  email: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://cdn.example.com/avatars/123.png',
  })
  profilePicture?: string | null;
}
export class AuthResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    readOnly: true,
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    readOnly: true,
  })
  refreshToken: string;
}