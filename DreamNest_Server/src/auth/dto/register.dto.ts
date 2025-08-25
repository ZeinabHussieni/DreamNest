import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;


  @IsString()
  firstName: string;


  @IsString()
  lastName: string;


  @IsString()
  userName: string;

  @IsOptional()
  @IsString()
  profilePictureBase64?: string; 
}