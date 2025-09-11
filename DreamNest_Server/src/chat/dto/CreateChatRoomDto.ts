import { ApiProperty } from '@nestjs/swagger';


export class CreateChatRoomDto {
  @ApiProperty({ example: 123, description: 'The other user ID to chat with' })
  otherUserId!: number;
}