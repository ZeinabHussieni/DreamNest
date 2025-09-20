import api from "../axios/axios";


export interface RegisterPayload {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  profilePicture?: string | null;
}


export interface RegisterResponse {
  success: boolean;
  statusCode: number;
  path: string;
  timestamp: string;
  data: {
    user: {
      id: number;
      firstName: string;
      lastName: string;
      userName: string;
      email: string;
      coins: number;
      profilePicture?: string | null;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export default async function registerService(
  data: RegisterPayload
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>("/auth/register", data);
  return response.data;
}
