import { ApiProperty } from '@nestjs/swagger';

export class SendTextDto {
  @ApiProperty({ example: 42 }) roomId!: number;
  @ApiProperty({ example: 'hey there!' }) content!: string;
}