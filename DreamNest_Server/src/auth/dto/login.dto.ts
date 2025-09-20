import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email or username',
    example: 'zeinab@example.com',
  })
  @IsString({ message: 'Email or username is required' })
  @IsNotEmpty({ message: 'Email or username is required' })
  identifier: string;

  @ApiProperty({
    description: 'Account password',
    example: 'superSecure123!',
    minLength: 8,
  })
  @IsString({ message: 'Password is required' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
