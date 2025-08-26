import { IsString, IsOptional } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsString()
  visionBoardBase64?: string; 
}
