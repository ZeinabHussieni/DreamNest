export class UserDto {
  id: number;
  userName: string;
}

export class ConnectionResponseDto {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  seeker: UserDto;
  helper: UserDto;
  createdAt: Date;
}
