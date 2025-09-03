import api from "../axios/axios";

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  path: string;
  timestamp: string;
  data: T;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string; 
  user: {
    id: number;
    firstName?: string;
    lastName?: string;
    userName: string; 
    email: string;
    coins?: number;
    profilePicture?: string | null;
    [k: string]: unknown;
  };
}

export default async function loginService(
  data: LoginPayload
): Promise<LoginResult> {
  const response = await api.post<ApiEnvelope<LoginResult>>("/auth/login", data);
  return response.data.data;
}
