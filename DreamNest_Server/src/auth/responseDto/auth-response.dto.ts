export class UserResponseDto {
  id: number;
  firstName: string | null;
  lastName: string | null;
  userName: string;
  email: string;
  visionBoardBase64?: string; 
}

export class AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}
