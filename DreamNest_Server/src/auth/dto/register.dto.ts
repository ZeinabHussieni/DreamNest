import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsString({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name is required' })
  lastName: string;


  @Matches(/^[A-Za-z][A-Za-z0-9._]{2,19}$/, {
    message: 'Username must start with a letter and be 3–20 characters',
  })
  userName: string;

  @IsOptional()
  @IsString()
  profilePictureBase64?: string;
}
