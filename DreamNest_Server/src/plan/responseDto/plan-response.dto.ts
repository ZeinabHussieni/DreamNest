import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'Workout' })
  title: string;

  @ApiProperty({ example: 'Run 5km every morning' })
  description: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-09-11T10:00:00Z' })
  due_date: Date;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: 42 })
  goal_id: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
