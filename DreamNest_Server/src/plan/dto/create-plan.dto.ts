import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Morning run' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Run 5km every morning' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'ISO date/time string',
    type: String,
    format: 'date-time',
    example: '2025-09-11T07:00:00Z',
  })
  @IsDateString()
  due_date: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
