import { ApiProperty } from '@nestjs/swagger';


export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}


export class UserDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'zeinab' })
  userName: string;
}

export class ConnectionResponseDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({
    example: ConnectionStatus.PENDING,
  })
   status: 'pending' | 'accepted' | 'rejected';

  @ApiProperty({ type: () => UserDto })
  seeker: UserDto;

  @ApiProperty({ type: () => UserDto })
  helper: UserDto;

  @ApiProperty({ type: String, format: 'date-time', example: '2025-09-11T12:34:56Z' })
  createdAt: Date;
}
