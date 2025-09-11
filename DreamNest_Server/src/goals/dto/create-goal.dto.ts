import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'Learn Spanish' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Reach A2 in 3 months with daily practice' })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Do 15 min Duolingo + 1 tutor lesson weekly',
  })
  @IsOptional()
  @IsString()
  helpText?: string;

  @ApiPropertyOptional({
    description: 'Optional base64-encoded vision board image',
    format: 'byte',
  })
  @IsOptional()
  @IsString()
  visionBoardBase64?: string;
}
