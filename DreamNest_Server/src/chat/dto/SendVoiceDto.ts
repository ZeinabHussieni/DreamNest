import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SendVoiceDto {
  @ApiProperty({ example: 42 })
  @Type(() => Number)
  @IsInt()
  roomId!: number;
}
