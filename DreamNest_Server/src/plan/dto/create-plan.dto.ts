import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  completed?: boolean; 
}
