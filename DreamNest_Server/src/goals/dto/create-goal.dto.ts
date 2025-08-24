import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  help_text?: string;

  @IsOptional()
  @IsString()
vision_board_filename: String


}
