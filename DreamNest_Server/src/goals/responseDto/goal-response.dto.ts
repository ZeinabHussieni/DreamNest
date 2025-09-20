import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanResponseDto } from '../../plan/responseDto/plan-response.dto';

export class GoalResponseDto {
  @ApiProperty({ example: 101 })
  id: number;

  @ApiProperty({ example: 'Learn Spanish' })
  title: string;

  @ApiProperty({ example: 'Reach A2 in 3 months with daily practice' })
  description: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Do 15 min Duolingo + 1 lesson with tutor weekly',
  })
  helpText?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'vision-123.png',
    description: 'Stored filename for the user’s vision board image',
  })
  visionBoardFilename?: string | null;

  @ApiProperty({
    example: 0.35,
    minimum: 0,
    maximum: 1,
    description: 'Progress in range 0..1 (change if you use 0..100)',
  })
  progress: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: () => [PlanResponseDto],
    description: 'Plans under this goal (optional)',
  })
  plans?: PlanResponseDto[];
}
