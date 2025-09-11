import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'zeinab@example.com' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @ApiProperty({
    example: 'superSecure123!',
    minLength: 8,
    description: 'Minimum 8 characters',
  })
  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'zeinab' })
  @IsString({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({ example: 'zeinab' })
  @IsString({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    example: 'zeinab',
    pattern: '^[A-Za-z][A-Za-z0-9._]{2,19}$',
    description: 'Starts with a letter, 3–20 chars, letters/numbers/._ allowed',
  })
  @Matches(/^[A-Za-z][A-Za-z0-9._]{2,19}$/, {
    message: 'Username must start with a letter and be 3–20 characters',
  })
  userName: string;

  @ApiPropertyOptional({
    description: 'Optional base64-encoded profile image',
    format: 'byte',
  })
  @IsOptional()
  @IsString()
  profilePictureBase64?: string;
}
