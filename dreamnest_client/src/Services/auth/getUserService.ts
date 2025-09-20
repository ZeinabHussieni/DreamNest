import api from "../axios/axios";


export interface User {
  id: number;
  userName: string;
  email: string;
  profilePicture?: string | null;
  coins?: number;
  [key: string]: any;
}

export default async function getUserService(): Promise<User | null> {
  const res = await api.get<{ data?: User }>("/auth/me");
  return res.data?.data ?? null;
}
