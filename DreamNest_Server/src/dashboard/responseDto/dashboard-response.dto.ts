import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ example: 12 })
  totalGoals: number;

  @ApiProperty({ example: 7 })
  inProgressGoals: number;

  @ApiProperty({ example: 5 })
  completedGoals: number;

  @ApiProperty({
    description: 'Monthly post counts (key = YYYY-MM)',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { '2025-07': 3, '2025-08': 6, '2025-09': 2 },
  })
  postsPerMonth: Record<string, number>;

  @ApiProperty({
    description: 'Monthly goal counts (key = YYYY-MM)',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { '2025-07': 1, '2025-08': 4, '2025-09': 2 },
  })
  goalsPerMonth: Record<string, number>;
}
